import type { Appointment, AppointmentScope } from '@concierge/contracts';
import type { QueryClient } from '@tanstack/react-query';
import { removeById, upsertById } from '../../lib/collections';

export type ListedAppointment = Appointment & { pending?: boolean };

export const appointmentKeys = {
  list: (scope: AppointmentScope) => ['appointments', scope] as const,
  availability: (serviceId: string, date: string) => ['availability', serviceId, date] as const,
  allAvailability: ['availability'] as const,
};

const soonestFirst = (a: Appointment, b: Appointment) => a.startsAt.localeCompare(b.startsAt);
const latestFirst = (a: Appointment, b: Appointment) => b.startsAt.localeCompare(a.startsAt);

function isUpcoming(appointment: Appointment): boolean {
  return appointment.status === 'confirmed' && new Date(appointment.startsAt) >= new Date();
}

export function applyAppointment(queryClient: QueryClient, appointment: ListedAppointment): void {
  const upcoming = isUpcoming(appointment);

  queryClient.setQueryData<ListedAppointment[]>(
    appointmentKeys.list('upcoming'),
    (list) =>
      list &&
      (upcoming
        ? upsertById(list, appointment).sort(soonestFirst)
        : removeById(list, appointment.id)),
  );
  queryClient.setQueryData<ListedAppointment[]>(
    appointmentKeys.list('history'),
    (list) =>
      list &&
      (upcoming
        ? removeById(list, appointment.id)
        : upsertById(list, appointment).sort(latestFirst)),
  );
}

export function discardAppointment(queryClient: QueryClient, id: string): void {
  queryClient.setQueryData<ListedAppointment[]>(
    appointmentKeys.list('upcoming'),
    (list) => list && removeById(list, id),
  );
}
