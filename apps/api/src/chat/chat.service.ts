import type {
  ChatMessage,
  ChatSession,
  ChatSessionDetail,
  CreateSessionInput,
  Mention,
  SendMessageInput,
} from '@concierge/contracts';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import {
  APPOINTMENT_SAVED,
  type AppointmentSavedEvent,
} from '../appointments/appointment.events.js';
import type { AuthUser } from '../auth/auth-user.js';
import type { AssistantTurn, SessionState } from './assistant-turn.js';
import {
  ChatEvents,
  type AssistantStatusChangedEvent,
  type MessageUpsertedEvent,
  type SessionUpdatedEvent,
  type UserMessageReceivedEvent,
} from './chat.events.js';
import { ChatRepository, type SavedMessage } from './chat.repository.js';
import { ReplyQueue } from './reply-queue.js';

const TITLE_LENGTH = 60;
const HISTORY_SIZE = 12;

@Injectable()
export class ChatService {
  constructor(
    private readonly chats: ChatRepository,
    private readonly replies: ReplyQueue,
    private readonly events: EventEmitter2,
  ) {}

  listSessions(user: AuthUser): Promise<ChatSession[]> {
    return this.chats.listSessions(user.userId);
  }

  async createSession(user: AuthUser, { id }: CreateSessionInput): Promise<ChatSession> {
    const created = await this.chats.createSession({
      id,
      userId: user.userId,
      businessId: user.businessId,
    });

    if (created) {
      this.emit<SessionUpdatedEvent>(ChatEvents.SessionUpdated, {
        userId: user.userId,
        session: created,
      });
      return created;
    }

    const existing = await this.chats.findSession(id, user.userId);
    if (!existing) {
      throw new ConflictException('This conversation id is already in use');
    }
    return existing.session;
  }

  async getSession(user: AuthUser, id: string): Promise<ChatSessionDetail> {
    const { session } = await this.loadState(user, id);
    const messages = await this.chats.listMessages(id);
    return { ...session, messages, replying: this.replies.isBusy(id) };
  }

  async postMessage(
    user: AuthUser,
    sessionId: string,
    input: SendMessageInput,
  ): Promise<ChatMessage> {
    const { session } = await this.loadState(user, sessionId);
    const saved = await this.chats.addUserMessage(
      sessionId,
      input,
      session.title ?? toTitle(input.content),
    );

    if (!saved) {
      return this.findRetriedMessage(sessionId, input.id);
    }

    this.publish(user.userId, saved);
    this.emit<UserMessageReceivedEvent>(ChatEvents.UserMessageReceived, {
      user,
      message: saved.message,
    });
    return saved.message;
  }

  async loadState(user: AuthUser, sessionId: string): Promise<SessionState> {
    const state = await this.chats.findSession(sessionId, user.userId);

    if (!state) {
      throw new NotFoundException('Conversation not found');
    }

    return state;
  }

  recentHistory(sessionId: string): Promise<ChatMessage[]> {
    return this.chats.recentMessages(sessionId, HISTORY_SIZE);
  }

  async addAssistantTurn(userId: string, sessionId: string, turn: AssistantTurn): Promise<void> {
    this.publish(userId, await this.chats.addAssistantMessage(sessionId, turn));
  }

  async annotate(userId: string, messageId: string, mentions: Mention[]): Promise<void> {
    const message = await this.chats.updateMentions(messageId, mentions);
    this.emit<MessageUpsertedEvent>(ChatEvents.MessageUpserted, { userId, message });
  }

  setReplying(userId: string, sessionId: string, replying: boolean): void {
    this.emit<AssistantStatusChangedEvent>(ChatEvents.AssistantStatusChanged, {
      userId,
      status: { sessionId, replying },
    });
  }

  @OnEvent(APPOINTMENT_SAVED)
  async recordBooking({ userId, change, appointment }: AppointmentSavedEvent): Promise<void> {
    if (change !== 'created' || !appointment.sessionId) {
      return;
    }

    await this.addAssistantTurn(userId, appointment.sessionId, {
      content: `You're booked in for ${appointment.serviceName}. I've added it to your upcoming appointments.`,
      attachment: { type: 'booked', appointment },
      draft: {},
      stalledTurns: 0,
    });
  }

  private async findRetriedMessage(sessionId: string, messageId: string): Promise<ChatMessage> {
    const message = await this.chats.findMessage(messageId, sessionId);

    if (!message) {
      throw new ConflictException('This message id is already in use');
    }

    return message;
  }

  private publish(userId: string, { message, session }: SavedMessage): void {
    this.emit<MessageUpsertedEvent>(ChatEvents.MessageUpserted, { userId, message });
    this.emit<SessionUpdatedEvent>(ChatEvents.SessionUpdated, { userId, session });
  }

  private emit<T>(event: string, payload: T): void {
    this.events.emit(event, payload);
  }
}

function toTitle(content: string): string {
  return content.length <= TITLE_LENGTH
    ? content
    : `${content.slice(0, TITLE_LENGTH - 1).trimEnd()}…`;
}
