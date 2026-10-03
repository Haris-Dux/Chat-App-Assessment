import type { ChatSession, SendMessageInput } from '@concierge/contracts';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from './api';
import { chatKeys, removeSession, setReplying, upsertMessage, upsertSession } from './cache';
import type { ThreadMessage, ThreadSession } from './types';

export const sessionsQuery = queryOptions({
  queryKey: chatKeys.sessions,
  queryFn: chatApi.listSessions,
});

export const sessionQuery = (id: string) =>
  queryOptions<ThreadSession>({
    queryKey: chatKeys.session(id),
    queryFn: () => chatApi.getSession(id),
  });

export function pendingMessage(
  sessionId: string,
  { id, content }: SendMessageInput,
  delivery: ThreadMessage['delivery'] = 'sending',
): ThreadMessage {
  return {
    id,
    sessionId,
    content,
    role: 'user',
    mentions: [],
    attachment: null,
    createdAt: new Date().toISOString(),
    delivery,
  };
}

export function useSendMessage(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendMessageInput) => chatApi.sendMessage(sessionId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.session(sessionId) });
      upsertMessage(queryClient, pendingMessage(sessionId, input));
      setReplying(queryClient, sessionId, true);
    },
    onSuccess: (message) => upsertMessage(queryClient, message),
    onError: (_error, input) => {
      upsertMessage(queryClient, pendingMessage(sessionId, input, 'failed'));
      setReplying(queryClient, sessionId, false);
    },
  });
}

export interface ConversationStart {
  session: ChatSession;
  message: SendMessageInput;
}

export function useStartConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ session, message }: ConversationStart) => {
      await chatApi.createSession({ id: session.id });
      return chatApi.sendMessage(session.id, message);
    },
    onMutate: ({ session }) => upsertSession(queryClient, session),
    onError: (_error, { session }) => removeSession(queryClient, session.id),
  });
}
