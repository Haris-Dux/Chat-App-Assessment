import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function FieldLabel({
  children,
  done,
  flagged = false,
  className,
}: {
  children: ReactNode;
  done: boolean;
  flagged?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]',
        className,
      )}
    >
      <span
        className={cn(
          'grid size-4 place-items-center rounded-full border transition',
          done ? 'border-positive bg-positive text-paper' : 'border-dashed',
          !done && (flagged ? 'border-accent' : 'border-ink-faint'),
        )}
      >
        {done && <Check className="size-2.5" strokeWidth={3} aria-hidden />}
      </span>
      <span className={cn(flagged && !done ? 'text-accent' : 'text-ink-soft')}>{children}</span>
    </div>
  );
}
