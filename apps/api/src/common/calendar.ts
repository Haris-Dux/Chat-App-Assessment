import { TZDate } from '@date-fns/tz';

const pad = (value: number) => String(value).padStart(2, '0');

const dayFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

export function toInstant(date: string, time: string, timezone: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(new TZDate(year, month - 1, day, hours, minutes, timezone).getTime());
}

export function localParts(instant: Date, timezone: string): { date: string; time: string } {
  const local = new TZDate(instant.getTime(), timezone);
  return {
    date: `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`,
    time: `${pad(local.getHours())}:${pad(local.getMinutes())}`,
  };
}

export function isoWeekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay() || 7;
}

export function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function fromMinutes(total: number): string {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export function describeDate(date: string): string {
  return dayFormatter.format(new Date(`${date}T00:00:00Z`));
}
