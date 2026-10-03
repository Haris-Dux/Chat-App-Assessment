import type { BookingField } from '@concierge/contracts';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Stamp } from '../../components/stamp';
import { Button } from '../../components/ui/button';
import { FormError } from '../../components/ui/form-error';
import { cn } from '../../lib/cn';
import { formatDate } from '../../lib/datetime';
import { createId } from '../../lib/id';
import { availabilityQuery, useBookAppointment } from '../appointments/queries';
import { findService, useBusiness } from '../business/business-context';
import { DayStrip } from './day-strip';
import { FieldLabel } from './field-label';
import { toTicketValues, type TicketOutput, type TicketValues } from './ticket-form';
import { TimeSlots } from './time-slots';

const STAMP_DURATION_MS = 1600;

export function Ticket({
  sessionId,
  signal,
  missing,
}: {
  sessionId: string;
  signal: string;
  missing: BookingField[];
}) {
  const business = useBusiness();
  const form = useFormContext<TicketValues, unknown, TicketOutput>();
  const [serviceId, date, time] = useWatch({
    control: form.control,
    name: ['serviceId', 'date', 'time'],
  });
  const service = findService(business, serviceId);
  const availability = useQuery(availabilityQuery(serviceId, date));
  const book = useBookAppointment();
  const { reset: resetBooking } = book;
  const { reset: resetForm } = form;
  const [appointmentId, setAppointmentId] = useState(createId);
  const [stamped, setStamped] = useState(false);
  const [scope, animate] = useAnimate();
  const lastSignal = useRef(signal);

  useEffect(() => {
    if (signal === lastSignal.current) return;
    lastSignal.current = signal;
    void animate(
      scope.current,
      {
        boxShadow: ['0 0 0 0 var(--accent)', '0 0 0 6px var(--accent-soft)', '0 0 0 0 transparent'],
      },
      { duration: 1.1 },
    );
  }, [signal, animate, scope]);

  useEffect(() => {
    if (!stamped) return;

    const timer = setTimeout(() => {
      setStamped(false);
      setAppointmentId(createId());
      resetBooking();
      resetForm(toTicketValues({}));
    }, STAMP_DURATION_MS);

    return () => clearTimeout(timer);
  }, [stamped, resetBooking, resetForm]);

  const filled = [service, date, time].filter(Boolean).length;
  const complete = filled === 3;
  const timeIsOpen = availability.data?.times.includes(time) ?? false;
  const inFlight = book.isPending || book.isSuccess;

  const choose = (field: 'serviceId' | 'date' | 'time', value: string) =>
    form.setValue(field, value, { shouldValidate: true, shouldDirty: true });

  const submit = form.handleSubmit((values) =>
    book.mutate(
      { ...values, notes: values.notes || undefined, id: appointmentId, sessionId },
      { onSuccess: () => setStamped(true) },
    ),
  );

  return (
    <form
      ref={scope}
      onSubmit={submit}
      noValidate
      className="relative rounded-3xl border border-line bg-surface p-5"
    >
      <header className="flex items-center justify-between font-mono text-[11px] tracking-[0.18em] text-ink-faint">
        <span>TICKET</span>
        <span>No. {appointmentId.slice(0, 4).toUpperCase()}</span>
      </header>
      <p className="mt-1 font-display text-xl">{business.name}</p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-line/60">
        <motion.div
          className="h-full bg-accent"
          animate={{ width: `${(filled / 3) * 100}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        />
      </div>

      <fieldset className="mt-5">
        <legend className="contents">
          <FieldLabel
            className="mb-2.5"
            done={Boolean(service)}
            flagged={missing.includes('service')}
          >
            Service
          </FieldLabel>
        </legend>
        <div className="space-y-1.5">
          {business.services.map((option) => (
            <label
              key={option.id}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-1.5 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent',
                option.id === serviceId
                  ? 'border-ink bg-raised'
                  : 'border-line hover:border-ink-faint',
              )}
            >
              <input
                type="radio"
                value={option.id}
                className="sr-only"
                {...form.register('serviceId')}
              />
              <span>{option.name}</span>
              <span className="font-mono text-[11px] text-ink-faint">
                {option.durationMinutes} min
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <FieldLabel className="mb-2.5" done={Boolean(date)} flagged={missing.includes('date')}>
          Day
        </FieldLabel>
        <DayStrip value={date} onChange={(day) => choose('date', day)} />
      </div>

      <div className="mt-5">
        <FieldLabel
          className="mb-2.5"
          done={Boolean(time) && timeIsOpen}
          flagged={missing.includes('time')}
        >
          Time
        </FieldLabel>
        <TimeSlots
          availability={availability}
          ready={Boolean(serviceId && date)}
          value={time}
          onChange={(slot) => choose('time', slot)}
        />
      </div>

      <label className="mt-5 block">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
          Notes{' '}
          <span className="font-normal normal-case tracking-normal text-ink-faint">optional</span>
        </span>
        <textarea
          rows={2}
          maxLength={500}
          placeholder="Anything we should know?"
          className="w-full resize-none rounded-xl border border-line bg-raised px-3 py-2 text-sm outline-none transition placeholder:text-ink-faint focus:border-ink"
          {...form.register('notes')}
        />
      </label>

      <div className="relative -mx-5 my-4 h-4" aria-hidden>
        <span className="absolute -left-2 top-0 size-4 rounded-full border border-line bg-paper" />
        <span className="absolute -right-2 top-0 size-4 rounded-full border border-line bg-paper" />
        <div className="perforation absolute inset-x-5 top-1/2 h-px" />
      </div>

      <div className="min-h-14">
        {complete && service && !inFlight ? (
          <motion.div
            layoutId={`appointment-${appointmentId}`}
            className="rounded-2xl border border-line bg-raised px-4 py-3"
          >
            <p className="font-medium">{service.name}</p>
            <p className="mt-0.5 font-mono text-[11px] text-ink-soft">
              {formatDate(date, { weekday: 'short', day: 'numeric', month: 'short' })} · {time} ·{' '}
              {service.durationMinutes} min
            </p>
          </motion.div>
        ) : (
          !inFlight && (
            <p className="py-3 text-center font-mono text-[11px] text-ink-faint">
              {3 - filled} detail{3 - filled === 1 ? '' : 's'} to go
            </p>
          )
        )}
      </div>

      <div className="mt-4 space-y-3">
        <FormError message={book.error?.message} />
        <Button
          type="submit"
          variant="accent"
          size="lg"
          className="w-full"
          disabled={!complete || !timeIsOpen || inFlight}
        >
          {book.isPending ? 'Booking…' : 'Confirm booking'}
        </Button>
      </div>

      <AnimatePresence>
        {stamped && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 grid place-items-center rounded-3xl bg-surface/70 backdrop-blur-[1px]"
          >
            <Stamp size="lg" />
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
