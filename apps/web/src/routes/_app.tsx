import { createFileRoute, Link, Outlet, redirect, useRouterState } from '@tanstack/react-router';
import { LogOut, Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { Mark } from '../components/mark';
import { Button } from '../components/ui/button';
import { UserAvatar } from '../components/user-avatar';
import { UpcomingRail } from '../features/appointments/upcoming-rail';
import { getCurrentUser, useLogout } from '../features/auth/queries';
import { useBusiness } from '../features/business/business-context';
import { SessionRail } from '../features/chat/session-rail';
import { useRealtime } from '../features/realtime/use-realtime';
import { cn } from '../lib/cn';

export const Route = createFileRoute('/_app')({
  beforeLoad: ({ context }) => {
    const user = getCurrentUser(context.queryClient);

    if (!user) {
      throw redirect({ to: '/login' });
    }

    return { user };
  },
  component: AppLayout,
});

function NavItem({
  to,
  active,
  children,
}: {
  to: '/chat' | '/appointments';
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'rounded-full px-3 py-1.5 transition',
        active ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink',
      )}
    >
      {children}
    </Link>
  );
}

function AppLayout() {
  useRealtime();
  const { user } = Route.useRouteContext();
  const business = useBusiness();
  const logout = useLogout();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [railOpen, setRailOpen] = useState(false);
  const closeRail = () => setRailOpen(false);
  const onAppointments = pathname.startsWith('/appointments');

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3 sm:gap-3 sm:px-4">
        <button
          type="button"
          onClick={() => setRailOpen(true)}
          aria-label="Open conversations"
          className="-ml-1 rounded-full p-2 text-ink-soft hover:bg-ink/5 lg:hidden"
        >
          <Menu className="size-5" />
        </button>
        <Link to="/" className="flex items-center gap-2.5">
          <Mark className="size-6" />
          <span className="hidden font-display text-lg sm:inline">Concierge</span>
        </Link>
        <span className="hidden text-sm text-ink-faint md:inline">for {business.name}</span>

        <nav className="ml-auto flex items-center gap-1 text-sm">
          <NavItem to="/chat" active={!onAppointments}>
            Chat
          </NavItem>
          <NavItem to="/appointments" active={onAppointments}>
            Appointments
          </NavItem>
        </nav>

        <div className="flex items-center gap-1 border-l border-line pl-2 sm:pl-3">
          <div className="hidden sm:block">
            <UserAvatar name={user.fullName} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Sign out"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <AnimatePresence>
          {railOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeRail}
              className="fixed inset-0 z-30 bg-ink/30 lg:hidden"
            />
          )}
        </AnimatePresence>
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 flex w-72 flex-col gap-10 overflow-y-auto border-r border-line bg-paper p-4 transition-transform duration-300',
            'lg:static lg:z-auto lg:translate-x-0',
            railOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <SessionRail onNavigate={closeRail} />
          <UpcomingRail onNavigate={closeRail} />
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
