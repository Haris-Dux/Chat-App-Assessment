import {
  loginSchema,
  signupSchema,
  type LoginInput,
  type SignupInput,
  type User,
} from '@concierge/contracts';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '../common/public.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import type { AuthUser } from './auth-user.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { SessionService } from './session.service.js';

const credentialsThrottle = { default: { limit: 10, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Public()
  @Throttle(credentialsThrottle)
  @Post('signup')
  async signup(
    @Body(new ZodValidationPipe(signupSchema)) input: SignupInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<User> {
    const user = await this.auth.signup(input);
    await this.sessions.start(response, user);
    return user;
  }

  @Public()
  @Throttle(credentialsThrottle)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<User> {
    const user = await this.auth.login(input);
    await this.sessions.start(response, user);
    return user;
  }

  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response): void {
    this.sessions.end(response);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser): Promise<User> {
    return this.auth.me(user.userId);
  }
}
