import { describe, it, expect, beforeEach } from "vitest";
import { CreateTransactionUseCase } from "./create-transaction.use-case";
import type {
  TransactionRepository,
  CategoryRepository,
  AccountRepository,
  EnvelopeRepository,
  UserId,
  TransactionId,
  AccountId,
  CategoryId,
  EnvelopeId,
} from "@ledger-mx/domain";
import type { Transaction, Account, Category, Envelope } from "@ledger-mx/domain";
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

class FakeEnvelopeRepository implements EnvelopeRepository {
  private envelopes: Map<string, Envelope> = new Map();

  async save(envelope: Envelope): Promise<void> {
    this.envelopes.set(`${envelope.userId}:${envelope.id}`, envelope);
  }

  async findById(userId: UserId, id: EnvelopeId): Promise<Envelope | null> {
    return this.envelopes.get(`${userId}:${id}`) ?? null;
  }

  async listByUserId(userId: UserId): Promise<Envelope[]> {
    return Array.from(this.envelopes.values()).filter(
      (e) => e.userId === userId && !e.deletedAt,
    );
  }

  async archive(userId: UserId, id: EnvelopeId, deletedAt: Date): Promise<void> {
    const key = `${userId}:${id}`;
    const envelope = this.envelopes.get(key);
    if (envelope) {
      (envelope as { deletedAt: Date | null }).deletedAt = deletedAt;
    }
  }

  async getBalance(userId: UserId, id: EnvelopeId): Promise<number> {
    // Simplified: return 0 or a fixed balance for testing
    return 0;
  }

  async getBalances(userId: UserId, ids: EnvelopeId[]): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    for (const id of ids) {
      result.set(id as string, 0);
    }
    return result;
  }

  async findDefaultEnvelopes(userId: UserId): Promise<Envelope[]> {
    return [];
  }

  setEnvelopeBalance(userId: UserId, id: EnvelopeId, balance: number): void {
    // This is a helper for tests - in reality, balance is derived from transactions
    // For unit tests, we'll override getBalance behavior
  }

  reset() {
    this.envelopes.clear();
  }

  async addEnvelope(envelope: Envelope): Promise<void> {
    await this.save(envelope);
  }
}

describe("CreateTransactionUseCase", () => {
  let useCase: CreateTransactionUseCase;
  let transactionRepo: FakeTransactionRepository;
  let accountRepo: FakeAccountRepository;
  let categoryRepo: FakeCategoryRepository;
  let envelopeRepo: FakeEnvelopeRepository;
  const USER_ID = "00000000-0000-4000-8000-000000000101" as UserId;
  const OTHER_USER_ID = "00000000-0000-4000-8000-000000000999" as UserId;

  beforeEach(() => {
    transactionRepo = new FakeTransactionRepository();
    accountRepo = new FakeAccountRepository();
    categoryRepo = new FakeCategoryRepository();
    envelopeRepo = new FakeEnvelopeRepository();
    useCase = new CreateTransactionUseCase(
      transactionRepo,
      categoryRepo,
      accountRepo,
      envelopeRepo,
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

  describe("envelope target validation", () => {
    let validEnvelopeId: EnvelopeId;
    let otherUserEnvelopeId: EnvelopeId;

    beforeEach(async () => {
      validEnvelopeId = "00000000-0000-4000-8000-000000000601" as EnvelopeId;
      otherUserEnvelopeId = "00000000-0000-4000-8000-000000000602" as EnvelopeId;

      // Create valid envelope for USER_ID
      await envelopeRepo.addEnvelope({
        id: validEnvelopeId,
        userId: USER_ID,
        name: "Groceries",
        targetAmountCents: null,
        isProtected: true,
        sortOrder: 0,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        deletedAt: undefined,
      } as Envelope);

      // Create envelope for OTHER_USER_ID
      await envelopeRepo.addEnvelope({
        id: otherUserEnvelopeId,
        userId: OTHER_USER_ID,
        name: "Other Envelope",
        targetAmountCents: null,
        isProtected: true,
        sortOrder: 0,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        deletedAt: undefined,
      } as Envelope);
    });

    it("should throw TransactionTargetNotFoundError for non-existent envelope", async () => {
      const envelopeId = "00000000-0000-4000-8000-000000000999" as EnvelopeId;

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
              targetType: "envelope",
              accountId: null,
              categoryId: null,
              envelopeId: envelopeId as string,
              amountCents: -5000,
              type: "expense",
            },
            {
              id: "00000000-0000-4000-8000-000000000402",
              targetType: "account",
              accountId: "00000000-0000-4000-8000-000000000201",
              categoryId: null,
              envelopeId: null,
              amountCents: 5000,
              type: "expense",
            },
          ],
        }),
      ).rejects.toThrow(TransactionTargetNotFoundError);
    });

    it("should throw TransactionTargetNotFoundError for envelope belonging to another user", async () => {
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
              targetType: "envelope",
              accountId: null,
              categoryId: null,
              envelopeId: otherUserEnvelopeId as string,
              amountCents: -5000,
              type: "expense",
            },
            {
              id: "00000000-0000-4000-8000-000000000402",
              targetType: "account",
              accountId: "00000000-0000-4000-8000-000000000201",
              categoryId: null,
              envelopeId: null,
              amountCents: 5000,
              type: "expense",
            },
          ],
        }),
      ).rejects.toThrow(TransactionTargetNotFoundError);
    });
  });

  describe("protected envelope overspend protection", () => {
    let protectedEnvelopeId: EnvelopeId;

    beforeEach(async () => {
      protectedEnvelopeId = "00000000-0000-4000-8000-000000000601" as EnvelopeId;

      // Create protected envelope with 10000 cents balance
      await envelopeRepo.addEnvelope({
        id: protectedEnvelopeId,
        userId: USER_ID,
        name: "Protected Envelope",
        targetAmountCents: null,
        isProtected: true,
        sortOrder: 0,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        deletedAt: undefined,
      } as Envelope);

      // Override getBalance to return 10000
      envelopeRepo.getBalance = async () => 10000;

      // Create account for the tests
      await accountRepo.addAccount({
        id: "00000000-0000-4000-8000-000000000201" as unknown as AccountId,
        userId: USER_ID,
        name: "Test Checking",
        type: "debit",
        currencyCode: "MXN",
        status: "active",
        ownership: "user",
        systemRole: null,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        deletedAt: undefined,
      } as unknown as Account);
    });

    it("should reject overspend on protected envelope", async () => {
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
              targetType: "envelope",
              accountId: null,
              categoryId: null,
              envelopeId: protectedEnvelopeId as string,
              amountCents: -15000, // Try to spend 150.00 when balance is 100.00
              type: "expense",
            },
            {
              id: "00000000-0000-4000-8000-000000000402",
              targetType: "account",
              accountId: "00000000-0000-4000-8000-000000000201",
              categoryId: null,
              envelopeId: null,
              amountCents: 15000,
              type: "expense",
            },
          ],
        }),
      ).rejects.toThrow("Cannot overspend protected envelope");
    });

    it("should allow spending within balance on protected envelope", async () => {
      const result = await useCase.execute({
        userId: USER_ID,
        id: "00000000-0000-4000-8000-000000000301" as TransactionId,
        transactionDate: "2024-01-01",
        type: "expense",
        note: null,
        lines: [
          {
            id: "00000000-0000-4000-8000-000000000401",
            targetType: "envelope",
            accountId: null,
            categoryId: null,
            envelopeId: protectedEnvelopeId as string,
            amountCents: -5000, // Spend 50.00 when balance is 100.00
            type: "expense",
          },
          {
            id: "00000000-0000-4000-8000-000000000402",
            targetType: "account",
            accountId: "00000000-0000-4000-8000-000000000201",
            categoryId: null,
            envelopeId: null,
            amountCents: 5000,
            type: "expense",
          },
        ],
      });

      expect(result.id).toBe("00000000-0000-4000-8000-000000000301");
    });

    it("should allow overspend on non-protected envelope", async () => {
      // Create non-protected envelope
      const nonProtectedId = "00000000-0000-4000-8000-000000000603" as EnvelopeId;
      await envelopeRepo.addEnvelope({
        id: nonProtectedId,
        userId: USER_ID,
        name: "Non-Protected Envelope",
        targetAmountCents: null,
        isProtected: false,
        sortOrder: 1,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        deletedAt: undefined,
      } as Envelope);

      envelopeRepo.getBalance = async () => 10000;

      const result = await useCase.execute({
        userId: USER_ID,
        id: "00000000-0000-4000-8000-000000000301" as TransactionId,
        transactionDate: "2024-01-01",
        type: "expense",
        note: null,
        lines: [
          {
            id: "00000000-0000-4000-8000-000000000401",
            targetType: "envelope",
            accountId: null,
            categoryId: null,
            envelopeId: nonProtectedId as string,
            amountCents: -15000, // Overspend allowed
            type: "expense",
          },
          {
            id: "00000000-0000-4000-8000-000000000402",
            targetType: "account",
            accountId: "00000000-0000-4000-8000-000000000201",
            categoryId: null,
            envelopeId: null,
            amountCents: 15000,
            type: "expense",
          },
        ],
      });

      expect(result.id).toBe("00000000-0000-4000-8000-000000000301");
    });
  });
});
