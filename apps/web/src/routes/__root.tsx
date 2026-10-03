import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
  notFoundComponent: NotFound,
});

function NotFound() {
  return (
    <div className="grid h-full place-items-center px-6 text-center">
      <div>
        <p className="font-mono text-xs tracking-[0.2em] text-ink-faint">404</p>
        <h1 className="mt-3 font-display text-3xl">This page wandered off.</h1>
        <Link to="/" className="mt-6 inline-block text-sm text-accent underline underline-offset-4">
          Back to home
        </Link>
      </div>
    </div>
  );
}
