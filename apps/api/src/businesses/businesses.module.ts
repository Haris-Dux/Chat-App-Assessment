import { Module } from '@nestjs/common';
import { BusinessesController } from './businesses.controller.js';
import { BusinessesRepository } from './businesses.repository.js';
import { BusinessesService } from './businesses.service.js';

@Module({
  controllers: [BusinessesController],
  providers: [BusinessesRepository, BusinessesService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
