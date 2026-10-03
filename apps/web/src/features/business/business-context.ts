import type { Business, Service } from '@concierge/contracts';
import { createContext, use } from 'react';

export const BusinessContext = createContext<Business | null>(null);

export function useBusiness(): Business {
  const business = use(BusinessContext);

  if (!business) {
    throw new Error('useBusiness must be used inside a BusinessContext provider');
  }

  return business;
}

export function findService(
  business: Business,
  serviceId: string | undefined,
): Service | undefined {
  return business.services.find(({ id }) => id === serviceId);
}
