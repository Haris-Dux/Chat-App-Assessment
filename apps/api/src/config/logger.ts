import { ConfigService } from '@nestjs/config';
import type { Params } from 'nestjs-pino';
import type { Env } from './env.js';

export function loggerOptions(config: ConfigService<Env, true>): Params {
  const pretty = config.get('NODE_ENV', { infer: true }) === 'development';

  return {
    pinoHttp: {
      level: config.get('LOG_LEVEL', { infer: true }),
      transport: pretty ? { target: 'pino-pretty', options: { singleLine: true } } : undefined,
      serializers: {
        req: (request: { id: string; method: string; url: string }) => ({
          id: request.id,
          method: request.method,
          url: request.url,
        }),
        res: (response: { statusCode: number }) => ({ statusCode: response.statusCode }),
      },
    },
  };
}
