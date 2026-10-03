import type { Request } from 'express';

export interface AuthUser {
  userId: string;
  businessId: string;
}

export type AuthRequest = Request & { user?: AuthUser };
