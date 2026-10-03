import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import { AppointmentCard } from './appointment-card';
import { appointmentsQuery } from './queries';

export function UpcomingRail({ onNavigate }: { onNavigate: () => void }) {
  const upcoming = useQuery(appointmentsQuery('upcoming'));

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
          Upcoming
        </h2>
        <Link
          to="/appointments"
          search={{ scope: 'upcoming' }}
          onClick={onNavigate}
          className="text-xs text-ink-soft hover:text-ink"
        >
          See all
        </Link>
      </div>

      {upcoming.isError && <p className="px-1 text-xs text-accent">{upcoming.error.message}</p>}
      {upcoming.data?.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line px-3 py-4 text-center text-xs text-ink-faint">
          Nothing booked yet
        </p>
      )}

      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {upcoming.data?.map((appointment) => (
            <motion.li
              key={appointment.id}
              layout
              layoutId={`appointment-${appointment.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -16, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            >
              <AppointmentCard appointment={appointment} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
