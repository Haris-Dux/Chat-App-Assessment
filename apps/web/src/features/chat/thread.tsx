import { AnimatePresence } from 'motion/react';
import { useEffect, useRef } from 'react';
import type { ThreadActions } from './thread-actions';
import { ThinkingTurn, Turn } from './turn';
import type { ThreadMessage } from './types';

export function Thread({
  messages,
  replying,
  actions = {},
}: {
  messages: ThreadMessage[];
  replying: boolean;
  actions?: ThreadActions;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, replying]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <ol
        aria-live="polite"
        className="relative mx-auto max-w-2xl space-y-8 px-5 py-10 before:absolute before:inset-y-10 before:left-[28.5px] before:w-px before:bg-line"
      >
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <Turn key={message.id} message={message} actions={actions} />
          ))}
          {replying && <ThinkingTurn key="thinking" />}
        </AnimatePresence>
      </ol>
      <div ref={endRef} />
    </div>
  );
}
