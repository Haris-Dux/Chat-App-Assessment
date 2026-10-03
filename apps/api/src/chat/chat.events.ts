import type { AssistantStatus, ChatMessage, ChatSession } from '@concierge/contracts';
import type { AuthUser } from '../auth/auth-user.js';

export const ChatEvents = {
  MessageUpserted: 'chat.message.upserted',
  SessionUpdated: 'chat.session.updated',
  AssistantStatusChanged: 'chat.assistant.status-changed',
  UserMessageReceived: 'chat.user-message.received',
} as const;

export interface MessageUpsertedEvent {
  userId: string;
  message: ChatMessage;
}

export interface SessionUpdatedEvent {
  userId: string;
  session: ChatSession;
}

export interface AssistantStatusChangedEvent {
  userId: string;
  status: AssistantStatus;
}

export interface UserMessageReceivedEvent {
  user: AuthUser;
  message: ChatMessage;
}
