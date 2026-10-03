import { queryOptions } from '@tanstack/react-query';
import { BUSINESS_SLUG } from '../../config';
import { businessApi } from './api';

export const businessQuery = queryOptions({
  queryKey: ['business', BUSINESS_SLUG],
  queryFn: () => businessApi.find(BUSINESS_SLUG),
});
