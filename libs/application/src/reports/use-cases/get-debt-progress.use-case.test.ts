import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetDebtProgressUseCase } from "./get-debt-progress.use-case";
import type {
  TransactionRepository,
  AccountRepository,
  Account,
} from "@ledger-mx/domain";
import { TransactionBuilder } from "@ledger-mx/domain";
import {
  userIdFromString,
  transactionIdFromString,
  transactionLineIdFromString,
  accountIdFromString,
  categoryIdFromString,
} from "@ledger-mx/domain";

describe("GetDebtProgressUseCase", () => {
  let mockTransactionRepo: TransactionRepository;
  let mockAccountRepo: AccountRepository;
  let useCase: GetDebtProgressUseCase;
  let userId: ReturnType<typeof userIdFromString>;

  beforeEach(() => {
    userId = userIdFromString("550e8400-e29b-41d4-a716-446655440000");

    mockTransactionRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      listByUserId: vi.fn(),
      findByEnvelopeId: vi.fn(),
      findReversalByOriginalId: vi.fn(),
      findByUserIdAndDateRange: vi.fn(),
    };

    mockAccountRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      listByUserId: vi.fn(),
      archive: vi.fn(),
      findSystemAccounts: vi.fn(),
      findBySystemRole: vi.fn(),
    };

    useCase = new GetDebtProgressUseCase(mockTransactionRepo, mockAccountRepo);
  });

  it("should calculate debt progress correctly", async () => {
    const creditAccountId = "550e8400-e29b-41d4-a716-446655440011";
    const loanAccountId = "550e8400-e29b-41d4-a716-446655440012";

    // Mock liability accounts
    mockAccountRepo.listByUserId = vi.fn().mockResolvedValue([
      {
        id: accountIdFromString(creditAccountId),
        userId,
        name: "Credit Card",
        type: "credit",
        status: "active",
        currencyCode: "USD",
        createdAt: new Date(),
        updatedAt: new Date(),
        ownership: "user",
        systemRole: null,
      },
      {
        id: accountIdFromString(loanAccountId),
        userId,
        name: "Car Loan",
        type: "loan",
        status: "active",
        currencyCode: "USD",
        createdAt: new Date(),
        updatedAt: new Date(),
        ownership: "user",
        systemRole: null,
      },
    ] as Account[]);

    // Create transactions that result in negative balances (debt)
    // Credit card: account -5000 (debt)
    const transaction1 = new TransactionBuilder()
      .withId(transactionIdFromString("550e8400-e29b-41d4-a716-446655440031"))
      .withUserId(userId)
      .withType("expense")
      .withOccurredAt(new Date("2024-01-15"))
      .withTransactionLine((builder) =>
        builder
          .withId(
            transactionLineIdFromString("550e8400-e29b-41d4-a716-446655440041"),
          )
          .withAccountTarget(accountIdFromString(creditAccountId))
          .withAmountCents(-5000),
      )
      .withTransactionLine((builder) =>
        builder
          .withId(
            transactionLineIdFromString("550e8400-e29b-41d4-a716-446655440051"),
          )
          .withCategoryTarget(
            categoryIdFromString("550e8400-e29b-41d4-a716-446655440061"),
          )
          .withAmountCents(5000),
      )
      .build();

    // Loan: account -10000 (debt)
    const transaction2 = new TransactionBuilder()
      .withId(transactionIdFromString("550e8400-e29b-41d4-a716-446655440071"))
      .withUserId(userId)
      .withType("expense")
      .withOccurredAt(new Date("2024-01-16"))
      .withTransactionLine((builder) =>
        builder
          .withId(
            transactionLineIdFromString("550e8400-e29b-41d4-a716-446655440081"),
          )
          .withAccountTarget(accountIdFromString(loanAccountId))
          .withAmountCents(-10000),
      )
      .withTransactionLine((builder) =>
        builder
          .withId(
            transactionLineIdFromString("550e8400-e29b-41d4-a716-446655440091"),
          )
          .withCategoryTarget(
            categoryIdFromString("550e8400-e29b-41d4-a716-446655440061"),
          )
          .withAmountCents(10000),
      )
      .build();

    mockTransactionRepo.findByUserIdAndDateRange = vi
      .fn()
      .mockResolvedValue([transaction1, transaction2]);

    const result = await useCase.execute({ userId });

    // totalDebt = 5000 + 10000 = 15000
    expect(result.totalDebt).toBe(15000);
    expect(result.paidDebt).toBe(0); // Placeholder
    expect(result.remainingDebt).toBe(15000);
    expect(result.progressPercentage).toBe(0); // Placeholder
    expect(result.interest).toBe(0); // Placeholder
    expect(result.payoffDate).toBeNull(); // Placeholder

    // Check liability accounts
    expect(result.liabilityAccounts).toHaveLength(2);
    expect(result.liabilityAccounts[0].accountId).toBe(creditAccountId);
    expect(result.liabilityAccounts[0].currentBalance).toBe(-5000);
    expect(result.liabilityAccounts[1].accountId).toBe(loanAccountId);
    expect(result.liabilityAccounts[1].currentBalance).toBe(-10000);
  });

  it("should handle no liability accounts", async () => {
    mockAccountRepo.listByUserId = vi.fn().mockResolvedValue([]);
    mockTransactionRepo.findByUserIdAndDateRange = vi
      .fn()
      .mockResolvedValue([]);

    const result = await useCase.execute({ userId });

    expect(result.totalDebt).toBe(0);
    expect(result.remainingDebt).toBe(0);
    expect(result.liabilityAccounts).toHaveLength(0);
  });

  it("should only include liability accounts", async () => {
    const checkingAccountId = "550e8400-e29b-41d4-a716-446655440011";
    const creditAccountId = "550e8400-e29b-41d4-a716-446655440012";

    // Mock accounts - one checking (non-liability) and one credit (liability)
    mockAccountRepo.listByUserId = vi.fn().mockResolvedValue([
      {
        id: accountIdFromString(checkingAccountId),
        userId,
        name: "Checking",
        type: "debit",
        status: "active",
        currencyCode: "USD",
        createdAt: new Date(),
        updatedAt: new Date(),
        ownership: "user",
        systemRole: null,
      },
      {
        id: accountIdFromString(creditAccountId),
        userId,
        name: "Credit Card",
        type: "credit",
        status: "active",
        currencyCode: "USD",
        createdAt: new Date(),
        updatedAt: new Date(),
        ownership: "user",
        systemRole: null,
      },
    ] as Account[]);

    mockTransactionRepo.findByUserIdAndDateRange = vi
      .fn()
      .mockResolvedValue([]);

    const result = await useCase.execute({ userId });

    // Only liability accounts should be included
    expect(result.liabilityAccounts).toHaveLength(1);
    expect(result.liabilityAccounts[0].accountId).toBe(creditAccountId);
  });
});
