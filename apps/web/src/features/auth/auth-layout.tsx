import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Mark } from '../../components/mark';
import { Tagline } from '../../components/tagline';
import { useBusiness } from '../business/business-context';
import { BookingDemo } from '../home/booking-demo';

export function AuthLayout({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  const business = useBusiness();

  return (
    <div className="grid min-h-full lg:grid-cols-[1.15fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-paper lg:flex">
        <Link to="/" className="flex items-center gap-3">
          <Mark className="[&_rect]:fill-paper" />
          <span className="font-display text-lg">Concierge</span>
          <span className="text-sm text-paper/50">for {business.name}</span>
        </Link>

        <div className="max-w-md">
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight">
            <Tagline />
          </h1>
          <p className="mt-6 text-paper/60">
            Describe your visit in your own words. The concierge fills in your booking ticket as you
            talk, and you confirm with one tap.
          </p>
        </div>

        <BookingDemo className="-rotate-2" />
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-10 flex items-center gap-3 lg:hidden">
            <Mark />
            <span className="font-display text-lg">Concierge</span>
            <span className="text-sm text-ink-faint">for {business.name}</span>
          </Link>
          <h2 className="font-display text-3xl tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-sm text-ink-soft">{footer}</p>
        </div>
      </main>
    </div>
  );
}
