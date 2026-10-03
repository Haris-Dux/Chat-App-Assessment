import type {
  Appointment,
  AppointmentScope,
  Availability,
  AvailabilityQuery,
  Business,
  CreateAppointmentInput,
  Service,
} from '@concierge/contracts';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { AuthUser } from '../auth/auth-user.js';
import { BusinessesService } from '../businesses/businesses.service.js';
import { PgErrorCode, pgErrorCode } from '../database/pg-errors.js';
import { APPOINTMENT_SAVED, type AppointmentSavedEvent } from './appointment.events.js';
import { AppointmentsRepository, type NewAppointment } from './appointments.repository.js';
import { AvailabilityService, describeSlotProblem } from './availability.service.js';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointments: AppointmentsRepository,
    private readonly availability: AvailabilityService,
    private readonly businesses: BusinessesService,
    private readonly events: EventEmitter2,
  ) {}

  list(user: AuthUser, scope: AppointmentScope): Promise<Appointment[]> {
    return this.appointments.listForUser(user.userId, scope, new Date());
  }

  async openTimes(user: AuthUser, { serviceId, date }: AvailabilityQuery): Promise<Availability> {
    const business = await this.businesses.findById(user.businessId);
    const times = await this.availability.openTimes(
      business,
      findService(business, serviceId),
      date,
    );
    return { serviceId, date, times };
  }

  async create(user: AuthUser, input: CreateAppointmentInput): Promise<Appointment> {
    const existing = await this.appointments.findOwned(input.id, user.userId);
    if (existing) {
      return existing;
    }

    const business = await this.businesses.findById(user.businessId);
    const service = findService(business, input.serviceId);
    const slot = await this.availability.check(business, service, input.date, input.time);

    if (slot.status !== 'open') {
      const message = describeSlotProblem(slot.status, business);
      throw slot.status === 'taken'
        ? new ConflictException(message)
        : new UnprocessableEntityException(message);
    }

    const appointment = await this.insert({
      id: input.id,
      businessId: business.id,
      userId: user.userId,
      serviceId: service.id,
      chatSessionId: input.sessionId,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      notes: input.notes || undefined,
    });

    this.publish({ userId: user.userId, change: 'created', appointment });
    return appointment;
  }

  async cancel(user: AuthUser, id: string): Promise<Appointment> {
    const appointment = await this.appointments.findOwned(id, user.userId);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    if (appointment.status === 'cancelled') {
      return appointment;
    }
    if (new Date(appointment.startsAt).getTime() <= Date.now()) {
      throw new UnprocessableEntityException('Appointments that have started cannot be cancelled');
    }

    const cancelled = await this.appointments.cancel(id);
    this.publish({ userId: user.userId, change: 'cancelled', appointment: cancelled });
    return cancelled;
  }

  private async insert(values: NewAppointment): Promise<Appointment> {
    try {
      return await this.appointments.create(values);
    } catch (error) {
      switch (pgErrorCode(error)) {
        case PgErrorCode.ExclusionViolation:
          throw new ConflictException('That time was just booked by someone else.');
        case PgErrorCode.UniqueViolation:
          throw new ConflictException('This appointment id is already in use');
        case PgErrorCode.ForeignKeyViolation:
          throw new UnprocessableEntityException('That conversation does not belong to you');
        default:
          throw error;
      }
    }
  }

  private publish(event: AppointmentSavedEvent): void {
    this.events.emit(APPOINTMENT_SAVED, event);
  }
}

function findService(business: Business, serviceId: string): Service {
  const service = business.services.find(({ id }) => id === serviceId);

  if (!service) {
    throw new UnprocessableEntityException('That service is not offered');
  }

  return service;
}
