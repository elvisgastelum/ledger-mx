import { describe, it, expect, beforeEach } from "vitest";
import { EnsureSystemAccountsUseCase } from "./ensure-system-accounts.use-case";
import type {
  AccountRepository,
  UserId,
  AccountId,
  SystemRole,
} from "@ledger-mx/domain";
import type { IdGenerator } from "../../auth/ports/id-generator.port";
import type { Clock } from "../../auth/ports/clock.port";
import type { Account } from "@ledger-mx/domain";

// In-memory fake repository
class FakeAccountRepository implements AccountRepository {
  private accounts: Map<string, Account> = new Map();

  async save(account: Account): Promise<void> {
    this.accounts.set(`${account.userId}:${account.id}`, account);
  }

  async findById(userId: UserId, id: AccountId): Promise<Account | null> {
    return this.accounts.get(`${userId}:${id}`) ?? null;
  }

  async listByUserId(userId: UserId): Promise<Account[]> {
    return Array.from(this.accounts.values())
      .filter((a) => a.userId === userId && !a.deletedAt)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async archive(userId: UserId, id: AccountId, deletedAt: Date): Promise<void> {
    const account = await this.findById(userId, id);
    if (account) {
      account.status = "archived";
      account.updatedAt = new Date();
      account.deletedAt = deletedAt;
      await this.save(account);
    }
  }

  async findSystemAccounts(userId: UserId): Promise<Account[]> {
    return Array.from(this.accounts.values())
      .filter(
        (a) => a.userId === userId && a.ownership === "system" && !a.deletedAt,
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async findBySystemRole(
    userId: UserId,
    role: SystemRole,
  ): Promise<Account | null> {
    if (role === null) return null;

    const accounts = Array.from(this.accounts.values()).filter(
      (a) =>
        a.userId === userId &&
        a.ownership === "system" &&
        a.systemRole === role &&
        !a.deletedAt,
    );

    return accounts[0] ?? null;
  }

  reset() {
    this.accounts.clear();
  }
}

class FakeIdGenerator implements IdGenerator {
  private counter = 0;

  uuid(): string {
    return `00000000-0000-4000-8000-${String(++this.counter).padStart(12, "0")}`;
  }
}

class FakeClock implements Clock {
  now(): Date {
    return new Date("2024-01-01T00:00:00Z");
  }
}

describe("EnsureSystemAccountsUseCase", () => {
  let useCase: EnsureSystemAccountsUseCase;
  let repo: FakeAccountRepository;
  let idGenerator: FakeIdGenerator;
  let clock: FakeClock;
  const USER_ID = "00000000-0000-4000-8000-000000000101" as UserId;

  beforeEach(() => {
    repo = new FakeAccountRepository();
    idGenerator = new FakeIdGenerator();
    clock = new FakeClock();
    useCase = new EnsureSystemAccountsUseCase(repo, idGenerator, clock);
  });

  describe("idempotency", () => {
    it("should create all three system accounts on first call", async () => {
      const result = await useCase.execute(USER_ID);

      expect(result).toHaveLength(3);

      const names = result.map((a) => a.name).sort();
      expect(names).toEqual(["Expense", "Income", "Salary"]);

      const roles = result.map((a) => a.systemRole).sort();
      expect(roles).toEqual(["expense", "income", "salary"]);
    });

    it("should return existing accounts on second call (idempotent)", async () => {
      // First call creates
      const result1 = await useCase.execute(USER_ID);
      expect(result1).toHaveLength(3);

      // Second call should return same accounts
      const result2 = await useCase.execute(USER_ID);
      expect(result2).toHaveLength(3);

      // Verify same IDs
      const ids1 = result1.map((a) => a.id).sort();
      const ids2 = result2.map((a) => a.id).sort();
      expect(ids1).toEqual(ids2);
    });

    it("should only create missing system accounts", async () => {
      // Pre-create Expense account
      await repo.save({
        id: "00000000-0000-4000-8000-000000000001" as AccountId,
        userId: USER_ID,
        name: "Expense",
        type: "cash",
        currencyCode: "USD",
        status: "active",
        createdAt: clock.now(),
        updatedAt: clock.now(),
        deletedAt: null,
        ownership: "system",
        systemRole: "expense",
      });

      // Should only create Income and Salary
      const result = await useCase.execute(USER_ID);

      expect(result).toHaveLength(3);

      const names = result.map((a) => a.name).sort();
      expect(names).toEqual(["Expense", "Income", "Salary"]);
    });
  });

  describe("user scoping", () => {
    it("should not be affected by another user's system accounts", async () => {
      const OTHER_USER_ID = "00000000-0000-4000-8000-000000000999" as UserId;

      // Other user has system accounts
      await repo.save({
        id: "00000000-0000-4000-8000-000000000001" as AccountId,
        userId: OTHER_USER_ID,
        name: "Expense",
        type: "cash",
        currencyCode: "USD",
        status: "active",
        createdAt: clock.now(),
        updatedAt: clock.now(),
        deletedAt: null,
        ownership: "system",
        systemRole: "expense",
      });

      // Current user should still get all three accounts created
      const result = await useCase.execute(USER_ID);

      expect(result).toHaveLength(3);
    });

    it("should create system accounts only for the specified user", async () => {
      await useCase.execute(USER_ID);

      // Other user should not have system accounts
      const otherUserAccounts = await repo.listByUserId(
        "00000000-0000-4000-8000-000000000999" as UserId,
      );

      expect(otherUserAccounts).toHaveLength(0);
    });
  });

  describe("account properties", () => {
    it("should create system accounts with correct properties", async () => {
      const result = await useCase.execute(USER_ID);

      for (const account of result) {
        expect(account.ownership).toBe("system");
        expect(account.systemRole).not.toBeNull();
        expect(account.type).toBe("cash");
        expect(account.status).toBe("active");
        expect(account.deletedAt).toBeNull();
      }
    });
  });
});
