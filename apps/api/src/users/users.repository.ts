import type { User } from '@concierge/contracts';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { type Database, InjectDatabase } from '../database/database.js';
import { users } from '../database/schema.js';

const userColumns = {
  id: users.id,
  businessId: users.businessId,
  email: users.email,
  fullName: users.fullName,
};

export interface NewUser {
  businessId: string;
  email: string;
  fullName: string;
  passwordHash: string;
}

@Injectable()
export class UsersRepository {
  constructor(@InjectDatabase() private readonly db: Database) {}

  async create(values: NewUser): Promise<User> {
    const [user] = await this.db.insert(users).values(values).returning(userColumns);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await this.db.select(userColumns).from(users).where(eq(users.id, id));
    return user ?? null;
  }

  async findCredentials(
    businessId: string,
    email: string,
  ): Promise<{ user: User; passwordHash: string } | null> {
    const [credentials] = await this.db
      .select({ user: userColumns, passwordHash: users.passwordHash })
      .from(users)
      .where(and(eq(users.businessId, businessId), eq(users.email, email)));
    return credentials ?? null;
  }
}
