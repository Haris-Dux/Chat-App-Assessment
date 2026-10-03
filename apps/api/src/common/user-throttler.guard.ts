import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AuthRequest } from '../auth/auth-user.js';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(request: AuthRequest): Promise<string> {
    return request.user?.userId ?? request.ip ?? 'anonymous';
  }
}
