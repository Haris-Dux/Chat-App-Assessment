import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { formatClock, formatInstant } from '../../lib/datetime';
import { useBusiness } from '../business/business-context';
import type { ListedAppointment } from './cache';

export function AppointmentCard({
  appointment,
  detailed = false,
  action,
}: {
  appointment: ListedAppointment;
  detailed?: boolean;
  action?: ReactNode;
}) {
  const { timezone } = useBusiness();
  const cancelled = appointment.status === 'cancelled';
  const part = (options: Intl.DateTimeFormatOptions) =>
    formatInstant(appointment.startsAt, timezone, options);

  return (
    <article
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition',
        appointment.pending && 'border-dashed',
        cancelled && 'opacity-60',
      )}
    >
      <div className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-paper py-2 font-mono leading-none">
        <span className="text-[10px] uppercase tracking-wider text-accent">
          {part({ month: 'short' })}
        </span>
        <span className="mt-1 text-lg font-semibold">{part({ day: 'numeric' })}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-medium', cancelled && 'line-through')}>
          {appointment.serviceName}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-ink-soft">
          {part({ weekday: 'short' })} · {formatClock(appointment.startsAt, timezone)}–
          {formatClock(appointment.endsAt, timezone)}
          {appointment.pending && <span className="ml-2 text-ink-faint">confirming…</span>}
          {cancelled && <span className="ml-2 text-accent">cancelled</span>}
        </p>
        {detailed && appointment.notes && (
          <p className="mt-1.5 text-xs text-ink-faint">{appointment.notes}</p>
        )}
      </div>
      {action}
    </article>
  );
}
