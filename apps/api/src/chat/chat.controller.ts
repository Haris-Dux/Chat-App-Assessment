import {
  createSessionSchema,
  sendMessageSchema,
  type ChatMessage,
  type ChatSession,
  type ChatSessionDetail,
  type CreateSessionInput,
  type SendMessageInput,
} from '@concierge/contracts';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { ChatService } from './chat.service.js';

@Controller('chat/sessions')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<ChatSession[]> {
    return this.chat.listSessions(user);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createSessionSchema)) input: CreateSessionInput,
  ): Promise<ChatSession> {
    return this.chat.createSession(user, input);
  }

  @Get(':id')
  find(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ChatSessionDetail> {
    return this.chat.getSession(user, id);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @Post(':id/messages')
  send(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(sendMessageSchema)) input: SendMessageInput,
  ): Promise<ChatMessage> {
    return this.chat.postMessage(user, id, input);
  }
}
