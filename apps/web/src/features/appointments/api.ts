import type {
  Appointment,
  AppointmentScope,
  Availability,
  AvailabilityQuery,
  CreateAppointmentInput,
} from '@concierge/contracts';
import { http } from '../../lib/http';

export const appointmentsApi = {
  list: (scope: AppointmentScope) => http.get<Appointment[]>(`/appointments?scope=${scope}`),
  availability: (query: AvailabilityQuery) =>
    http.get<Availability>(`/appointments/availability?${new URLSearchParams({ ...query })}`),
  create: (input: CreateAppointmentInput) => http.post<Appointment>('/appointments', input),
  cancel: (id: string) => http.post<Appointment>(`/appointments/${id}/cancel`),
};
