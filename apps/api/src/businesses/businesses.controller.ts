import type { Business } from '@concierge/contracts';
import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../common/public.decorator.js';
import { BusinessesService } from './businesses.service.js';

@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businesses: BusinessesService) {}

  @Public()
  @Get(':slug')
  find(@Param('slug') slug: string): Promise<Business> {
    return this.businesses.findBySlug(slug);
  }
}
