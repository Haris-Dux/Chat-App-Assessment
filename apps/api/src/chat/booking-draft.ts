import {
  calendarDateSchema,
  timeOfDaySchema,
  type BookingDraft,
  type BookingField,
  type Business,
  type Mention,
} from '@concierge/contracts';
import type { Interpretation } from '../ai/interpretation.js';

export function mergeDraft(
  draft: BookingDraft,
  { serviceId, date, time, notes }: Interpretation['booking'],
  business: Business,
): BookingDraft {
  const merged = { ...draft };

  if (serviceId && business.services.some(({ id }) => id === serviceId)) {
    merged.serviceId = serviceId;
  }
  if (date) {
    merged.date = date;
  }
  if (time) {
    merged.time = time;
  }
  if (notes) {
    merged.notes = notes;
  }

  return merged;
}

function requiredFields(draft: BookingDraft): [BookingField, string | undefined][] {
  return [
    ['service', draft.serviceId],
    ['date', draft.date],
    ['time', draft.time],
  ];
}

export function missingFields(draft: BookingDraft): BookingField[] {
  return requiredFields(draft)
    .filter(([, value]) => !value)
    .map(([field]) => field);
}

export function filledCount(draft: BookingDraft): number {
  return requiredFields(draft).filter(([, value]) => value).length;
}

export function groundMentions(
  content: string,
  mentions: Mention[],
  business: Business,
): Mention[] {
  const text = content.toLowerCase();
  const isValid: Record<Mention['field'], (value: string) => boolean> = {
    service: (value) => business.services.some(({ id }) => id === value),
    date: (value) => calendarDateSchema.safeParse(value).success,
    time: (value) => timeOfDaySchema.safeParse(value).success,
  };

  return mentions.filter(
    ({ text: phrase, field, value }) =>
      text.includes(phrase.toLowerCase()) && isValid[field](value),
  );
}
