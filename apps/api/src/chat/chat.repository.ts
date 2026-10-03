import type { ChatMessage, ChatSession, Mention, SendMessageInput } from '@concierge/contracts';
import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { type Database, InjectDatabase } from '../database/database.js';
import { chatMessages, chatSessions } from '../database/schema.js';
import type { AssistantTurn, SessionState } from './assistant-turn.js';

const SESSION_LIST_LIMIT = 50;

const sessionColumns = {
  id: chatSessions.id,
  title: chatSessions.title,
  draft: chatSessions.draft,
  createdAt: chatSessions.createdAt,
  lastMessageAt: chatSessions.lastMessageAt,
};

const messageColumns = {
  id: chatMessages.id,
  sessionId: chatMessages.sessionId,
  role: chatMessages.role,
  content: chatMessages.content,
  mentions: chatMessages.mentions,
  attachment: chatMessages.attachment,
  createdAt: chatMessages.createdAt,
};

type SessionRow = Omit<ChatSession, 'createdAt' | 'lastMessageAt'> & {
  createdAt: Date;
  lastMessageAt: Date;
};

type MessageRow = Omit<ChatMessage, 'createdAt'> & { createdAt: Date };

export interface SavedMessage {
  message: ChatMessage;
  session: ChatSession;
}

@Injectable()
export class ChatRepository {
  constructor(@InjectDatabase() private readonly db: Database) {}

  async listSessions(userId: string): Promise<ChatSession[]> {
    const rows = await this.db
      .select(sessionColumns)
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.lastMessageAt))
      .limit(SESSION_LIST_LIMIT);
    return rows.map(toSession);
  }

  async findSession(id: string, userId: string): Promise<SessionState | null> {
    const [row] = await this.db
      .select({ session: sessionColumns, stalledTurns: chatSessions.stalledTurns })
      .from(chatSessions)
      .where(and(eq(chatSessions.id, id), eq(chatSessions.userId, userId)));
    return row ? { session: toSession(row.session), stalledTurns: row.stalledTurns } : null;
  }

  async createSession(values: {
    id: string;
    userId: string;
    businessId: string;
  }): Promise<ChatSession | null> {
    const [row] = await this.db
      .insert(chatSessions)
      .values(values)
      .onConflictDoNothing()
      .returning(sessionColumns);
    return row ? toSession(row) : null;
  }

  async listMessages(sessionId: string): Promise<ChatMessage[]> {
    const rows = await this.db
      .select(messageColumns)
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.createdAt));
    return rows.map(toMessage);
  }

  async recentMessages(sessionId: string, limit: number): Promise<ChatMessage[]> {
    const rows = await this.db
      .select(messageColumns)
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
    return rows.reverse().map(toMessage);
  }

  async findMessage(id: string, sessionId: string): Promise<ChatMessage | null> {
    const [row] = await this.db
      .select(messageColumns)
      .from(chatMessages)
      .where(and(eq(chatMessages.id, id), eq(chatMessages.sessionId, sessionId)));
    return row ? toMessage(row) : null;
  }

  addUserMessage(
    sessionId: string,
    { id, content }: SendMessageInput,
    title: string,
  ): Promise<SavedMessage | null> {
    return this.db.transaction(async (tx) => {
      const [message] = await tx
        .insert(chatMessages)
        .values({ id, sessionId, role: 'user', content })
        .onConflictDoNothing()
        .returning(messageColumns);

      if (!message) {
        return null;
      }

      const [session] = await tx
        .update(chatSessions)
        .set({ title, lastMessageAt: message.createdAt })
        .where(eq(chatSessions.id, sessionId))
        .returning(sessionColumns);

      return { message: toMessage(message), session: toSession(session) };
    });
  }

  addAssistantMessage(
    sessionId: string,
    { content, attachment, draft, stalledTurns }: AssistantTurn,
  ): Promise<SavedMessage> {
    return this.db.transaction(async (tx) => {
      const [message] = await tx
        .insert(chatMessages)
        .values({ id: randomUUID(), sessionId, role: 'assistant', content, attachment })
        .returning(messageColumns);

      const [session] = await tx
        .update(chatSessions)
        .set({ draft, stalledTurns, lastMessageAt: message.createdAt })
        .where(eq(chatSessions.id, sessionId))
        .returning(sessionColumns);

      return { message: toMessage(message), session: toSession(session) };
    });
  }

  async updateMentions(id: string, mentions: Mention[]): Promise<ChatMessage> {
    const [row] = await this.db
      .update(chatMessages)
      .set({ mentions })
      .where(eq(chatMessages.id, id))
      .returning(messageColumns);
    return toMessage(row);
  }
}

function toSession(row: SessionRow): ChatSession {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    lastMessageAt: row.lastMessageAt.toISOString(),
  };
}

function toMessage(row: MessageRow): ChatMessage {
  return { ...row, createdAt: row.createdAt.toISOString() };
}
