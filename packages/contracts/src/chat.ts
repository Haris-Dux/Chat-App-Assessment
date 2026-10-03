import { z } from 'zod';
import type { Appointment } from './appointments.js';

export const createSessionSchema = z.object({
  id: z.uuid(),
});

export const sendMessageSchema = z.object({
  id: z.uuid(),
  content: z.string().trim().min(1).max(1000),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export type BookingField = 'service' | 'date' | 'time';

export interface BookingDraft {
  serviceId?: string;
  date?: string;
  time?: string;
  notes?: string;
}

export interface Mention {
  text: string;
  field: BookingField;
  value: string;
}

export type MessageAttachment =
  | { type: 'proposal' }
  | { type: 'form'; missing: BookingField[] }
  | { type: 'slots'; serviceId: string; date: string; times: string[] }
  | { type: 'appointments'; appointments: Appointment[] }
  | { type: 'booked'; appointment: Appointment };

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  mentions: Mention[];
  attachment: MessageAttachment | null;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string | null;
  draft: BookingDraft;
  createdAt: string;
  lastMessageAt: string;
}

export interface ChatSessionDetail extends ChatSession {
  messages: ChatMessage[];
  replying: boolean;
}
