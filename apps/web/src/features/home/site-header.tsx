import type { User } from '@concierge/contracts';
import { Link } from '@tanstack/react-router';
import { Mark } from '../../components/mark';
import { buttonClass } from '../../components/ui/button-class';
import { UserAvatar } from '../../components/user-avatar';
import { useBusiness } from '../business/business-context';

const sections = [
  { id: 'how-it-works', label: 'How it works' },
  { id: 'services', label: 'Services' },
  { id: 'hours', label: 'Hours' },
];

export function SiteHeader({ user }: { user: User | null }) {
  const business = useBusiness();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 sm:gap-8">
        <Link to="/" className="flex items-center gap-2.5">
          <Mark />
          <span className="whitespace-nowrap font-display text-lg">{business.name}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-ink-soft md:flex">
          {sections.map(({ id, label }) => (
            <a key={id} href={`#${id}`} className="transition hover:text-ink">
              {label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link to="/chat" className={buttonClass({ variant: 'accent' })}>
                Open concierge
              </Link>
              <UserAvatar name={user.fullName} />
            </>
          ) : (
            <>
              <Link to="/login" className={buttonClass({ variant: 'ghost' }, 'max-sm:hidden')}>
                Sign in
              </Link>
              <Link to="/signup" className={buttonClass({ variant: 'accent' })}>
                Book now
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
