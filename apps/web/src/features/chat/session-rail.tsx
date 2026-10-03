import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { formatRelative } from '../../lib/datetime';
import { sessionsQuery } from './queries';

export function SessionRail({ onNavigate }: { onNavigate: () => void }) {
  const sessions = useQuery(sessionsQuery);

  return (
    <section>
      <Link
        to="/chat"
        onClick={onNavigate}
        className="mb-6 flex items-center justify-center gap-2 rounded-full border border-line bg-raised py-2.5 text-sm font-medium transition hover:border-ink-faint"
      >
        <Plus className="size-4" aria-hidden />
        New conversation
      </Link>

      <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
        Conversations
      </h2>

      {sessions.isPending && (
        <div className="space-y-2" aria-hidden>
          {[0, 1, 2].map((row) => (
            <div key={row} className="h-11 animate-pulse rounded-xl bg-line/50" />
          ))}
        </div>
      )}
      {sessions.isError && <p className="px-1 text-xs text-accent">{sessions.error.message}</p>}

      <ul className="space-y-0.5">
        <AnimatePresence initial={false}>
          {sessions.data?.map((session) => (
            <motion.li
              key={session.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              <Link
                to="/chat/$sessionId"
                params={{ sessionId: session.id }}
                onClick={onNavigate}
                className="group block rounded-xl px-3 py-2 transition hover:bg-ink/5"
                activeProps={{ className: 'bg-raised shadow-sm ring-1 ring-line' }}
              >
                <span className="block truncate text-sm">
                  {session.title ?? 'New conversation'}
                </span>
                <span className="font-mono text-[10px] text-ink-faint">
                  {formatRelative(session.lastMessageAt)}
                </span>
              </Link>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
