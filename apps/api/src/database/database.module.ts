import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import { createDatabase, DATABASE, type Database, InjectDatabase } from './database.js';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        createDatabase(config.get('DATABASE_URL', { infer: true })),
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@InjectDatabase() private readonly db: Database) {}

  async onApplicationShutdown(): Promise<void> {
    await this.db.$client.end();
  }
}
