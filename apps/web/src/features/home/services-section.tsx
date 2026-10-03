import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { useBusiness } from '../business/business-context';

export function ServicesSection({ signedIn }: { signedIn: boolean }) {
  const { services } = useBusiness();

  return (
    <section id="services" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Services</p>
      <h2 className="mt-3 font-display text-4xl tracking-tight">What you can book</h2>
      <ul className="mt-12 grid gap-4 md:grid-cols-3">
        {services.map((service) => (
          <li
            key={service.id}
            className="group flex flex-col rounded-3xl border border-line bg-surface p-6 transition hover:border-ink-faint"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-xl">{service.name}</h3>
              <span className="shrink-0 font-mono text-xs text-ink-faint">
                {service.durationMinutes} min
              </span>
            </div>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
              {service.description}
            </p>
            <Link
              to={signedIn ? '/chat' : '/signup'}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent"
            >
              Book this
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
