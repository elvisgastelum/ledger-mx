import { describe, it, expect, beforeEach } from "vitest";
import { UpdateAccountUseCase } from "./update-account.use-case";
import { SystemAccountModificationError } from "../account.errors";
import type {
  AccountRepository,
  UserId,
  AccountId,
  Account,
} from "@ledger-mx/domain";
import type { UpdateAccountInput } from "../account.types";

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
    role: "expense" | "income" | "salary" | null,
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

class FakeClock {
  now(): Date {
    return new Date("2024-01-01T00:00:00Z");
  }
}

describe("UpdateAccountUseCase", () => {
  let useCase: UpdateAccountUseCase;
  let repo: FakeAccountRepository;
  let clock: FakeClock;
  const USER_ID = "00000000-0000-4000-8000-000000000101" as UserId;
  const ACCOUNT_ID = "00000000-0000-4000-8000-000000000201" as AccountId;

  beforeEach(() => {
    repo = new FakeAccountRepository();
    clock = new FakeClock();
    useCase = new UpdateAccountUseCase(repo, clock);
  });

  describe("system account protection", () => {
    it("should throw SystemAccountModificationError when updating a system account", async () => {
      // Create a system account
      const systemAccount: Account = {
        id: ACCOUNT_ID,
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
      };

      await repo.save(systemAccount);

      // Attempt to update should throw
      await expect(
        useCase.execute({
          userId: USER_ID,
          id: ACCOUNT_ID,
          name: "New Name",
        } as UpdateAccountInput),
      ).rejects.toThrow(SystemAccountModificationError);
    });

    it("should allow updating a non-system account", async () => {
      // Create a regular account
      const regularAccount: Account = {
        id: ACCOUNT_ID,
        userId: USER_ID,
        name: "My Checking",
        type: "debit",
        currencyCode: "USD",
        status: "active",
        createdAt: clock.now(),
        updatedAt: clock.now(),
        deletedAt: null,
        ownership: "user",
        systemRole: null,
      };

      await repo.save(regularAccount);

      // Update should succeed
      const result = await useCase.execute({
        userId: USER_ID,
        id: ACCOUNT_ID,
        name: "Updated Name",
      } as UpdateAccountInput);

      expect(result.name).toBe("Updated Name");
    });
  });
});
