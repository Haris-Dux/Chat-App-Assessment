import type { Business, Service } from '@concierge/contracts';
import { Injectable } from '@nestjs/common';
import {
  fromMinutes,
  isoWeekday,
  localParts,
  shiftDate,
  toInstant,
  toMinutes,
} from '../common/calendar.js';
import { AppointmentsRepository } from './appointments.repository.js';

const SLOT_INTERVAL_MINUTES = 30;
const SUGGESTION_COUNT = 4;
const SEARCH_DAYS = 14;

export type SlotProblem = 'closed' | 'outside-hours' | 'past' | 'taken';

export type SlotCheck = { status: 'open'; startsAt: Date; endsAt: Date } | { status: SlotProblem };

export interface Opening {
  date: string;
  times: string[];
}

export function describeSlotProblem(problem: SlotProblem, business: Business): string {
  switch (problem) {
    case 'closed':
      return "We're closed on that day.";
    case 'outside-hours':
      return `That time is outside our opening hours (${business.opensAt} to ${business.closesAt}).`;
    case 'past':
      return 'That time has already passed.';
    case 'taken':
      return 'That time is already booked.';
  }
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly appointments: AppointmentsRepository) {}

  async openTimes(business: Business, service: Service, date: string): Promise<string[]> {
    if (!this.isWorkingDay(business, date)) {
      return [];
    }

    const booked = await this.appointments.findBookedBetween(
      business.id,
      toInstant(date, '00:00', business.timezone),
      toInstant(shiftDate(date, 1), '00:00', business.timezone),
    );
    const now = Date.now();

    return this.candidateTimes(business, service).filter((time) => {
      const { startsAt, endsAt } = this.span(business, service, date, time);
      return (
        startsAt.getTime() > now &&
        !booked.some((slot) => slot.startsAt < endsAt && slot.endsAt > startsAt)
      );
    });
  }

  async check(
    business: Business,
    service: Service,
    date: string,
    time: string,
  ): Promise<SlotCheck> {
    if (!this.isWorkingDay(business, date)) {
      return { status: 'closed' };
    }

    const start = toMinutes(time);
    if (
      start < toMinutes(business.opensAt) ||
      start + service.durationMinutes > toMinutes(business.closesAt)
    ) {
      return { status: 'outside-hours' };
    }

    const { startsAt, endsAt } = this.span(business, service, date, time);
    if (startsAt.getTime() <= Date.now()) {
      return { status: 'past' };
    }

    const clashes = await this.appointments.findBookedBetween(business.id, startsAt, endsAt);
    return clashes.length > 0 ? { status: 'taken' } : { status: 'open', startsAt, endsAt };
  }

  async nearestOpening(
    business: Business,
    service: Service,
    date: string,
    near?: string,
  ): Promise<Opening | null> {
    const today = localParts(new Date(), business.timezone).date;
    const firstDay = date < today ? today : date;

    for (let offset = 0; offset < SEARCH_DAYS; offset += 1) {
      const day = shiftDate(firstDay, offset);
      const times = await this.openTimes(business, service, day);

      if (times.length > 0) {
        return { date: day, times: pickClosest(times, day === date ? near : undefined) };
      }
    }

    return null;
  }

  private isWorkingDay(business: Business, date: string): boolean {
    return business.workingDays.includes(isoWeekday(date));
  }

  private candidateTimes(business: Business, service: Service): string[] {
    const times: string[] = [];
    const lastStart = toMinutes(business.closesAt) - service.durationMinutes;

    for (
      let minute = toMinutes(business.opensAt);
      minute <= lastStart;
      minute += SLOT_INTERVAL_MINUTES
    ) {
      times.push(fromMinutes(minute));
    }

    return times;
  }

  private span(business: Business, service: Service, date: string, time: string) {
    const startsAt = toInstant(date, time, business.timezone);
    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
    return { startsAt, endsAt };
  }
}

function pickClosest(times: string[], near?: string): string[] {
  if (!near) {
    return times.slice(0, SUGGESTION_COUNT);
  }

  const target = toMinutes(near);
  return [...times]
    .sort((a, b) => Math.abs(toMinutes(a) - target) - Math.abs(toMinutes(b) - target))
    .slice(0, SUGGESTION_COUNT)
    .sort();
}
