import { z } from 'zod';

export const calendarDateSchema = z.iso.date();
export const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm');

export const createAppointmentSchema = z.object({
  id: z.uuid(),
  serviceId: z.uuid(),
  date: calendarDateSchema,
  time: timeOfDaySchema,
  notes: z.string().trim().max(500).optional(),
  sessionId: z.uuid().optional(),
});

export const appointmentListQuerySchema = z.object({
  scope: z.enum(['upcoming', 'history']).default('upcoming'),
});

export const availabilityQuerySchema = z.object({
  serviceId: z.uuid(),
  date: calendarDateSchema,
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type AppointmentListQuery = z.infer<typeof appointmentListQuerySchema>;
export type AppointmentScope = AppointmentListQuery['scope'];
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

export type AppointmentStatus = 'confirmed' | 'cancelled';

export interface Appointment {
  id: string;
  serviceId: string;
  serviceName: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  notes: string | null;
  sessionId: string | null;
  createdAt: string;
}

export interface Availability {
  serviceId: string;
  date: string;
  times: string[];
}
