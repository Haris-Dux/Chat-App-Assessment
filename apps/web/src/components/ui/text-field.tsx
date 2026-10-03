import { useId, type ComponentProps } from 'react';
import { cn } from '../../lib/cn';

export function TextField({
  label,
  error,
  className,
  ...props
}: ComponentProps<'input'> & { label: string; error?: string }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft"
      >
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'h-11 w-full rounded-xl border bg-raised px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-ink',
          error ? 'border-accent' : 'border-line',
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
