import { cn } from '../../lib/cn';

type Variant = 'primary' | 'accent' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-ink/85',
  accent: 'bg-accent text-accent-ink hover:bg-accent/90 shadow-[0_6px_20px_-8px_var(--accent)]',
  outline: 'border border-line bg-surface text-ink hover:border-ink-faint',
  ghost: 'text-ink-soft hover:bg-ink/5 hover:text-ink',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-sm',
};

export interface ButtonStyle {
  variant?: Variant;
  size?: Size;
}

export function buttonClass({ variant = 'primary', size = 'md' }: ButtonStyle, className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45',
    variants[variant],
    sizes[size],
    className,
  );
}
