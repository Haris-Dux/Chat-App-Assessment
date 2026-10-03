import type { Business } from '@concierge/contracts';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { useBusiness } from '../../features/business/business-context';
import { Composer } from '../../features/chat/composer';
import {
  pendingMessage,
  useStartConversation,
  type ConversationStart,
} from '../../features/chat/queries';
import { Thread } from '../../features/chat/thread';
import { createId } from '../../lib/id';

export const Route = createFileRoute('/_app/chat/')({
  component: NewConversation,
});

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function suggestions({ services }: Business): string[] {
  const [first, second] = services;
  return [
    first && `${first.name} next Tuesday afternoon, please`,
    second && `Any ${second.name.toLowerCase()} slots on Friday?`,
    'Show my upcoming appointments',
  ].filter((suggestion): suggestion is string => Boolean(suggestion));
}

function draftConversation(content: string): ConversationStart {
  const now = new Date().toISOString();
  return {
    session: { id: createId(), title: content, draft: {}, createdAt: now, lastMessageAt: now },
    message: { id: createId(), content },
  };
}

function NewConversation() {
  const { user } = Route.useRouteContext();
  const business = useBusiness();
  const navigate = useNavigate();
  const start = useStartConversation();

  const begin = (conversation: ConversationStart) =>
    start.mutate(conversation, {
      onSuccess: () =>
        navigate({ to: '/chat/$sessionId', params: { sessionId: conversation.session.id } }),
    });

  const send = (content: string) => begin(draftConversation(content));

  const pending = start.variables;

  if (pending) {
    return (
      <div className="flex h-full flex-col">
        <Thread
          messages={[
            pendingMessage(
              pending.session.id,
              pending.message,
              start.isError ? 'failed' : 'sending',
            ),
          ]}
          replying={!start.isError}
          actions={{ retry: () => begin(pending) }}
        />
        <div className="px-4 pb-5">
          <Composer onSend={send} disabled />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
            {business.name} · concierge
          </p>
          <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">
            {greeting()}, {user.fullName.split(' ')[0]}.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-ink-soft">
            What can we book for you? Describe it the way you'd say it out loud.
          </p>
        </motion.div>

        <ul className="mt-10 flex max-w-2xl flex-wrap justify-center gap-2">
          {suggestions(business).map((suggestion, index) => (
            <motion.li
              key={suggestion}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.07 }}
            >
              <button
                type="button"
                onClick={() => send(suggestion)}
                className="rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink-soft transition hover:border-accent hover:text-ink"
              >
                {suggestion}
              </button>
            </motion.li>
          ))}
        </ul>
      </div>
      <div className="px-4 pb-5">
        <Composer onSend={send} autoFocus />
      </div>
    </div>
  );
}
