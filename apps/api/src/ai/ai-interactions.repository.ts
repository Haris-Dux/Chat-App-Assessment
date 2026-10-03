import { Injectable } from '@nestjs/common';
import { type Database, InjectDatabase } from '../database/database.js';
import { aiInteractions } from '../database/schema.js';

export type NewAiInteraction = typeof aiInteractions.$inferInsert;

@Injectable()
export class AiInteractionsRepository {
  constructor(@InjectDatabase() private readonly db: Database) {}

  async record(interaction: NewAiInteraction): Promise<void> {
    await this.db.insert(aiInteractions).values(interaction);
  }
}
