import { describe, it, expect, beforeEach } from "vitest";
import { FundEnvelopeUseCase } from "./fund-envelope.use-case";
import type { EnvelopeRepository, AccountRepository, TransactionRepository, BalanceRepository, Envelope, Account, Transaction, UserId, EnvelopeId, AccountId, TransactionId } from "@ledger-mx/domain";
import type { IdGenerator, Clock } from "@ledger-mx/application";
import { InsufficientAccountBalanceError } from "../envelope.errors";
import { TransactionBuilder } from "@ledger-mx/domain";
import { envelopeIdFromString, userIdFromString, accountIdFromString } from "@ledger-mx/domain";

// In-memory fake repositories
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
    return 0;
  }

  async getBalances(userId: UserId, ids: EnvelopeId[]): Promise<Map<string, number>> {
    return new Map();
  }

  async findDefaultEnvelopes(userId: UserId): Promise<Envelope[]> {
    return [];
  }

  reset() {
    this.envelopes.clear();
  }
}

class FakeAccountRepository implements AccountRepository {
  private accounts: Map<string, Account> = new Map();

  async save(account: Account): Promise<void> {
    this.accounts.set(`${account.userId}:${account.id}`, account);
  }

  async findById(userId: UserId, id: AccountId): Promise<Account | null> {
    return this.accounts.get(`${userId}:${id}`) ?? null;
  }

  async listByUserId(userId: UserId): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(
      (a) => a.userId === userId && !a.deletedAt,
    );
  }

  async archive(userId: UserId, id: AccountId, deletedAt: Date): Promise<void> {
    const key = `${userId}:${id}`;
    const account = this.accounts.get(key);
    if (account) {
      (account as { deletedAt: Date | null }).deletedAt = deletedAt;
    }
  }

  async findSystemAccounts(userId: UserId): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(
      (a) => a.userId === userId && a.systemRole !== null && !a.deletedAt,
    );
  }

  async findBySystemRole(userId: UserId, role: "expense" | "income" | "salary"): Promise<Account | null> {
    return Array.from(this.accounts.values()).find(
      (a) => a.userId === userId && a.systemRole === role && !a.deletedAt,
    ) ?? null;
  }

  reset() {
    this.accounts.clear();
  }
}

class FakeTransactionRepository implements TransactionRepository {
  private transactions: Map<string, Transaction> = new Map();

  async save(transaction: Transaction): Promise<void> {
    this.transactions.set(`${transaction.userId}:${transaction.id}`, transaction);
  }

  async findById(userId: UserId, id: TransactionId): Promise<Transaction | null> {
    return this.transactions.get(`${userId}:${id}`) ?? null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async listByUserId(userId: UserId, filters?: { startDate?: Date; endDate?: Date; type?: string }): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (t) => t.userId === userId,
    );
  }

  async listLinesByEnvelopeId(userId: UserId, envelopeId: EnvelopeId): Promise<import("@ledger-mx/domain").TransactionLine[]> {
    const lines: import("@ledger-mx/domain").TransactionLine[] = [];
    for (const transaction of this.transactions.values()) {
      if (transaction.userId === userId) {
        for (const line of transaction.lines) {
          if (line.targetType === "envelope" && line.targetId === envelopeId) {
            lines.push(line);
          }
        }
      }
    }
    return lines;
  }

  async findReversalByOriginalId(userId: UserId, originalId: TransactionId): Promise<Transaction | null> {
    return null; // Simplified for unit test
  }

  reset() {
    this.transactions.clear();
  }
}

class FakeBalanceRepository implements BalanceRepository {
  private accountBalances: Map<string, number> = new Map();

  async getAccountBalance(userId: UserId, accountId: AccountId): Promise<{ accountId: AccountId; balanceCents: number } | null> {
    const key = `${userId}:${accountId}`;
    const balance = this.accountBalances.get(key);
    if (balance === undefined) {
      return null;
    }
    return { accountId, balanceCents: balance };
  }

  async getAccountBalances(userId: UserId, accountIds?: AccountId[]): Promise<Array<{ accountId: AccountId; balanceCents: number }>> {
    const results: Array<{ accountId: AccountId; balanceCents: number }> = [];
    for (const [key, balance] of this.accountBalances.entries()) {
      const [uid, aid] = key.split(":");
      if (uid === userId) {
        if (!accountIds || accountIds.some((id) => id === aid)) {
          results.push({ accountId: aid as AccountId, balanceCents: balance });
        }
      }
    }
    return results;
  }

  async getBalancesByAccountType(userId: UserId): Promise<Array<{ accountType: import("@ledger-mx/domain").AccountType; balanceCents: number; accountCount: number }>> {
    return [];
  }

  async getLiabilityBalances(userId: UserId): Promise<Array<{ accountId: AccountId; accountName: string; accountType: import("@ledger-mx/domain").AccountType; balanceCents: number }>> {
    return [];
  }

  setAccountBalance(userId: UserId, accountId: AccountId, balanceCents: number): void {
    this.accountBalances.set(`${userId}:${accountId}`, balanceCents);
  }

  reset() {
    this.accountBalances.clear();
  }
}

class FakeIdGenerator implements IdGenerator {
  private count = 0;

  uuid(): string {
    return `test-id-${++this.count}`;
  }
}

class FakeClock implements Clock {
  private fixedNow = new Date("2024-01-15T00:00:00.000Z");

  now(): Date {
    return this.fixedNow;
  }

  setNow(date: Date): void {
    this.fixedNow = date;
  }
}

describe("FundEnvelopeUseCase", () => {
  let envelopeRepository: FakeEnvelopeRepository;
  let accountRepository: FakeAccountRepository;
  let transactionRepository: FakeTransactionRepository;
  let balanceRepository: FakeBalanceRepository;
  let idGenerator: FakeIdGenerator;
  let clock: FakeClock;
  let useCase: FundEnvelopeUseCase;

  beforeEach(() => {
    envelopeRepository = new FakeEnvelopeRepository();
    accountRepository = new FakeAccountRepository();
    transactionRepository = new FakeTransactionRepository();
    balanceRepository = new FakeBalanceRepository();
    idGenerator = new FakeIdGenerator();
    clock = new FakeClock();
    useCase = new FundEnvelopeUseCase(
      envelopeRepository,
      accountRepository,
      transactionRepository,
      balanceRepository,
      idGenerator,
      clock,
    );
  });

  it("creates a double-entry envelope_allocation transaction", async () => {
    const userId = userIdFromString("9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a");
    const envelopeId = envelopeIdFromString("323e4567-e89b-42d3-a456-426614174002");
    const accountId = accountIdFromString("123e4567-e89b-42d3-a456-426614174000");

    // Create envelope and account
    const envelope = new (await import("@ledger-mx/domain")).EnvelopeBuilder()
      .withId(envelopeId)
      .withUserId(userId)
      .withName("Groceries")
      .withTargetAmountCents(null)
      .withIsProtected(true)
      .withSortOrder(0)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withDeletedAt(null)
      .build();
    await envelopeRepository.save(envelope);

    const account = new (await import("@ledger-mx/domain")).AccountBuilder()
      .withId(accountId)
      .withUserId(userId)
      .withName("Checking")
      .withType("debit")
      .withCurrencyCode("MXN")
      .withStatus("active")
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user")
      .withSystemRole(null)
      .build();
    await accountRepository.save(account);

    // Set account balance
    balanceRepository.setAccountBalance(userId, accountId, 100000);

    const result = await useCase.execute({
      userId,
      envelopeId: envelopeId as string,
      accountId: accountId as string,
      amountCents: 50000,
    });

    expect(result.name).toBe("Groceries");

    // Verify transaction was created
    const transactions = await transactionRepository.listByUserId(userId);
    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toBe("envelope_allocation");
    expect(transactions[0].lines).toHaveLength(2);

    // Verify double-entry: one line negative (from account), one positive (to envelope)
    const negativeLine = transactions[0].lines.find((l) => l.amountCents < 0);
    const positiveLine = transactions[0].lines.find((l) => l.amountCents > 0);
    expect(negativeLine).toBeDefined();
    expect(positiveLine).toBeDefined();
    expect(negativeLine?.amountCents).toBe(-50000);
    expect(positiveLine?.amountCents).toBe(50000);
  });

  it("rejects when account has insufficient balance", async () => {
    const userId = userIdFromString("9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a");
    const envelopeId = envelopeIdFromString("323e4567-e89b-42d3-a456-426614174002");
    const accountId = accountIdFromString("123e4567-e89b-42d3-a456-426614174000");

    // Create envelope and account
    const envelope = new (await import("@ledger-mx/domain")).EnvelopeBuilder()
      .withId(envelopeId)
      .withUserId(userId)
      .withName("Groceries")
      .withTargetAmountCents(null)
      .withIsProtected(true)
      .withSortOrder(0)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withDeletedAt(null)
      .build();
    await envelopeRepository.save(envelope);

    const account = new (await import("@ledger-mx/domain")).AccountBuilder()
      .withId(accountId)
      .withUserId(userId)
      .withName("Checking")
      .withType("debit")
      .withCurrencyCode("MXN")
      .withStatus("active")
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user")
      .withSystemRole(null)
      .build();
    await accountRepository.save(account);

    // Set insufficient account balance
    balanceRepository.setAccountBalance(userId, accountId, 10000); // Only 100.00

    await expect(
      useCase.execute({
        userId,
        envelopeId: envelopeId as string,
        accountId: accountId as string,
        amountCents: 50000, // Trying to fund 500.00
      }),
    ).rejects.toThrow(InsufficientAccountBalanceError);
  });

  it("rejects when envelope does not exist", async () => {
    const userId = userIdFromString("9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a");
    const envelopeId = envelopeIdFromString("323e4567-e89b-42d3-a456-426614174002");
    const accountId = accountIdFromString("123e4567-e89b-42d3-a456-426614174000");

    // Create account but NOT envelope
    const account = new (await import("@ledger-mx/domain")).AccountBuilder()
      .withId(accountId)
      .withUserId(userId)
      .withName("Checking")
      .withType("debit")
      .withCurrencyCode("MXN")
      .withStatus("active")
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user")
      .withSystemRole(null)
      .build();
    await accountRepository.save(account);

    balanceRepository.setAccountBalance(userId, accountId, 100000);

    await expect(
      useCase.execute({
        userId,
        envelopeId: envelopeId as string,
        accountId: accountId as string,
        amountCents: 50000,
      }),
    ).rejects.toThrow("Envelope not found");
  });
});
