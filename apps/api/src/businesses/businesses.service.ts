import type { Business } from '@concierge/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessesRepository } from './businesses.repository.js';

@Injectable()
export class BusinessesService {
  constructor(private readonly businesses: BusinessesRepository) {}

  async findBySlug(slug: string): Promise<Business> {
    return this.require(await this.businesses.findBySlug(slug));
  }

  async findById(id: string): Promise<Business> {
    return this.require(await this.businesses.findById(id));
  }

  private require(business: Business | null): Business {
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }
}
