import {
  calendarDateSchema,
  timeOfDaySchema,
  type Business,
  type BookingDraft,
  type ChatMessage,
} from '@concierge/contracts';
import { z } from 'zod';

const optional = <T extends z.ZodType>(schema: T) => schema.nullable().catch(null);

export const interpretationSchema = z.object({
  intent: z.enum(['book', 'availability', 'appointments', 'other']),
  booking: z.object({
    serviceId: optional(z.string()),
    date: optional(calendarDateSchema),
    time: optional(timeOfDaySchema),
    notes: optional(z.string().trim().max(500)),
  }),
  mentions: z
    .array(
      z.object({
        text: z.string().min(1),
        field: z.enum(['service', 'date', 'time']),
        value: z.string(),
      }),
    )
    .catch([]),
  ambiguous: z.boolean().catch(false),
  reply: z.string().trim().min(1).max(600),
});

export type Interpretation = z.infer<typeof interpretationSchema>;

export interface InterpretationContext {
  sessionId: string;
  business: Business;
  draft: BookingDraft;
  history: Pick<ChatMessage, 'role' | 'content'>[];
}
