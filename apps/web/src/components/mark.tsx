import { cn } from '../lib/cn';

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('size-7', className)}>
      <rect width="32" height="32" rx="9" className="fill-ink" />
      <path d="M16 7l9 9-9 9-9-9z" className="fill-accent" />
    </svg>
  );
}
