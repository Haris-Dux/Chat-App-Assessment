import type { ChatSession } from '@concierge/contracts';
import type { QueryClient } from '@tanstack/react-query';
import { removeById, upsertById } from '../../lib/collections';
import type { ThreadMessage, ThreadSession } from './types';

export const chatKeys = {
  sessions: ['chat-sessions'] as const,
  session: (id: string) => ['chat-session', id] as const,
};

const byRecentActivity = (a: ChatSession, b: ChatSession) =>
  b.lastMessageAt.localeCompare(a.lastMessageAt);

export function upsertMessage(queryClient: QueryClient, message: ThreadMessage): void {
  queryClient.setQueryData<ThreadSession>(
    chatKeys.session(message.sessionId),
    (session) => session && { ...session, messages: upsertById(session.messages, message) },
  );
}

export function setReplying(queryClient: QueryClient, sessionId: string, replying: boolean): void {
  queryClient.setQueryData<ThreadSession>(
    chatKeys.session(sessionId),
    (session) => session && { ...session, replying },
  );
}

export function upsertSession(queryClient: QueryClient, session: ChatSession): void {
  queryClient.setQueryData<ChatSession[]>(
    chatKeys.sessions,
    (sessions) => sessions && upsertById(sessions, session).sort(byRecentActivity),
  );
  queryClient.setQueryData<ThreadSession>(
    chatKeys.session(session.id),
    (detail) => detail && { ...detail, ...session },
  );
}

export function removeSession(queryClient: QueryClient, sessionId: string): void {
  queryClient.setQueryData<ChatSession[]>(
    chatKeys.sessions,
    (sessions) => sessions && removeById(sessions, sessionId),
  );
}
