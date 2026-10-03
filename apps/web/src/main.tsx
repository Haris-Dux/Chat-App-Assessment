import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { MotionConfig } from 'motion/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Splash } from './components/splash';
import { meQuery } from './features/auth/queries';
import { BusinessContext } from './features/business/business-context';
import { businessQuery } from './features/business/queries';
import { createQueryClient } from './lib/query-client';
import { routeTree } from './routeTree.gen';
import './styles.css';

const queryClient = createQueryClient(() => {
  if (queryClient.getQueryData(meQuery.queryKey)) {
    queryClient.setQueryData(meQuery.queryKey, null);
    void router.navigate({ to: '/login' });
  }
});

const router = createRouter({
  routeTree,
  context: { queryClient },
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const me = useQuery(meQuery);
  const business = useQuery(businessQuery);

  if (me.isError || business.isError) {
    return (
      <Splash
        error="We couldn't reach the concierge. Check your connection and try again."
        onRetry={() => {
          void me.refetch();
          void business.refetch();
        }}
      />
    );
  }

  if (me.isPending || business.isPending) {
    return <Splash />;
  }

  return (
    <BusinessContext value={business.data}>
      <RouterProvider router={router} />
    </BusinessContext>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
);
