import { motion } from 'motion/react';
import { cn } from '../lib/cn';

const sizes = {
  sm: {
    className: 'rounded border-2 px-2 py-0.5 text-[10px] tracking-[0.2em]',
    initial: { scale: 1.6, rotate: -18 },
    rotate: -8,
  },
  lg: {
    className: 'rounded-xl border-4 px-5 py-1.5 text-2xl tracking-[0.3em]',
    initial: { scale: 2.2, rotate: -24 },
    rotate: -10,
  },
};

export function Stamp({
  size = 'sm',
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  const { className: sizeClass, initial, rotate } = sizes[size];

  return (
    <motion.span
      initial={{ ...initial, opacity: 0 }}
      animate={{ scale: 1, rotate, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 17 }}
      className={cn(
        'inline-block border-positive font-mono font-bold text-positive',
        sizeClass,
        className,
      )}
    >
      BOOKED
    </motion.span>
  );
}
