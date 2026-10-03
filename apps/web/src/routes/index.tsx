import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { Mark } from '../components/mark';
import { Tagline } from '../components/tagline';
import { buttonClass } from '../components/ui/button-class';
import { getCurrentUser } from '../features/auth/queries';
import { useBusiness } from '../features/business/business-context';
import { BookingDemo } from '../features/home/booking-demo';
import { HoursSection } from '../features/home/hours-section';
import { ServicesSection } from '../features/home/services-section';
import { SiteHeader } from '../features/home/site-header';
import { StepsSection } from '../features/home/steps-section';

const year = new Date().getFullYear();

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => ({ user: getCurrentUser(context.queryClient) }),
  component: HomePage,
});

function HomePage() {
  const { user } = Route.useRouteContext();
  const business = useBusiness();

  return (
    <div className="min-h-full">
      <SiteHeader user={user} />

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
              {business.name} · online booking
            </p>
            <h1 className="mt-5 font-display text-[2.75rem] leading-[1.05] tracking-tight sm:text-6xl">
              <Tagline />
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
              Tell our concierge what you need in your own words. It fills in your booking as you
              talk, checks what's free, and you confirm with one tap.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              {user ? (
                <>
                  <Link to="/chat" className={buttonClass({ variant: 'accent', size: 'lg' })}>
                    Open concierge
                  </Link>
                  <Link
                    to="/appointments"
                    search={{ scope: 'upcoming' }}
                    className={buttonClass({ variant: 'outline', size: 'lg' })}
                  >
                    My appointments
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/signup" className={buttonClass({ variant: 'accent', size: 'lg' })}>
                    Book an appointment
                  </Link>
                  <Link to="/login" className={buttonClass({ variant: 'outline', size: 'lg' })}>
                    I have an account
                  </Link>
                </>
              )}
            </div>
          </motion.div>

          <BookingDemo className="justify-self-center lg:justify-self-end" />
        </section>

        <StepsSection />
        <ServicesSection signedIn={Boolean(user)} />
        <HoursSection />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-ink-faint">
          <span className="flex items-center gap-2">
            <Mark className="size-5" />
            {business.name} © {year}
          </span>
          <span>Booking by Concierge</span>
        </div>
      </footer>
    </div>
  );
}
