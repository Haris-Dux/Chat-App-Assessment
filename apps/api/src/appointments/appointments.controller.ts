import {
  appointmentListQuerySchema,
  availabilityQuerySchema,
  createAppointmentSchema,
  type Appointment,
  type AppointmentListQuery,
  type Availability,
  type AvailabilityQuery,
  type CreateAppointmentInput,
} from '@concierge/contracts';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { AppointmentsService } from './appointments.service.js';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(appointmentListQuerySchema)) { scope }: AppointmentListQuery,
  ): Promise<Appointment[]> {
    return this.appointments.list(user, scope);
  }

  @Get('availability')
  availability(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(availabilityQuerySchema)) query: AvailabilityQuery,
  ): Promise<Availability> {
    return this.appointments.openTimes(user, query);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createAppointmentSchema)) input: CreateAppointmentInput,
  ): Promise<Appointment> {
    return this.appointments.create(user, input);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':id/cancel')
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Appointment> {
    return this.appointments.cancel(user, id);
  }
}
