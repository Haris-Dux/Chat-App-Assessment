import { motion } from 'motion/react';
import { cn } from '../../lib/cn';
import { formatClock } from '../../lib/datetime';
import { Attachment } from './attachment';
import { MentionText } from './mention-text';
import type { ThreadActions } from './thread-actions';
import type { ThreadMessage } from './types';

const speakerClass = 'text-[11px] font-semibold uppercase tracking-[0.16em]';

function SpineNode({ fromUser }: { fromUser: boolean }) {
  return (
    <span
      aria-hidden
      className="absolute left-0 top-0.5 grid size-[18px] place-items-center bg-paper"
    >
      {fromUser ? (
        <span className="size-3 rounded-full border-2 border-ink-faint" />
      ) : (
        <span className="size-2.5 rotate-45 bg-accent" />
      )}
    </span>
  );
}

export function Turn({ message, actions }: { message: ThreadMessage; actions: ThreadActions }) {
  const fromUser = message.role === 'user';

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: message.delivery === 'sending' ? 0.7 : 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="relative pl-10"
    >
      <SpineNode fromUser={fromUser} />
      <div className="flex items-baseline gap-2">
        <span className={cn(speakerClass, fromUser ? 'text-ink-soft' : 'text-accent')}>
          {fromUser ? 'You' : 'Concierge'}
        </span>
        <time dateTime={message.createdAt} className="font-mono text-[11px] text-ink-faint">
          {formatClock(message.createdAt)}
        </time>
        {message.delivery === 'sending' && (
          <span className="text-[11px] text-ink-faint">sending…</span>
        )}
        {message.delivery === 'failed' && (
          <button
            type="button"
            onClick={() => actions.retry?.(message)}
            className="text-[11px] font-medium text-accent underline underline-offset-2"
          >
            Not sent · Retry
          </button>
        )}
      </div>

      <div
        className={cn(
          'mt-1.5 break-words',
          fromUser ? 'font-display text-lg leading-relaxed' : 'text-[15px] leading-relaxed',
        )}
      >
        {fromUser ? (
          <MentionText content={message.content} mentions={message.mentions} />
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
      </div>

      {message.attachment && (
        <div className="mt-3">
          <Attachment attachment={message.attachment} actions={actions} />
        </div>
      )}
    </motion.li>
  );
}

export function ThinkingTurn() {
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="relative pl-10"
    >
      <span
        aria-hidden
        className="absolute left-0 top-0.5 grid size-[18px] place-items-center bg-paper"
      >
        <motion.span
          className="size-2.5 bg-accent"
          animate={{ rotate: [45, 225] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </span>
      <span className={cn(speakerClass, 'text-accent')}>Concierge</span>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-faint">
        Reading your message
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="size-1 rounded-full bg-ink-faint"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: dot * 0.2 }}
          />
        ))}
      </p>
    </motion.li>
  );
}
