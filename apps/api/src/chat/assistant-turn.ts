import type { BookingDraft, ChatSession, MessageAttachment } from '@concierge/contracts';

export interface AssistantTurn {
  content: string;
  attachment: MessageAttachment | null;
  draft?: BookingDraft;
  stalledTurns?: number;
}

export interface SessionState {
  session: ChatSession;
  stalledTurns: number;
}
