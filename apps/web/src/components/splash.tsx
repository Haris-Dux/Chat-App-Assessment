import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Mark } from './mark';

export function Splash({ error, onRetry }: { error?: string; onRetry?: () => void }) {
  return (
    <div className="grid h-full place-items-center">
      <div className="flex flex-col items-center gap-5 text-center">
        <motion.div
          animate={error ? undefined : { rotate: [0, 90, 90, 180], scale: [1, 0.9, 0.9, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Mark className="size-10" />
        </motion.div>
        {error && (
          <>
            <p className="max-w-xs text-sm text-ink-soft">{error}</p>
            <Button variant="outline" onClick={onRetry}>
              Try again
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
