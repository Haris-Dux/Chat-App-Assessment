import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import { z } from 'zod';
import { FormError } from '../../components/ui/form-error';
import { AppointmentCard } from '../../features/appointments/appointment-card';
import { CancelButton } from '../../features/appointments/cancel-button';
import { appointmentsQuery, useCancelAppointment } from '../../features/appointments/queries';
import { useBusiness } from '../../features/business/business-context';
import { cn } from '../../lib/cn';

const searchSchema = z.object({
  scope: z.enum(['upcoming', 'history']).default('upcoming').catch('upcoming'),
});

const tabs = [
  { scope: 'upcoming', label: 'Upcoming' },
  { scope: 'history', label: 'Past & cancelled' },
] as const;

export const Route = createFileRoute('/_app/appointments')({
  validateSearch: searchSchema,
  component: AppointmentsPage,
});

function AppointmentsPage() {
  const { scope } = Route.useSearch();
  const { timezone } = useBusiness();
  const appointments = useQuery(appointmentsQuery(scope));
  const cancel = useCancelAppointment();

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="font-display text-4xl tracking-tight">Appointments</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Times are shown in {timezone.replace('_', ' ')} time.
        </p>

        <nav className="mt-8 inline-flex rounded-full border border-line bg-surface p-1 text-sm">
          {tabs.map((tab) => (
            <Link
              key={tab.scope}
              to="/appointments"
              search={{ scope: tab.scope }}
              className={cn(
                'rounded-full px-4 py-1.5 transition',
                tab.scope === scope ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink',
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 space-y-3">
          <FormError message={cancel.error?.message} />

          {appointments.isPending &&
            [0, 1, 2].map((row) => (
              <div key={row} className="h-[70px] animate-pulse rounded-2xl bg-line/40" />
            ))}

          {appointments.isError && (
            <p className="text-sm text-accent">{appointments.error.message}</p>
          )}

          {appointments.data?.length === 0 && (
            <div className="rounded-3xl border border-dashed border-line px-6 py-12 text-center">
              <p className="font-display text-xl">
                {scope === 'upcoming' ? 'Nothing on the calendar yet.' : 'No past appointments.'}
              </p>
              {scope === 'upcoming' && (
                <Link
                  to="/chat"
                  className="mt-3 inline-block text-sm text-accent underline underline-offset-4"
                >
                  Ask the concierge to book one
                </Link>
              )}
            </div>
          )}

          <ul className="space-y-2.5">
            <AnimatePresence initial={false}>
              {appointments.data?.map((appointment) => (
                <motion.li
                  key={appointment.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                >
                  <AppointmentCard
                    appointment={appointment}
                    detailed
                    action={
                      scope === 'upcoming' && (
                        <CancelButton
                          disabled={appointment.pending}
                          onConfirm={() => cancel.mutate(appointment)}
                        />
                      )
                    }
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      </div>
    </div>
  );
}
