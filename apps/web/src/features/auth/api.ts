import type { LoginInput, SignupInput, User } from '@concierge/contracts';
import { ApiError, http } from '../../lib/http';

export const authApi = {
  me: async (): Promise<User | null> => {
    try {
      return await http.get<User>('/auth/me');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return null;
      }
      throw error;
    }
  },
  login: (input: LoginInput) => http.post<User>('/auth/login', input),
  signup: (input: SignupInput) => http.post<User>('/auth/signup', input),
  logout: () => http.post<void>('/auth/logout'),
};
