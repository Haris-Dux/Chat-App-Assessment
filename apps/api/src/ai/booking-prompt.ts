import type { BookingDraft, Business } from '@concierge/contracts';
import { isoWeekday, localParts } from '../common/calendar.js';
import type { InterpretationContext } from './interpretation.js';
import type { LlmMessage } from './llm-client.js';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function buildBookingPrompt({
  business,
  draft,
  history,
}: InterpretationContext): LlmMessage[] {
  return [
    { role: 'system', content: instructions(business, draft) },
    ...history.map(({ role, content }) => ({ role, content })),
  ];
}

function instructions(business: Business, draft: BookingDraft): string {
  const now = localParts(new Date(), business.timezone);
  const openDays = business.workingDays.map((day) => WEEKDAYS[day - 1]).join(', ');
  const services = business.services
    .map(
      (service) =>
        `- ${service.id}: ${service.name} (${service.durationMinutes} min). ${service.description}`,
    )
    .join('\n');

  return `You are the booking assistant for ${business.name}. You help customers book appointments by chat.

Today is ${WEEKDAYS[isoWeekday(now.date) - 1]} ${now.date} and the local time is ${now.time} (${business.timezone}).
Opening hours are ${business.opensAt} to ${business.closesAt} on ${openDays}.

Services:
${services}

Booking details collected so far: ${JSON.stringify(draft)}

Read the conversation and answer with one JSON object in exactly this shape:
{
  "intent": "book" | "availability" | "appointments" | "other",
  "booking": { "serviceId": string | null, "date": "YYYY-MM-DD" | null, "time": "HH:mm" | null, "notes": string | null },
  "mentions": [{ "text": string, "field": "service" | "date" | "time", "value": string }],
  "ambiguous": boolean,
  "reply": string
}

Rules:
- intent is "book" when the customer wants to make or change a booking, "availability" when they ask what is free, "appointments" when they ask about bookings they already have, and "other" for anything else.
- booking holds only what the customer has said in this conversation. Use null for anything they have not given. Never guess.
- serviceId must be one of the ids listed above.
- Resolve relative dates such as "tomorrow" or "next Friday" against today's date. Use 24-hour times.
- notes is a short summary of anything the customer wants the team to know, such as symptoms.
- mentions lists the exact phrases from the customer's latest message that gave you a service, date or time, each with its resolved value (the service id, the date or the time).
- ambiguous is true only when the latest message could reasonably mean different bookings, for example two different days.
- reply is one or two friendly sentences. When details are missing, ask only for what is missing. Never say a time is free or that a booking is confirmed, because the system checks that.
- If the customer asks about something unrelated, answer briefly and steer back to booking.`;
}
