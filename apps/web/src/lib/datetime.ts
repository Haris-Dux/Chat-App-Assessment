import { TZDate } from '@date-fns/tz';

const pad = (value: number) => String(value).padStart(2, '0');

export function todayIn(timeZone: string): string {
  const now = TZDate.tz(timeZone);
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

export function isoWeekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay() || 7;
}

export function zonedInstant(date: string, time: string, timeZone: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(new TZDate(year, month - 1, day, hours, minutes, timeZone).getTime());
}

export function formatDate(
  date: string,
  options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' },
): string {
  return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

export function formatInstant(
  iso: string,
  timeZone: string | undefined,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat('en-GB', { ...options, timeZone }).format(new Date(iso));
}

export function formatClock(iso: string, timeZone?: string): string {
  return formatInstant(iso, timeZone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
}

export function formatRelative(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' });

  if (minutes < 60) return format.format(-minutes, 'minute');
  if (minutes < 60 * 24) return format.format(-Math.round(minutes / 60), 'hour');
  return format.format(-Math.round(minutes / (60 * 24)), 'day');
}
