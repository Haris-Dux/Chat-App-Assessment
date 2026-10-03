import type { LoginInput, SignupInput, User } from '@concierge/contracts';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { BusinessesService } from '../businesses/businesses.service.js';
import { PgErrorCode, pgErrorCode } from '../database/pg-errors.js';
import { UsersRepository } from '../users/users.repository.js';
import { PasswordHasher } from './password-hasher.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly businesses: BusinessesService,
    private readonly hasher: PasswordHasher,
  ) {}

  async signup({ businessSlug, email, fullName, password }: SignupInput): Promise<User> {
    const business = await this.businesses.findBySlug(businessSlug);
    const passwordHash = await this.hasher.hash(password);

    try {
      return await this.users.create({ businessId: business.id, email, fullName, passwordHash });
    } catch (error) {
      if (pgErrorCode(error) === PgErrorCode.UniqueViolation) {
        throw new ConflictException('An account with this email already exists');
      }
      throw error;
    }
  }

  async login({ businessSlug, email, password }: LoginInput): Promise<User> {
    const business = await this.businesses.findBySlug(businessSlug);
    const credentials = await this.users.findCredentials(business.id, email);

    if (!credentials || !(await this.hasher.verify(credentials.passwordHash, password))) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    return credentials.user;
  }

  async me(userId: string): Promise<User> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Your session is no longer valid');
    }

    return user;
  }
}
