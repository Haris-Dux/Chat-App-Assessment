import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema.ts',
  out: './database/migrations',
  casing: 'snake_case',
});
