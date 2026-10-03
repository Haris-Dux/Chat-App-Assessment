import { Inject } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

export const DATABASE = Symbol('DATABASE');

export const InjectDatabase = () => Inject(DATABASE);

export function createDatabase(url: string) {
  return drizzle({ connection: url, schema, casing: 'snake_case' });
}

export type Database = ReturnType<typeof createDatabase>;
