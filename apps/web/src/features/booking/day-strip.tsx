import { useEffect, useRef } from 'react';
import { cn } from '../../lib/cn';
import { formatDate, isoWeekday, shiftDate, todayIn } from '../../lib/datetime';
import { useBusiness } from '../business/business-context';

const DAYS_SHOWN = 21;

export function DayStrip({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  const business = useBusiness();
  const selectedRef = useRef<HTMLButtonElement>(null);
  const today = todayIn(business.timezone);
  const days = Array.from({ length: DAYS_SHOWN }, (_, offset) => shiftDate(today, offset));

  if (value && !days.includes(value)) {
    days.push(value);
  }

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [value]);

  return (
    <div className="scrollbar-none -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1">
      {days.map((day) => {
        const open = business.workingDays.includes(isoWeekday(day));
        const selected = day === value;

        return (
          <button
            key={day}
            ref={selected ? selectedRef : undefined}
            type="button"
            disabled={!open}
            aria-pressed={selected}
            aria-label={formatDate(day, { weekday: 'long', day: 'numeric', month: 'long' })}
            onClick={() => onChange(day)}
            className={cn(
              'flex w-12 shrink-0 flex-col items-center gap-0.5 rounded-xl border py-2 font-mono transition',
              selected
                ? 'border-ink bg-ink text-paper'
                : 'border-line bg-raised hover:border-ink-faint',
              !open && 'cursor-not-allowed opacity-35',
            )}
          >
            <span className="text-[10px] uppercase">{formatDate(day, { weekday: 'short' })}</span>
            <span className="text-base font-semibold leading-none">
              {formatDate(day, { day: 'numeric' })}
            </span>
          </button>
        );
      })}
    </div>
  );
}
