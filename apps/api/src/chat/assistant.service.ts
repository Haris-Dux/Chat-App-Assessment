import type { ChatMessage } from '@concierge/contracts';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BookingInterpreter } from '../ai/booking-interpreter.js';
import type { AuthUser } from '../auth/auth-user.js';
import { BusinessesService } from '../businesses/businesses.service.js';
import type { AssistantTurn } from './assistant-turn.js';
import { groundMentions } from './booking-draft.js';
import { BookingFlow } from './booking-flow.js';
import { ChatEvents, type UserMessageReceivedEvent } from './chat.events.js';
import { ChatService } from './chat.service.js';
import { ReplyQueue } from './reply-queue.js';

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    private readonly chat: ChatService,
    private readonly businesses: BusinessesService,
    private readonly interpreter: BookingInterpreter,
    private readonly flow: BookingFlow,
    private readonly replies: ReplyQueue,
  ) {}

  @OnEvent(ChatEvents.UserMessageReceived)
  handleUserMessage({ user, message }: UserMessageReceivedEvent): Promise<void> {
    return this.replies.enqueue(message.sessionId, () => this.reply(user, message));
  }

  private async reply(user: AuthUser, message: ChatMessage): Promise<void> {
    this.chat.setReplying(user.userId, message.sessionId, true);

    try {
      const turn = await this.compose(user, message);
      await this.chat.addAssistantTurn(user.userId, message.sessionId, turn);
    } catch (error) {
      this.logger.error(error, 'Assistant reply failed');
      await this.chat
        .addAssistantTurn(user.userId, message.sessionId, this.flow.recover())
        .catch((failure: unknown) => this.logger.error(failure, 'Could not store fallback reply'));
    } finally {
      this.chat.setReplying(user.userId, message.sessionId, false);
    }
  }

  private async compose(user: AuthUser, message: ChatMessage): Promise<AssistantTurn> {
    const [business, state, history] = await Promise.all([
      this.businesses.findById(user.businessId),
      this.chat.loadState(user, message.sessionId),
      this.chat.recentHistory(message.sessionId),
    ]);

    const interpretation = await this.interpreter.interpret({
      sessionId: message.sessionId,
      business,
      draft: state.session.draft,
      history,
    });

    const mentions = interpretation
      ? groundMentions(message.content, interpretation.mentions, business)
      : [];

    if (mentions.length > 0) {
      await this.chat.annotate(user.userId, message.id, mentions);
    }

    return this.flow.next({ user, business, state, interpretation });
  }
}
