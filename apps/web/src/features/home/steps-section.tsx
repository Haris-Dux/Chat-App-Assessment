import { CircleCheck, MessageSquareText, Ticket } from 'lucide-react';

const steps = [
  {
    icon: MessageSquareText,
    title: 'Say it your way',
    text: 'Type what you need the way you would say it at the front desk. No dropdowns to fight with.',
  },
  {
    icon: Ticket,
    title: 'Watch the ticket fill in',
    text: 'The concierge picks out the service, day and time and checks what is actually free. If anything is unclear, the ticket becomes a simple form.',
  },
  {
    icon: CircleCheck,
    title: 'Confirm with one tap',
    text: 'Nothing is booked until you confirm. Your appointment shows up instantly, and you can cancel any time before it starts.',
  },
];

export function StepsSection() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-y border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">How it works</p>
        <h2 className="mt-3 max-w-xl font-display text-4xl tracking-tight">
          Booking that feels like a conversation
        </h2>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="rounded-3xl border border-line bg-paper p-6">
              <div className="flex items-center justify-between">
                <Icon className="size-5 text-accent" aria-hidden />
                <span className="font-mono text-xs text-ink-faint">0{index + 1}</span>
              </div>
              <h3 className="mt-6 font-display text-xl">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
