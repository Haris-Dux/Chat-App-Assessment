import { Ticket as TicketIcon, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function TicketPanel({
  open,
  onOpenChange,
  progress,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: string;
  children: ReactNode;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="fixed bottom-28 right-4 z-20 flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper shadow-lg lg:hidden"
      >
        <TicketIcon className="size-4" aria-hidden />
        Ticket
        <span className="font-mono text-xs text-paper/60">{progress}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-30 bg-ink/30 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        aria-label="Booking ticket"
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 max-h-[88dvh] overflow-y-auto rounded-t-3xl bg-paper p-4 shadow-2xl transition-transform duration-300 ease-out',
          'lg:static lg:z-auto lg:max-h-none lg:translate-y-0 lg:rounded-none lg:border-l lg:border-line lg:p-6 lg:shadow-none',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="mb-3 flex justify-end lg:hidden">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close ticket"
            className="rounded-full p-2 text-ink-soft hover:bg-ink/5"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}
