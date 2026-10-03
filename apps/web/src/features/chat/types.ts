import type { ChatMessage, ChatSessionDetail } from '@concierge/contracts';

export type ThreadMessage = ChatMessage & { delivery?: 'sending' | 'failed' };

export type ThreadSession = Omit<ChatSessionDetail, 'messages'> & { messages: ThreadMessage[] };
