import { eq } from "drizzle-orm";
import type { AuthUser, NewAuthUser, UserRepository } from "@ledger-mx/domain";
import type { UserId } from "@ledger-mx/domain";
import type { Database } from "../connection";
import { users } from "../schema";

/**
 * Drizzle ORM implementation of UserRepository.
 */
export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: Database) {}

  async findByEmail(email: string): Promise<AuthUser | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapToDomain(result[0]);
  }

  async findById(id: UserId): Promise<AuthUser | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapToDomain(result[0]);
  }

  async save(user: NewAuthUser | AuthUser): Promise<void> {
    const data = this.mapToDb(user);

    await this.db
      .insert(users)
      .values(data)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: data.email,
          passwordHash: data.passwordHash,
          displayName: data.displayName,
          updatedAt: new Date(),
        },
      });
  }

  private mapToDomain(row: typeof users.$inferSelect): AuthUser {
    return {
      id: row.id as UserId,
      email: row.email,
      passwordHash: row.passwordHash ?? undefined,
      displayName: row.displayName ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? undefined,
    };
  }

  private mapToDb(user: NewAuthUser | AuthUser) {
    return {
      id: user.id,
      email: user.email.toLowerCase().trim(),
      passwordHash: user.passwordHash ?? null,
      displayName: user.displayName ?? null,
    };
  }
}
