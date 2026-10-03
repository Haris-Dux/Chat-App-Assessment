import type { User } from '@concierge/contracts';
import { queryOptions, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { authApi } from './api';

export const meQuery = queryOptions({
  queryKey: ['me'],
  queryFn: authApi.me,
});

function useStoreUser() {
  const queryClient = useQueryClient();
  return (user: User | null) => queryClient.setQueryData(meQuery.queryKey, user);
}

export function useLogin() {
  const storeUser = useStoreUser();
  return useMutation({ mutationFn: authApi.login, onSuccess: storeUser });
}

export function useSignup() {
  const storeUser = useStoreUser();
  return useMutation({ mutationFn: authApi.signup, onSuccess: storeUser });
}

export function useLogout() {
  const storeUser = useStoreUser();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: async () => {
      storeUser(null);
      await navigate({ to: '/' });
    },
  });
}

export function getCurrentUser(queryClient: QueryClient): User | null {
  return queryClient.getQueryData(meQuery.queryKey) ?? null;
}
