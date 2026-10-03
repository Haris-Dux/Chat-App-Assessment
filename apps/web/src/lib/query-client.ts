import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from './http';

const isClientError = (error: Error) =>
  error instanceof ApiError && error.status >= 400 && error.status < 500;

export function createQueryClient(onUnauthorized: () => void): QueryClient {
  const handleError = (error: Error) => {
    if (error instanceof ApiError && error.status === 401) {
      onUnauthorized();
    }
  };

  return new QueryClient({
    queryCache: new QueryCache({ onError: handleError }),
    mutationCache: new MutationCache({ onError: handleError }),
    defaultOptions: {
      queries: {
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always',
        retry: (failureCount, error) => !isClientError(error) && failureCount < 2,
      },
    },
  });
}
