import { eq, and, isNull } from "drizzle-orm";
import type {
  Account,
  AccountRepository,
  AccountStatus,
  OwnershipType,
} from "@ledger-mx/domain";
import type { UserId, AccountId, SystemRole } from "@ledger-mx/domain";
import type { Database } from "../connection";
import { accounts } from "../schema";

/**
 * Drizzle ORM implementation of AccountRepository.
 */
export class DrizzleAccountRepository implements AccountRepository {
  constructor(private readonly db: Database) {}

  async save(account: Account): Promise<void> {
    const data = this.mapToDb(account);

    await this.db
      .insert(accounts)
      .values(data)
      .onConflictDoUpdate({
        target: accounts.id,
        set: {
          name: data.name,
          type: data.type,
          currencyCode: data.currencyCode,
          status: data.status,
          updatedAt: new Date(),
          deletedAt: data.deletedAt,
          ownership: data.ownership,
          systemRole: data.systemRole,
        },
        where: eq(accounts.userId, account.userId),
      });
  }

  async findById(userId: UserId, id: AccountId): Promise<Account | null> {
    const result = await this.db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.id, id),
          eq(accounts.userId, userId),
          isNull(accounts.deletedAt),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapToDomain(result[0]);
  }

  async listByUserId(userId: UserId): Promise<Account[]> {
    const result = await this.db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), isNull(accounts.deletedAt)))
      .orderBy(accounts.createdAt);

    return result.map((row) => this.mapToDomain(row));
  }

  async archive(userId: UserId, id: AccountId, deletedAt: Date): Promise<void> {
    await this.db
      .update(accounts)
      .set({
        status: "archived" as AccountStatus,
        updatedAt: new Date(),
        deletedAt: deletedAt,
      })
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
  }

  async findSystemAccounts(userId: UserId): Promise<Account[]> {
    const result = await this.db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, userId),
          eq(accounts.ownership, "system"),
          isNull(accounts.deletedAt),
        ),
      )
      .orderBy(accounts.createdAt);

    return result.map((row) => this.mapToDomain(row));
  }

  async findBySystemRole(
    userId: UserId,
    role: SystemRole,
  ): Promise<Account | null> {
    if (role === null) {
      return null;
    }

    const result = await this.db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, userId),
          eq(accounts.ownership, "system"),
          eq(accounts.systemRole, role),
          isNull(accounts.deletedAt),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapToDomain(result[0]);
  }

  private mapToDomain(row: typeof accounts.$inferSelect): Account {
    return {
      id: row.id as AccountId,
      userId: row.userId as UserId,
      name: row.name,
      type: row.type as Account["type"],
      currencyCode: row.currencyCode,
      status: row.status as AccountStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? undefined,
      ownership: row.ownership as OwnershipType,
      systemRole: (row.systemRole as SystemRole) ?? null,
    };
  }

  private mapToDb(account: Account) {
    return {
      id: account.id,
      userId: account.userId,
      name: account.name,
      type: account.type,
      currencyCode: account.currencyCode,
      status: account.status,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      deletedAt: account.deletedAt ?? null,
      ownership: account.ownership,
      systemRole: account.systemRole,
    };
  }
}
