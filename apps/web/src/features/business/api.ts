import type { Business } from '@concierge/contracts';
import { http } from '../../lib/http';

export const businessApi = {
  find: (slug: string) => http.get<Business>(`/businesses/${slug}`),
};
