import type {
  Appointment,
  AppointmentScope,
  Business,
  CreateAppointmentInput,
} from '@concierge/contracts';
import { queryOptions, skipToken, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../../lib/http';
import { zonedInstant } from '../../lib/datetime';
import { findService, useBusiness } from '../business/business-context';
import { appointmentsApi } from './api';
import {
  appointmentKeys,
  applyAppointment,
  discardAppointment,
  type ListedAppointment,
} from './cache';

export const appointmentsQuery = (scope: AppointmentScope) =>
  queryOptions<ListedAppointment[]>({
    queryKey: appointmentKeys.list(scope),
    queryFn: () => appointmentsApi.list(scope),
  });

export const availabilityQuery = (serviceId: string, date: string) =>
  queryOptions({
    queryKey: appointmentKeys.availability(serviceId, date),
    queryFn:
      serviceId && date ? () => appointmentsApi.availability({ serviceId, date }) : skipToken,
  });

function projectAppointment(business: Business, input: CreateAppointmentInput): ListedAppointment {
  const service = findService(business, input.serviceId);
  const startsAt = zonedInstant(input.date, input.time, business.timezone);
  const durationMs = (service?.durationMinutes ?? 0) * 60_000;

  return {
    id: input.id,
    serviceId: input.serviceId,
    serviceName: service?.name ?? 'Appointment',
    startsAt: startsAt.toISOString(),
    endsAt: new Date(startsAt.getTime() + durationMs).toISOString(),
    status: 'confirmed',
    notes: input.notes ?? null,
    sessionId: input.sessionId ?? null,
    createdAt: new Date().toISOString(),
    pending: true,
  };
}

export function useBookAppointment() {
  const queryClient = useQueryClient();
  const business = useBusiness();

  return useMutation({
    mutationFn: appointmentsApi.create,
    onMutate: (input) => applyAppointment(queryClient, projectAppointment(business, input)),
    onSuccess: (appointment) => applyAppointment(queryClient, appointment),
    onError: (error, input) => {
      discardAppointment(queryClient, input.id);
      if (error instanceof ApiError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: appointmentKeys.allAvailability });
      }
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointment: Appointment) => appointmentsApi.cancel(appointment.id),
    onMutate: (appointment) =>
      applyAppointment(queryClient, { ...appointment, status: 'cancelled' }),
    onSuccess: (appointment) => applyAppointment(queryClient, appointment),
    onError: (_error, appointment) => applyAppointment(queryClient, appointment),
  });
}
