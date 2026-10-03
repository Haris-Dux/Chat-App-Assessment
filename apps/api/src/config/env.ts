import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32),
  JWT_TTL_SECONDS: z.coerce.number().int().positive().default(28_800),
  COOKIE_SECURE: z.stringbool().default(false),
  MISTRAL_API_KEY: z.string().default(''),
  MISTRAL_MODEL: z.string().default('ministral-8b-latest'),
  MISTRAL_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  return envSchema.parse(config);
}
