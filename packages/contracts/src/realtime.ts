import type { Appointment } from './appointments.js';
import type { ChatMessage, ChatSession } from './chat.js';

export interface AssistantStatus {
  sessionId: string;
  replying: boolean;
}

export interface ServerToClientEvents {
  'message:upserted': (message: ChatMessage) => void;
  'session:updated': (session: ChatSession) => void;
  'assistant:status': (status: AssistantStatus) => void;
  'appointment:upserted': (appointment: Appointment) => void;
}
