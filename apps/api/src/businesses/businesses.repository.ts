import type { Business } from '@concierge/contracts';
import { Injectable } from '@nestjs/common';
import { and, asc, eq, type SQL } from 'drizzle-orm';
import { type Database, InjectDatabase } from '../database/database.js';
import { businesses, services } from '../database/schema.js';

@Injectable()
export class BusinessesRepository {
  constructor(@InjectDatabase() private readonly db: Database) {}

  findBySlug(slug: string): Promise<Business | null> {
    return this.findOne(eq(businesses.slug, slug));
  }

  findById(id: string): Promise<Business | null> {
    return this.findOne(eq(businesses.id, id));
  }

  private async findOne(condition: SQL): Promise<Business | null> {
    const [business] = await this.db
      .select({
        id: businesses.id,
        slug: businesses.slug,
        name: businesses.name,
        timezone: businesses.timezone,
        opensAt: businesses.opensAt,
        closesAt: businesses.closesAt,
        workingDays: businesses.workingDays,
      })
      .from(businesses)
      .where(condition);

    if (!business) {
      return null;
    }

    const offered = await this.db
      .select({
        id: services.id,
        name: services.name,
        description: services.description,
        durationMinutes: services.durationMinutes,
      })
      .from(services)
      .where(and(eq(services.businessId, business.id), eq(services.active, true)))
      .orderBy(asc(services.name));

    return {
      ...business,
      opensAt: business.opensAt.slice(0, 5),
      closesAt: business.closesAt.slice(0, 5),
      services: offered,
    };
  }
}
