import { Module } from '@nestjs/common';
import { BusinessesModule } from '../businesses/businesses.module.js';
import { AppointmentsController } from './appointments.controller.js';
import { AppointmentsRepository } from './appointments.repository.js';
import { AppointmentsService } from './appointments.service.js';
import { AvailabilityService } from './availability.service.js';

@Module({
  imports: [BusinessesModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsRepository, AppointmentsService, AvailabilityService],
  exports: [AppointmentsService, AvailabilityService],
})
export class AppointmentsModule {}
