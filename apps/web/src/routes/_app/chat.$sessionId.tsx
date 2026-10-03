import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { FormProvider, useWatch } from 'react-hook-form';
import { ErrorState } from '../../components/error-state';
import { Ticket } from '../../features/booking/ticket';
import { useTicketForm } from '../../features/booking/ticket-form';
import { TicketPanel } from '../../features/booking/ticket-panel';
import { Composer } from '../../features/chat/composer';
import { sessionQuery, useSendMessage } from '../../features/chat/queries';
import { Thread } from '../../features/chat/thread';
import type { ThreadActions } from '../../features/chat/thread-actions';
import type { ThreadMessage, ThreadSession } from '../../features/chat/types';
import { ApiError } from '../../lib/http';
import { createId } from '../../lib/id';

export const Route = createFileRoute('/_app/chat/$sessionId')({
  component: ChatRoute,
});

function ChatRoute() {
  const { sessionId } = Route.useParams();
  return <ChatScreen key={sessionId} sessionId={sessionId} />;
}

function ChatScreen({ sessionId }: { sessionId: string }) {
  const session = useQuery(sessionQuery(sessionId));

  if (session.isPending) {
    return (
      <div className="mx-auto max-w-2xl space-y-8 px-5 py-10" aria-busy>
        {[0, 1, 2].map((row) => (
          <div key={row} className="space-y-2 pl-10">
            <div className="h-3 w-24 animate-pulse rounded bg-line/60" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-line/40" />
          </div>
        ))}
      </div>
    );
  }

  if (session.isError) {
    const missing = session.error instanceof ApiError && session.error.status === 404;
    return (
      <ErrorState
        message={missing ? "We couldn't find that conversation." : session.error.message}
        onRetry={missing ? undefined : () => void session.refetch()}
      >
        <Link to="/chat" className="self-center text-sm text-accent underline underline-offset-4">
          Start a new one
        </Link>
      </ErrorState>
    );
  }

  return <Conversation session={session.data} />;
}

function latestTicketPrompt(messages: ThreadMessage[]): ThreadMessage | undefined {
  return messages.findLast(
    ({ attachment }) => attachment?.type === 'proposal' || attachment?.type === 'form',
  );
}

function Conversation({ session }: { session: ThreadSession }) {
  const form = useTicketForm(session.draft);
  const send = useSendMessage(session.id);
  const prompt = latestTicketPrompt(session.messages);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [seenPromptId, setSeenPromptId] = useState(prompt?.id);
  const [nudges, setNudges] = useState(0);
  const details = useWatch({ control: form.control, name: ['serviceId', 'date', 'time'] });

  if (prompt?.id !== seenPromptId) {
    setSeenPromptId(prompt?.id);
    setTicketOpen(true);
  }

  const openTicket = () => {
    setTicketOpen(true);
    setNudges((count) => count + 1);
  };

  const actions: ThreadActions = {
    openTicket,
    pickSlot: ({ serviceId, date, time }) => {
      const options = { shouldValidate: true, shouldDirty: true };
      form.setValue('serviceId', serviceId, options);
      form.setValue('date', date, options);
      form.setValue('time', time, options);
      openTicket();
    },
    retry: ({ id, content }) => send.mutate({ id, content }),
  };

  return (
    <FormProvider {...form}>
      <div className="grid h-full lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="flex min-h-0 flex-col">
          <Thread messages={session.messages} replying={session.replying} actions={actions} />
          <div className="px-4 pb-5">
            <Composer onSend={(content) => send.mutate({ id: createId(), content })} />
          </div>
        </section>
        <TicketPanel
          open={ticketOpen}
          onOpenChange={setTicketOpen}
          progress={`${details.filter(Boolean).length}/3`}
        >
          <Ticket
            sessionId={session.id}
            signal={`${prompt?.id ?? ''}:${nudges}`}
            missing={prompt?.attachment?.type === 'form' ? prompt.attachment.missing : []}
          />
        </TicketPanel>
      </div>
    </FormProvider>
  );
}
