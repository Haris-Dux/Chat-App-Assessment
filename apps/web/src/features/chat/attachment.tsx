import type { BookingField, MessageAttachment } from '@concierge/contracts';
import { ArrowRight, Ticket } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Stamp } from '../../components/stamp';
import { formatDate } from '../../lib/datetime';
import { AppointmentCard } from '../appointments/appointment-card';
import type { SlotChoice, ThreadActions } from './thread-actions';

const listFormat = new Intl.ListFormat('en', { type: 'conjunction' });

export function Attachment({
  attachment,
  actions,
}: {
  attachment: MessageAttachment;
  actions: ThreadActions;
}) {
  switch (attachment.type) {
    case 'proposal':
      return (
        <TicketNudge onOpen={actions.openTicket}>Your ticket is ready to confirm.</TicketNudge>
      );
    case 'form':
      return (
        <TicketNudge onOpen={actions.openTicket}>{describeMissing(attachment.missing)}</TicketNudge>
      );
    case 'slots':
      return <SlotChips {...attachment} onPick={actions.pickSlot} />;
    case 'appointments':
      return (
        <ul className="max-w-sm space-y-2">
          {attachment.appointments.map((appointment) => (
            <li key={appointment.id}>
              <AppointmentCard appointment={appointment} />
            </li>
          ))}
        </ul>
      );
    case 'booked':
      return (
        <div className="relative max-w-sm">
          <AppointmentCard appointment={attachment.appointment} />
          <Stamp className="absolute -top-3 right-3 bg-surface" />
        </div>
      );
  }
}

function describeMissing(missing: BookingField[]): string {
  return missing.length > 0
    ? `Add the ${listFormat.format(missing)} on the ticket and you're done.`
    : 'You can finish the booking on the ticket.';
}

function TicketNudge({ children, onOpen }: { children: ReactNode; onOpen?: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex max-w-sm items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-left text-sm transition hover:border-accent"
    >
      <Ticket className="size-4 shrink-0 text-accent" aria-hidden />
      <span className="flex-1 text-ink-soft">{children}</span>
      <ArrowRight
        className="size-4 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-accent"
        aria-hidden
      />
    </button>
  );
}

function SlotChips({
  serviceId,
  date,
  times,
  onPick,
}: {
  serviceId: string;
  date: string;
  times: string[];
  onPick?: (slot: SlotChoice) => void;
}) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
        {formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {times.map((time, index) => (
          <motion.button
            key={time}
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onPick?.({ serviceId, date, time })}
            className="rounded-full border border-line bg-raised px-3.5 py-1.5 font-mono text-xs transition hover:border-accent hover:text-accent"
          >
            {time}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
