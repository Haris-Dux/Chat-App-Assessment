import type { Appointment, AppointmentScope } from '@concierge/contracts';
import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, lt, or, sql, type SQL } from 'drizzle-orm';
import { type Database, InjectDatabase } from '../database/database.js';
import { appointments, services } from '../database/schema.js';

const HISTORY_LIMIT = 50;

const appointmentColumns = {
  id: appointments.id,
  serviceId: appointments.serviceId,
  serviceName: services.name,
  startsAt: appointments.startsAt,
  endsAt: appointments.endsAt,
  status: appointments.status,
  notes: appointments.notes,
  sessionId: appointments.chatSessionId,
  createdAt: appointments.createdAt,
};

type AppointmentRow = Omit<Appointment, 'startsAt' | 'endsAt' | 'createdAt'> & {
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
};

export interface NewAppointment {
  id: string;
  businessId: string;
  userId: string;
  serviceId: string;
  chatSessionId?: string;
  startsAt: Date;
  endsAt: Date;
  notes?: string;
}

export interface BookedSpan {
  startsAt: Date;
  endsAt: Date;
}

@Injectable()
export class AppointmentsRepository {
  constructor(@InjectDatabase() private readonly db: Database) {}

  async create(values: NewAppointment): Promise<Appointment> {
    await this.db.insert(appointments).values(values);
    const [appointment] = await this.select(eq(appointments.id, values.id));
    return toAppointment(appointment);
  }

  async findOwned(id: string, userId: string): Promise<Appointment | null> {
    const [appointment] = await this.select(
      and(eq(appointments.id, id), eq(appointments.userId, userId)),
    );
    return appointment ? toAppointment(appointment) : null;
  }

  async listForUser(userId: string, scope: AppointmentScope, now: Date): Promise<Appointment[]> {
    const owned = eq(appointments.userId, userId);
    const rows =
      scope === 'upcoming'
        ? await this.select(
            and(owned, eq(appointments.status, 'confirmed'), gte(appointments.startsAt, now)),
          ).orderBy(asc(appointments.startsAt))
        : await this.select(
            and(owned, or(eq(appointments.status, 'cancelled'), lt(appointments.startsAt, now))),
          )
            .orderBy(desc(appointments.startsAt))
            .limit(HISTORY_LIMIT);

    return rows.map(toAppointment);
  }

  async cancel(id: string): Promise<Appointment> {
    await this.db
      .update(appointments)
      .set({ status: 'cancelled', cancelledAt: new Date() })
      .where(and(eq(appointments.id, id), eq(appointments.status, 'confirmed')));
    const [appointment] = await this.select(eq(appointments.id, id));
    return toAppointment(appointment);
  }

  findBookedBetween(businessId: string, from: Date, to: Date): Promise<BookedSpan[]> {
    return this.db
      .select({ startsAt: appointments.startsAt, endsAt: appointments.endsAt })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, businessId),
          eq(appointments.status, 'confirmed'),
          sql`tstzrange(${appointments.startsAt}, ${appointments.endsAt}) && tstzrange(${from.toISOString()}::timestamptz, ${to.toISOString()}::timestamptz)`,
        ),
      );
  }

  private select(condition: SQL | undefined) {
    return this.db
      .select(appointmentColumns)
      .from(appointments)
      .innerJoin(services, eq(services.id, appointments.serviceId))
      .where(condition);
  }
}

function toAppointment(row: AppointmentRow): Appointment {
  return {
    ...row,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}
