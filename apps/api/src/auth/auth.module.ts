import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BusinessesModule } from '../businesses/businesses.module.js';
import type { Env } from '../config/env.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { PasswordHasher } from './password-hasher.js';
import { SessionService } from './session.service.js';

@Module({
  imports: [
    UsersModule,
    BusinessesModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: { expiresIn: config.get('JWT_TTL_SECONDS', { infer: true }) },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordHasher, SessionService, JwtAuthGuard],
  exports: [SessionService, JwtAuthGuard],
})
export class AuthModule {}
