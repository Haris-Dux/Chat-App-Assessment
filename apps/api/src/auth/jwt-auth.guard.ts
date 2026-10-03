import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC } from '../common/public.decorator.js';
import type { AuthRequest } from './auth-user.js';
import { SESSION_COOKIE, SessionService } from './session.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = await this.sessions.resolve(request.cookies[SESSION_COOKIE]);

    if (!user) {
      throw new UnauthorizedException('Please sign in to continue');
    }

    request.user = user;
    return true;
  }
}
