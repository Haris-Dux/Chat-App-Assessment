import type { BookingDraft, MessageAttachment, Mention } from '@concierge/contracts';
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  customType,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

const citext = customType<{ data: string }>({
  dataType: () => 'citext',
});

const timestamptz = () => timestamp({ withTimezone: true });
const createdAt = () => timestamptz().notNull().defaultNow();

export const appointmentStatus = pgEnum('appointment_status', ['confirmed', 'cancelled']);
export const messageRole = pgEnum('message_role', ['user', 'assistant']);
export const aiInteractionStatus = pgEnum('ai_interaction_status', [
  'ok',
  'invalid_output',
  'error',
]);

export const businesses = pgTable(
  'businesses',
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().notNull().unique(),
    name: text().notNull(),
    timezone: text().notNull(),
    opensAt: time().notNull(),
    closesAt: time().notNull(),
    workingDays: smallint().array().notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    check('businesses_hours_check', sql`${table.opensAt} < ${table.closesAt}`),
    check('businesses_working_days_check', sql`${table.workingDays} <@ '{1,2,3,4,5,6,7}'`),
  ],
);

export const users = pgTable(
  'users',
  {
    id: uuid().primaryKey().defaultRandom(),
    businessId: uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    email: citext().notNull(),
    passwordHash: text().notNull(),
    fullName: text().notNull(),
    createdAt: createdAt(),
  },
  (table) => [unique('users_business_email_key').on(table.businessId, table.email)],
);

export const services = pgTable(
  'services',
  {
    id: uuid().primaryKey().defaultRandom(),
    businessId: uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    description: text().notNull(),
    durationMinutes: smallint().notNull(),
    active: boolean().notNull().default(true),
    createdAt: createdAt(),
  },
  (table) => [
    unique('services_business_name_key').on(table.businessId, table.name),
    check('services_duration_check', sql`${table.durationMinutes} between 5 and 480`),
  ],
);

export const chatSessions = pgTable(
  'chat_sessions',
  {
    id: uuid().primaryKey(),
    businessId: uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text(),
    draft: jsonb().$type<BookingDraft>().notNull().default({}),
    stalledTurns: smallint().notNull().default(0),
    createdAt: createdAt(),
    lastMessageAt: timestamptz().notNull().defaultNow(),
  },
  (table) => [
    unique('chat_sessions_id_user_key').on(table.id, table.userId),
    index('chat_sessions_user_recent_idx').on(table.userId, table.lastMessageAt.desc()),
  ],
);

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid().primaryKey(),
    sessionId: uuid()
      .notNull()
      .references(() => chatSessions.id, { onDelete: 'cascade' }),
    role: messageRole().notNull(),
    content: text().notNull(),
    mentions: jsonb().$type<Mention[]>().notNull().default([]),
    attachment: jsonb().$type<MessageAttachment>(),
    createdAt: createdAt(),
  },
  (table) => [index('chat_messages_session_created_idx').on(table.sessionId, table.createdAt)],
);

export const appointments = pgTable(
  'appointments',
  {
    id: uuid().primaryKey(),
    businessId: uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    serviceId: uuid()
      .notNull()
      .references(() => services.id),
    chatSessionId: uuid(),
    startsAt: timestamptz().notNull(),
    endsAt: timestamptz().notNull(),
    status: appointmentStatus().notNull().default('confirmed'),
    notes: text(),
    createdAt: createdAt(),
    cancelledAt: timestamptz(),
  },
  (table) => [
    foreignKey({
      name: 'appointments_chat_session_owner_fkey',
      columns: [table.chatSessionId, table.userId],
      foreignColumns: [chatSessions.id, chatSessions.userId],
    }),
    check('appointments_time_range_check', sql`${table.endsAt} > ${table.startsAt}`),
    check(
      'appointments_cancelled_at_check',
      sql`(${table.status} = 'cancelled') = (${table.cancelledAt} is not null)`,
    ),
    index('appointments_user_starts_at_idx').on(table.userId, table.startsAt),
  ],
);

export const aiInteractions = pgTable(
  'ai_interactions',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    businessId: uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    sessionId: uuid().references(() => chatSessions.id, { onDelete: 'set null' }),
    model: text().notNull(),
    status: aiInteractionStatus().notNull(),
    request: jsonb().notNull(),
    response: jsonb(),
    error: text(),
    latencyMs: integer().notNull(),
    promptTokens: integer(),
    completionTokens: integer(),
    createdAt: createdAt(),
  },
  (table) => [
    index('ai_interactions_session_idx').on(table.sessionId),
    index('ai_interactions_created_at_idx').using('brin', table.createdAt),
  ],
);
