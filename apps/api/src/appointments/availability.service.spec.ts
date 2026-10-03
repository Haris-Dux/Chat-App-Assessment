import { assessment, business } from '../testing/fixtures.js';
import type { AppointmentsRepository, BookedSpan } from './appointments.repository.js';
import { AvailabilityService } from './availability.service.js';

describe('AvailabilityService', () => {
  let booked: BookedSpan[];
  let availability: AvailabilityService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-05T04:10:00Z'));
    booked = [
      { startsAt: new Date('2026-10-05T05:00:00Z'), endsAt: new Date('2026-10-05T06:00:00Z') },
    ];

    const repository = {
      findBookedBetween: async (_businessId: string, from: Date, to: Date) =>
        booked.filter((span) => span.startsAt < to && span.endsAt > from),
    };
    availability = new AvailabilityService(repository as unknown as AppointmentsRepository);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('openTimes', () => {
    it('skips past times and times that overlap a booking', async () => {
      const times = await availability.openTimes(business, assessment, '2026-10-05');

      expect(times.slice(0, 3)).toEqual(['11:00', '11:30', '12:00']);
      expect(times.at(-1)).toBe('17:00');
    });

    it('returns nothing on a closed day', async () => {
      expect(await availability.openTimes(business, assessment, '2026-10-11')).toEqual([]);
    });
  });

  describe('check', () => {
    it.each([
      ['2026-10-11', '10:00', 'closed'],
      ['2026-10-06', '17:30', 'outside-hours'],
      ['2026-10-06', '08:30', 'outside-hours'],
      ['2026-10-05', '09:00', 'past'],
      ['2026-10-05', '10:30', 'taken'],
    ])('reports %s %s as %s', async (date, time, status) => {
      expect(await availability.check(business, assessment, date, time)).toEqual({ status });
    });

    it('converts an open slot to instants in the business timezone', async () => {
      expect(await availability.check(business, assessment, '2026-10-05', '12:00')).toEqual({
        status: 'open',
        startsAt: new Date('2026-10-05T07:00:00Z'),
        endsAt: new Date('2026-10-05T08:00:00Z'),
      });
    });
  });

  describe('nearestOpening', () => {
    it('suggests the times closest to the requested one', async () => {
      expect(
        await availability.nearestOpening(business, assessment, '2026-10-05', '10:00'),
      ).toEqual({
        date: '2026-10-05',
        times: ['11:00', '11:30', '12:00', '12:30'],
      });
    });

    it('moves to the next working day when the requested day is closed', async () => {
      expect(await availability.nearestOpening(business, assessment, '2026-10-11')).toEqual({
        date: '2026-10-12',
        times: ['09:00', '09:30', '10:00', '10:30'],
      });
    });

    it('starts from today when the requested day has passed', async () => {
      const opening = await availability.nearestOpening(business, assessment, '2026-09-30');
      expect(opening?.date).toBe('2026-10-05');
    });
  });
});
