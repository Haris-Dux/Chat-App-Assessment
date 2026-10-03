import { cn } from '../../lib/cn';
import { formatDate, isoWeekday, shiftDate, todayIn } from '../../lib/datetime';
import { useBusiness } from '../business/business-context';

const A_MONDAY = '2024-01-01';

const week = Array.from({ length: 7 }, (_, offset) => ({
  isoDay: offset + 1,
  name: formatDate(shiftDate(A_MONDAY, offset), { weekday: 'long' }),
}));

export function HoursSection() {
  const { opensAt, closesAt, workingDays, timezone } = useBusiness();
  const today = isoWeekday(todayIn(timezone));

  return (
    <section id="hours" className="scroll-mt-20 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Hours</p>
          <h2 className="mt-3 font-display text-4xl tracking-tight">When we're open</h2>
          <p className="mt-4 max-w-sm text-ink-soft">
            The concierge takes requests around the clock and only offers times inside these hours.
            All times are in {timezone.replace('_', ' ')} time.
          </p>
        </div>

        <dl className="divide-y divide-line rounded-3xl border border-line bg-paper px-6">
          {week.map(({ isoDay, name }) => {
            const open = workingDays.includes(isoDay);
            return (
              <div
                key={isoDay}
                className={cn(
                  'flex items-center justify-between py-3.5 text-sm',
                  isoDay === today && 'font-semibold',
                )}
              >
                <dt className="flex items-center gap-2">
                  {name}
                  {isoDay === today && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
                      Today
                    </span>
                  )}
                </dt>
                <dd className={cn('font-mono', !open && 'text-ink-faint')}>
                  {open ? `${opensAt}–${closesAt}` : 'Closed'}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
