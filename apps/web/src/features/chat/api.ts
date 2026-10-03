import type {
  ChatMessage,
  ChatSession,
  ChatSessionDetail,
  CreateSessionInput,
  SendMessageInput,
} from '@concierge/contracts';
import { http } from '../../lib/http';

export const chatApi = {
  listSessions: () => http.get<ChatSession[]>('/chat/sessions'),
  getSession: (id: string) => http.get<ChatSessionDetail>(`/chat/sessions/${id}`),
  createSession: (input: CreateSessionInput) => http.post<ChatSession>('/chat/sessions', input),
  sendMessage: (sessionId: string, input: SendMessageInput) =>
    http.post<ChatMessage>(`/chat/sessions/${sessionId}/messages`, input),
};
