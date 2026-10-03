import type { Appointment } from '@concierge/contracts';

export const APPOINTMENT_SAVED = 'appointment.saved';

export interface AppointmentSavedEvent {
  userId: string;
  change: 'created' | 'cancelled';
  appointment: Appointment;
}
