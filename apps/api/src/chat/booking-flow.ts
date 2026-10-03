import type { BookingDraft, Business, Service } from '@concierge/contracts';
import { Injectable } from '@nestjs/common';
import type { Interpretation } from '../ai/interpretation.js';
import { AppointmentsService } from '../appointments/appointments.service.js';
import { AvailabilityService, describeSlotProblem } from '../appointments/availability.service.js';
import type { AuthUser } from '../auth/auth-user.js';
import { describeDate } from '../common/calendar.js';
import type { AssistantTurn, SessionState } from './assistant-turn.js';
import { filledCount, mergeDraft, missingFields } from './booking-draft.js';

const MAX_STALLED_TURNS = 2;

export interface FlowInput {
  user: AuthUser;
  business: Business;
  state: SessionState;
  interpretation: Interpretation | null;
}

@Injectable()
export class BookingFlow {
  constructor(
    private readonly availability: AvailabilityService,
    private readonly appointments: AppointmentsService,
  ) {}

  async next({ user, business, state, interpretation }: FlowInput): Promise<AssistantTurn> {
    if (!interpretation) {
      return handOff(
        state.session.draft,
        "I couldn't quite process that. Let's finish your booking on the ticket instead.",
      );
    }

    switch (interpretation.intent) {
      case 'appointments':
        return this.upcoming(user);
      case 'other':
        return { content: interpretation.reply, attachment: null };
      default:
        return this.advance(business, state, interpretation);
    }
  }

  recover(): AssistantTurn {
    return {
      content:
        'Something went wrong on my side. You can keep chatting or complete the ticket directly.',
      attachment: { type: 'form', missing: [] },
    };
  }

  private async advance(
    business: Business,
    { session, stalledTurns }: SessionState,
    interpretation: Interpretation,
  ): Promise<AssistantTurn> {
    const draft = mergeDraft(session.draft, interpretation.booking, business);
    const service = business.services.find(({ id }) => id === draft.serviceId);

    if (service && draft.date && draft.time) {
      return this.propose(business, service, draft, draft.date, draft.time);
    }

    if (service && draft.date && interpretation.intent === 'availability') {
      return this.offer(
        business,
        service,
        draft,
        draft.date,
        `Here's what's open for ${service.name}.`,
      );
    }

    const stalled = filledCount(draft) > filledCount(session.draft) ? 0 : stalledTurns + 1;

    if (interpretation.ambiguous || stalled >= MAX_STALLED_TURNS) {
      return handOff(
        draft,
        "Let's pin down the details on the ticket. Fill in what's missing and confirm when you're ready.",
      );
    }

    return { content: interpretation.reply, attachment: null, draft, stalledTurns: stalled };
  }

  private async propose(
    business: Business,
    service: Service,
    draft: BookingDraft,
    date: string,
    time: string,
  ): Promise<AssistantTurn> {
    const slot = await this.availability.check(business, service, date, time);

    if (slot.status === 'open') {
      return {
        content: `${service.name} on ${describeDate(date)} at ${time} is available. Check the ticket and confirm when you're ready.`,
        attachment: { type: 'proposal' },
        draft,
        stalledTurns: 0,
      };
    }

    return this.offer(
      business,
      service,
      { ...draft, time: undefined },
      date,
      describeSlotProblem(slot.status, business),
      time,
    );
  }

  private async offer(
    business: Business,
    service: Service,
    draft: BookingDraft,
    date: string,
    lead: string,
    near?: string,
  ): Promise<AssistantTurn> {
    const opening = await this.availability.nearestOpening(business, service, date, near);

    if (!opening) {
      return {
        content: `${lead} There are no openings for ${service.name} in the next two weeks.`,
        attachment: null,
        draft,
        stalledTurns: 0,
      };
    }

    const content =
      opening.date === date
        ? `${lead} These times are free on ${describeDate(date)}.`
        : `${lead} The next free times are on ${describeDate(opening.date)}.`;

    return {
      content,
      attachment: {
        type: 'slots',
        serviceId: service.id,
        date: opening.date,
        times: opening.times,
      },
      draft,
      stalledTurns: 0,
    };
  }

  private async upcoming(user: AuthUser): Promise<AssistantTurn> {
    const appointments = await this.appointments.list(user, 'upcoming');

    return appointments.length > 0
      ? {
          content: "Here's what you have coming up.",
          attachment: { type: 'appointments', appointments },
        }
      : {
          content: "You don't have any upcoming appointments. Would you like to book one?",
          attachment: null,
        };
  }
}

function handOff(draft: BookingDraft, content: string): AssistantTurn {
  return {
    content,
    attachment: { type: 'form', missing: missingFields(draft) },
    draft,
    stalledTurns: 0,
  };
}
