import type { Availability } from '@concierge/contracts';
import type { UseQueryResult } from '@tanstack/react-query';
import { cn } from '../../lib/cn';

export function TimeSlots({
  availability,
  ready,
  value,
  onChange,
}: {
  availability: UseQueryResult<Availability>;
  ready: boolean;
  value: string;
  onChange: (time: string) => void;
}) {
  if (!ready) {
    return <p className="text-xs text-ink-faint">Pick a service and a day to see open times.</p>;
  }

  if (availability.isPending) {
    return (
      <div className="grid grid-cols-5 gap-1.5" aria-hidden>
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="h-8 animate-pulse rounded-lg bg-line/50" />
        ))}
      </div>
    );
  }

  if (availability.isError) {
    return <p className="text-xs text-accent">{availability.error.message}</p>;
  }

  const { times } = availability.data;

  return (
    <>
      {times.length === 0 ? (
        <p className="text-xs text-ink-faint">No open times on this day. Try another one.</p>
      ) : (
        <div className="grid grid-cols-5 gap-1.5">
          {times.map((time) => (
            <button
              key={time}
              type="button"
              aria-pressed={time === value}
              onClick={() => onChange(time)}
              className={cn(
                'h-8 rounded-lg border font-mono text-xs transition',
                time === value
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-line bg-raised hover:border-ink-faint',
              )}
            >
              {time}
            </button>
          ))}
        </div>
      )}
      {value && !times.includes(value) && (
        <p className="mt-2 text-xs text-accent">{value} isn't available. Pick another time.</p>
      )}
    </>
  );
}
