import { AnimatePresence, motion } from 'motion/react';

export function FormError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm text-ink"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
