import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppointmentsModule } from './appointments/appointments.module.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import { BusinessesModule } from './businesses/businesses.module.js';
import { ChatModule } from './chat/chat.module.js';
import { ApiExceptionFilter } from './common/api-exception.filter.js';
import { UserThrottlerGuard } from './common/user-throttler.guard.js';
import { validateEnv } from './config/env.js';
import { loggerOptions } from './config/logger.js';
import { DatabaseModule } from './database/database.module.js';
import { RealtimeModule } from './realtime/realtime.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRootAsync({ inject: [ConfigService], useFactory: loggerOptions }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
      errorMessage: 'Too many requests, please slow down',
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    AuthModule,
    BusinessesModule,
    AppointmentsModule,
    ChatModule,
    RealtimeModule,
  ],
  providers: [
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_GUARD, useClass: UserThrottlerGuard },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class AppModule {}
