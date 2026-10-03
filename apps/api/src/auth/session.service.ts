import type { User } from '@concierge/contracts';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Response } from 'express';
import type { Env } from '../config/env.js';
import type { AuthUser } from './auth-user.js';

export const SESSION_COOKIE = 'concierge_session';

interface SessionClaims {
  sub: string;
  businessId: string;
}

@Injectable()
export class SessionService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async start(response: Response, user: User): Promise<void> {
    const claims: SessionClaims = { sub: user.id, businessId: user.businessId };
    const token = await this.jwt.signAsync(claims);

    response.cookie(SESSION_COOKIE, token, {
      ...this.cookieOptions(),
      maxAge: this.config.get('JWT_TTL_SECONDS', { infer: true }) * 1000,
    });
  }

  end(response: Response): void {
    response.clearCookie(SESSION_COOKIE, this.cookieOptions());
  }

  async resolve(token: string | undefined): Promise<AuthUser | null> {
    if (!token) {
      return null;
    }

    try {
      const { sub, businessId } = await this.jwt.verifyAsync<SessionClaims>(token);
      return { userId: sub, businessId };
    } catch {
      return null;
    }
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('COOKIE_SECURE', { infer: true }),
      path: '/',
    };
  }
}
