import type { Business, Mention } from '@concierge/contracts';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Stamp } from '../../components/stamp';
import { cn } from '../../lib/cn';
import { formatDate, isoWeekday, shiftDate, todayIn } from '../../lib/datetime';
import { FieldLabel } from '../booking/field-label';
import { useBusiness } from '../business/business-context';
import { MentionText } from '../chat/mention-text';

const STEP_MS = 1300;
const STEP_COUNT = 6;
const BOOKED_STEP = 4;
const DEMO_TIME = '15:00';

function nextWorkingDay({ timezone, workingDays }: Business): string {
  const today = todayIn(timezone);
  const upcoming = Array.from({ length: 7 }, (_, offset) => shiftDate(today, offset + 1));
  return upcoming.find((day) => workingDays.includes(isoWeekday(day))) ?? upcoming[0];
}

export function BookingDemo({ className }: { className?: string }) {
  const business = useBusiness();
  const reduceMotion = useReducedMotion();
  const [tick, setTick] = useState(0);
  const [service] = business.services;

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => setTick((count) => count + 1), STEP_MS);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  if (!service) return null;

  const step = reduceMotion ? BOOKED_STEP : tick % STEP_COUNT;
  const cycle = Math.floor(tick / STEP_COUNT);
  const date = nextWorkingDay(business);
  const weekday = formatDate(date, { weekday: 'long' });
  const content = `${service.name} on ${weekday} around 3pm, please`;
  const mentions: Mention[] = [
    { text: service.name, field: 'service', value: service.id },
    { text: weekday, field: 'date', value: date },
    { text: '3pm', field: 'time', value: DEMO_TIME },
  ];
  const rows = [
    { label: 'Service', value: service.name },
    { label: 'Day', value: formatDate(date) },
    { label: 'Time', value: DEMO_TIME },
  ];

  return (
    <div
      aria-hidden
      className={cn(
        'w-full max-w-sm rounded-3xl border border-line bg-surface p-5 text-ink shadow-2xl',
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">You</p>
      <motion.div
        key={cycle}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-1.5 min-h-24 font-display text-lg leading-relaxed"
      >
        <MentionText
          key={step >= 1 ? 'read' : 'typed'}
          content={content}
          mentions={step >= 1 ? mentions : []}
        />
      </motion.div>

      <div className="relative mt-4 rounded-2xl border border-line bg-raised p-4">
        <div className="flex justify-between font-mono text-[10px] tracking-[0.18em] text-ink-faint">
          <span>TICKET</span>
          <span>{business.name.toUpperCase()}</span>
        </div>
        <ul className="mt-3 space-y-2.5">
          {rows.map((row, index) => {
            const done = step > index;
            return (
              <li key={row.label} className="flex items-center justify-between gap-3">
                <FieldLabel done={done}>{row.label}</FieldLabel>
                <AnimatePresence mode="wait">
                  {done ? (
                    <motion.span
                      key="value"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="truncate font-mono text-xs"
                    >
                      {row.value}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="empty"
                      exit={{ opacity: 0 }}
                      className="h-px w-20 border-t border-dashed border-ink-faint"
                    />
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
        {step >= BOOKED_STEP && <Stamp className="absolute -bottom-3 right-4 bg-surface" />}
      </div>
    </div>
  );
}
