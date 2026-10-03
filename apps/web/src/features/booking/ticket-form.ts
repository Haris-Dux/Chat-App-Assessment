import { createAppointmentSchema, type BookingDraft } from '@concierge/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

export const ticketSchema = createAppointmentSchema.pick({
  serviceId: true,
  date: true,
  time: true,
  notes: true,
});

export type TicketValues = z.input<typeof ticketSchema>;
export type TicketOutput = z.output<typeof ticketSchema>;

const ticketFields = ['serviceId', 'date', 'time', 'notes'] as const;

export function toTicketValues(draft: BookingDraft): Required<TicketValues> {
  return {
    serviceId: draft.serviceId ?? '',
    date: draft.date ?? '',
    time: draft.time ?? '',
    notes: draft.notes ?? '',
  };
}

export function useTicketForm(draft: BookingDraft) {
  const form = useForm<TicketValues, unknown, TicketOutput>({
    resolver: zodResolver(ticketSchema),
    mode: 'onChange',
    defaultValues: toTicketValues(draft),
  });
  const previousDraft = useRef(draft);

  useEffect(() => {
    const before = toTicketValues(previousDraft.current);
    const after = toTicketValues(draft);

    for (const field of ticketFields) {
      if (after[field] !== before[field]) {
        form.setValue(field, after[field], { shouldValidate: true });
      }
    }

    previousDraft.current = draft;
  }, [draft, form]);

  return form;
}
