import { describe, it, expect, beforeEach } from "vitest";
import { CreateTransactionUseCase } from "./create-transaction.use-case";
import type {
  TransactionRepository,
  CategoryRepository,
  AccountRepository,
  UserId,
  TransactionId,
  AccountId,
  CategoryId,
} from "@ledger-mx/domain";
import type { Transaction, Account, Category } from "@ledger-mx/domain";
import { TransactionTargetNotFoundError } from "../transaction.errors";

// In-memory fake repositories
class FakeTransactionRepository implements TransactionRepository {
  private transactions: Map<string, Transaction> = new Map();

  async save(transaction: Transaction): Promise<void> {
    this.transactions.set(
      `${transaction.userId}:${transaction.id}`,
      transaction,
    );
  }

  async findById(
    userId: UserId,
    id: TransactionId,
  ): Promise<Transaction | null> {
    return this.transactions.get(`${userId}:${id}`) ?? null;
  }

  async listByUserId(): Promise<Transaction[]> {
    return [];
  }

  async listByAccountId(): Promise<Transaction[]> {
    return [];
  }

  async listByCategoryId(): Promise<Transaction[]> {
    return [];
  }

  async listByEnvelopeId(): Promise<Transaction[]> {
    return [];
  }

  async findReversalByOriginalId(): Promise<Transaction | null> {
    return null;
  }

  reset() {
    this.transactions.clear();
  }
}

class FakeAccountRepository implements AccountRepository {
  private accounts: Map<string, Account> = new Map();

  async save(account: Account): Promise<void> {
    this.accounts.set(`${account.userId}:${account.id}`, account);
  }

  async findById(
    userId: UserId,
    accountId: AccountId,
  ): Promise<Account | null> {
    return this.accounts.get(`${userId}:${accountId}`) ?? null;
  }

  async listByUserId(): Promise<Account[]> {
    return [];
  }

  async archive(): Promise<void> {}

  async findSystemAccounts(): Promise<Account[]> {
    return [];
  }

  async findBySystemRole(): Promise<Account | null> {
    return null;
  }

  reset() {
    this.accounts.clear();
  }

  async addAccount(account: Account): Promise<void> {
    await this.save(account);
  }
}

class FakeCategoryRepository implements CategoryRepository {
  private categories: Map<string, Category> = new Map();

  async save(category: Category): Promise<void> {
    this.categories.set(`${category.userId}:${category.id}`, category);
  }

  async findById(userId: UserId, id: CategoryId): Promise<Category | null> {
    return this.categories.get(`${userId}:${id}`) ?? null;
  }

  async listByUserId(): Promise<Category[]> {
    return [];
  }

  async listChildren(): Promise<Category[]> {
    return [];
  }

  async hasTransactionLines(): Promise<boolean> {
    return false;
  }

  async countTransactionLines(): Promise<Map<CategoryId, number>> {
    return new Map();
  }

  async softDelete(): Promise<void> {}

  async hasActiveChildren(): Promise<boolean> {
    return false;
  }

  reset() {
    this.categories.clear();
  }

  async addCategory(category: Category): Promise<void> {
    await this.save(category);
  }
}

describe("CreateTransactionUseCase", () => {
  let useCase: CreateTransactionUseCase;
  let transactionRepo: FakeTransactionRepository;
  let accountRepo: FakeAccountRepository;
  let categoryRepo: FakeCategoryRepository;
  const USER_ID = "00000000-0000-4000-8000-000000000101" as UserId;
  const OTHER_USER_ID = "00000000-0000-4000-8000-000000000999" as UserId;

  beforeEach(() => {
    transactionRepo = new FakeTransactionRepository();
    accountRepo = new FakeAccountRepository();
    categoryRepo = new FakeCategoryRepository();
    useCase = new CreateTransactionUseCase(
      transactionRepo,
      categoryRepo,
      accountRepo,
    );
  });

  describe("account target validation", () => {
    it("should throw TransactionTargetNotFoundError for non-existent account", async () => {
      const accountId = "00000000-0000-4000-8000-000000000201" as AccountId;

      await expect(
        useCase.execute({
          userId: USER_ID,
          id: "00000000-0000-4000-8000-000000000301" as TransactionId,
          transactionDate: "2024-01-01",
          type: "expense",
          note: null,
          lines: [
            {
              id: "00000000-0000-4000-8000-000000000401",
              targetType: "account",
              accountId: accountId,
              categoryId: null,
              envelopeId: null,
              amountCents: -1000,
              type: "expense",
            },
            {
              id: "00000000-0000-4000-8000-000000000402",
              targetType: "category",
              accountId: null,
              categoryId: "00000000-0000-4000-8000-000000000501",
              envelopeId: null,
              amountCents: 1000,
              type: "expense",
            },
          ],
        }),
      ).rejects.toThrow(TransactionTargetNotFoundError);
    });

    it("should throw TransactionTargetNotFoundError for account belonging to another user", async () => {
      const accountId = "00000000-0000-4000-8000-000000000201" as AccountId;

      // Create account for other user
      await accountRepo.addAccount({
        id: accountId,
        userId: OTHER_USER_ID,
        name: "Other User Account",
        type: "debit",
        currencyCode: "USD",
        status: "active",
        ownership: "user",
        systemRole: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        useCase.execute({
          userId: USER_ID,
          id: "00000000-0000-4000-8000-000000000301" as TransactionId,
          transactionDate: "2024-01-01",
          type: "expense",
          note: null,
          lines: [
            {
              id: "00000000-0000-4000-8000-000000000401",
              targetType: "account",
              accountId: accountId,
              categoryId: null,
              envelopeId: null,
              amountCents: -1000,
              type: "expense",
            },
            {
              id: "00000000-0000-4000-8000-000000000402",
              targetType: "category",
              accountId: null,
              categoryId: "00000000-0000-4000-8000-000000000501",
              envelopeId: null,
              amountCents: 1000,
              type: "expense",
            },
          ],
        }),
      ).rejects.toThrow(TransactionTargetNotFoundError);
    });
  });

  describe("category target validation", () => {
    let validAccountId: AccountId;

    beforeEach(async () => {
      validAccountId = "00000000-0000-4000-8000-000000000201" as AccountId;

      // Create valid account for user
      await accountRepo.addAccount({
        id: validAccountId,
        userId: USER_ID,
        name: "Test Account",
        type: "debit",
        currencyCode: "USD",
        status: "active",
        ownership: "user",
        systemRole: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it("should throw TransactionTargetNotFoundError for non-existent category", async () => {
      const categoryId = "00000000-0000-4000-8000-000000000501" as CategoryId;

      await expect(
        useCase.execute({
          userId: USER_ID,
          id: "00000000-0000-4000-8000-000000000301" as TransactionId,
          transactionDate: "2024-01-01",
          type: "expense",
          note: null,
          lines: [
            {
              id: "00000000-0000-4000-8000-000000000401",
              targetType: "account",
              accountId: validAccountId,
              categoryId: null,
              envelopeId: null,
              amountCents: -1000,
              type: "expense",
            },
            {
              id: "00000000-0000-4000-8000-000000000402",
              targetType: "category",
              accountId: null,
              categoryId: categoryId,
              envelopeId: null,
              amountCents: 1000,
              type: "expense",
            },
          ],
        }),
      ).rejects.toThrow(TransactionTargetNotFoundError);
    });

    it("should throw TransactionTargetNotFoundError for archived category", async () => {
      const categoryId = "00000000-0000-4000-8000-000000000501" as CategoryId;

      // Create archived category for user
      await categoryRepo.addCategory({
        id: categoryId,
        userId: USER_ID,
        name: "Archived Category",
        parentId: null,
        categoryGroupId: "00000000-0000-4000-8000-000000000601" as never,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      });

      await expect(
        useCase.execute({
          userId: USER_ID,
          id: "00000000-0000-4000-8000-000000000301" as TransactionId,
          transactionDate: "2024-01-01",
          type: "expense",
          note: null,
          lines: [
            {
              id: "00000000-0000-4000-8000-000000000401",
              targetType: "account",
              accountId: validAccountId,
              categoryId: null,
              envelopeId: null,
              amountCents: -1000,
              type: "expense",
            },
            {
              id: "00000000-0000-4000-8000-000000000402",
              targetType: "category",
              accountId: null,
              categoryId: categoryId,
              envelopeId: null,
              amountCents: 1000,
              type: "expense",
            },
          ],
        }),
      ).rejects.toThrow(TransactionTargetNotFoundError);
    });

    it("should succeed with valid category target", async () => {
      const categoryId = "00000000-0000-4000-8000-000000000501" as CategoryId;

      // Create valid category for user
      await categoryRepo.addCategory({
        id: categoryId,
        userId: USER_ID,
        name: "Groceries",
        parentId: null,
        categoryGroupId: "00000000-0000-4000-8000-000000000601" as never,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await useCase.execute({
        userId: USER_ID,
        id: "00000000-0000-4000-8000-000000000301" as TransactionId,
        transactionDate: "2024-01-01",
        type: "expense",
        note: null,
        lines: [
          {
            id: "00000000-0000-4000-8000-000000000401",
            targetType: "account",
            accountId: validAccountId,
            categoryId: null,
            envelopeId: null,
            amountCents: -1000,
            type: "expense",
          },
          {
            id: "00000000-0000-4000-8000-000000000402",
            targetType: "category",
            accountId: null,
            categoryId: categoryId,
            envelopeId: null,
            amountCents: 1000,
            type: "expense",
          },
        ],
      });

      expect(result.id).toBe("00000000-0000-4000-8000-000000000301");
      expect(result.lines).toHaveLength(2);
    });
  });
});
