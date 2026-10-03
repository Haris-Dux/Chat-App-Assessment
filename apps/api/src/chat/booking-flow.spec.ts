import type { BookingDraft } from '@concierge/contracts';
import type { Interpretation } from '../ai/interpretation.js';
import type { AppointmentsService } from '../appointments/appointments.service.js';
import type { AvailabilityService } from '../appointments/availability.service.js';
import { business, followUp, interpretation } from '../testing/fixtures.js';
import { BookingFlow } from './booking-flow.js';

const user = { userId: 'f2ff91a4-a379-47ee-9024-f0377bc484f1', businessId: business.id };

describe('BookingFlow', () => {
  const availability = { check: vi.fn(), nearestOpening: vi.fn() };
  const appointments = { list: vi.fn() };
  const flow = new BookingFlow(
    availability as unknown as AvailabilityService,
    appointments as unknown as AppointmentsService,
  );

  const next = (result: Interpretation | null, draft: BookingDraft = {}, stalledTurns = 0) =>
    flow.next({
      user,
      business,
      interpretation: result,
      state: {
        session: { id: 's', title: null, draft, createdAt: '', lastMessageAt: '' },
        stalledTurns,
      },
    });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('hands off to the ticket when the AI could not interpret the message', async () => {
    const turn = await next(null, { serviceId: followUp.id });

    expect(turn.attachment).toEqual({ type: 'form', missing: ['date', 'time'] });
    expect(turn.draft).toEqual({ serviceId: followUp.id });
  });

  it('asks for missing details using the AI reply while progress is being made', async () => {
    const turn = await next(
      interpretation({ booking: { serviceId: followUp.id, date: null, time: null, notes: null } }),
    );

    expect(turn).toEqual({
      content: 'Which day suits you?',
      attachment: null,
      draft: { serviceId: followUp.id },
      stalledTurns: 0,
    });
  });

  it('falls back to the form after repeated turns without progress', async () => {
    const turn = await next(interpretation(), { serviceId: followUp.id }, 1);

    expect(turn.attachment).toEqual({ type: 'form', missing: ['date', 'time'] });
    expect(turn.stalledTurns).toBe(0);
  });

  it('falls back to the form when the request is ambiguous', async () => {
    const turn = await next(interpretation({ ambiguous: true }));
    expect(turn.attachment?.type).toBe('form');
  });

  it('ignores services the business does not offer', async () => {
    const turn = await next(
      interpretation({ booking: { serviceId: 'made-up', date: null, time: null, notes: null } }),
    );
    expect(turn.draft).toEqual({});
  });

  it('proposes the booking once every detail is valid and free', async () => {
    availability.check.mockResolvedValue({ status: 'open' });

    const turn = await next(
      interpretation({
        booking: { serviceId: null, date: '2026-10-06', time: '15:00', notes: null },
      }),
      { serviceId: followUp.id },
    );

    expect(availability.check).toHaveBeenCalledWith(business, followUp, '2026-10-06', '15:00');
    expect(turn.attachment).toEqual({ type: 'proposal' });
    expect(turn.content).toContain('Follow-up session on Tue 6 Oct at 15:00 is available');
  });

  it('offers nearby times when the requested slot is taken', async () => {
    availability.check.mockResolvedValue({ status: 'taken' });
    availability.nearestOpening.mockResolvedValue({
      date: '2026-10-06',
      times: ['14:30', '15:30'],
    });

    const turn = await next(
      interpretation({
        booking: { serviceId: followUp.id, date: '2026-10-06', time: '15:00', notes: null },
      }),
    );

    expect(availability.nearestOpening).toHaveBeenCalledWith(
      business,
      followUp,
      '2026-10-06',
      '15:00',
    );
    expect(turn.content).toBe('That time is already booked. These times are free on Tue 6 Oct.');
    expect(turn.attachment).toEqual({
      type: 'slots',
      serviceId: followUp.id,
      date: '2026-10-06',
      times: ['14:30', '15:30'],
    });
    expect(turn.draft).toEqual({ serviceId: followUp.id, date: '2026-10-06', time: undefined });
  });

  it('lists open times when the customer asks about availability', async () => {
    availability.nearestOpening.mockResolvedValue({ date: '2026-10-07', times: ['09:00'] });

    const turn = await next(
      interpretation({
        intent: 'availability',
        booking: { serviceId: followUp.id, date: '2026-10-06', time: null, notes: null },
      }),
    );

    expect(turn.content).toBe(
      "Here's what's open for Follow-up session. The next free times are on Wed 7 Oct.",
    );
  });

  it('lists upcoming appointments', async () => {
    appointments.list.mockResolvedValue([{ id: 'a' }]);

    const turn = await next(interpretation({ intent: 'appointments' }));

    expect(appointments.list).toHaveBeenCalledWith(user, 'upcoming');
    expect(turn.attachment).toEqual({ type: 'appointments', appointments: [{ id: 'a' }] });
  });

  it('passes small talk through without touching the draft', async () => {
    const turn = await next(interpretation({ intent: 'other', reply: 'Happy to help!' }), {
      serviceId: followUp.id,
    });

    expect(turn).toEqual({ content: 'Happy to help!', attachment: null });
  });
});
