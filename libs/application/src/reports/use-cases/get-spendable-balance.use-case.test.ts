import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetSpendableBalanceUseCase } from "./get-spendable-balance.use-case";
import type {
  TransactionRepository,
  AccountRepository,
} from "@ledger-mx/domain";
import { TransactionBuilder } from "@ledger-mx/domain";
import {
  userIdFromString,
  transactionIdFromString,
  transactionLineIdFromString,
  accountIdFromString,
  envelopeIdFromString,
  categoryIdFromString,
} from "@ledger-mx/domain";

// Valid UUID v4 constants
const VALID_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_ACCOUNT_ID = "550e8400-e29b-41d4-a716-446655440011";
const VALID_ENVELOPE_ID = "550e8400-e29b-41d4-a716-446655440021";
const VALID_CATEGORY_ID = "550e8400-e29b-41d4-a716-446655440031";
const VALID_TRANSACTION_ID_1 = "550e8400-e29b-41d4-a716-446655440041";
const VALID_LINE_ID_1 = "550e8400-e29b-41d4-a716-446655440051";
const VALID_LINE_ID_2 = "550e8400-e29b-41d4-a716-446655440061";
const VALID_LINE_ID_3 = "550e8400-e29b-41d4-a716-446655440071";
const VALID_TRANSACTION_ID_3 = "550e8400-e29b-41d4-a716-446655440043";
const VALID_LINE_ID_4 = "550e8400-e29b-41d4-a716-446655440052";
const VALID_LINE_ID_5 = "550e8400-e29b-41d4-a716-446655440062";

describe("GetSpendableBalanceUseCase", () => {
  let mockTransactionRepo: TransactionRepository;
  let mockAccountRepo: AccountRepository;
  let useCase: GetSpendableBalanceUseCase;
  let userId: ReturnType<typeof userIdFromString>;

  beforeEach(() => {
    userId = userIdFromString(VALID_USER_ID);

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

    useCase = new GetSpendableBalanceUseCase(
      mockTransactionRepo,
      mockAccountRepo,
    );
  });

  it("should calculate spendable balance correctly", async () => {
    const accountId = VALID_ACCOUNT_ID;
    const envelopeId = VALID_ENVELOPE_ID;
    const categoryId = VALID_CATEGORY_ID;

    // Create a transaction with: account +1000, envelope -300, category -700
    const transaction = new TransactionBuilder()
      .withId(transactionIdFromString(VALID_TRANSACTION_ID_1))
      .withUserId(userId)
      .withType("expense")
      .withOccurredAt(new Date("2024-01-15"))
      .withTransactionLine((builder) =>
        builder
          .withId(transactionLineIdFromString(VALID_LINE_ID_1))
          .withAccountTarget(accountIdFromString(accountId))
          .withAmountCents(1000),
      )
      .withTransactionLine((builder) =>
        builder
          .withId(transactionLineIdFromString(VALID_LINE_ID_2))
          .withEnvelopeTarget(envelopeIdFromString(envelopeId))
          .withAmountCents(-300),
      )
      .withTransactionLine((builder) =>
        builder
          .withId(transactionLineIdFromString(VALID_LINE_ID_3))
          .withCategoryTarget(categoryIdFromString(categoryId))
          .withAmountCents(-700),
      )
      .build();

    mockTransactionRepo.findByUserIdAndDateRange = vi
      .fn()
      .mockResolvedValue([transaction]);

    const result = await useCase.execute({ userId });

    // accountBalance = 1000 (from account target line)
    // envelopeAllocations = 0 (envelope has -300, Math.max(0, -300) = 0)
    // upcomingObligations = 0 (placeholder)
    // spendableBalance = 1000 - 0 - 0 = 1000
    expect(result.accountBalance).toBe(1000);
    expect(result.envelopeAllocations).toBe(0);
    expect(result.upcomingObligations).toBe(0);
    expect(result.spendableBalance).toBe(1000);
  });

  it("should handle positive envelope balances", async () => {
    const accountId = VALID_ACCOUNT_ID;
    const envelopeId = VALID_ENVELOPE_ID;

    // Create a transaction with: account -500, envelope +500 (allocation)
    const transaction = new TransactionBuilder()
      .withId(transactionIdFromString(VALID_TRANSACTION_ID_3))
      .withUserId(userId)
      .withType("envelope_allocation")
      .withOccurredAt(new Date("2024-01-15"))
      .withTransactionLine((builder) =>
        builder
          .withId(transactionLineIdFromString(VALID_LINE_ID_4))
          .withAccountTarget(accountIdFromString(accountId))
          .withAmountCents(-500),
      )
      .withTransactionLine((builder) =>
        builder
          .withId(transactionLineIdFromString(VALID_LINE_ID_5))
          .withEnvelopeTarget(envelopeIdFromString(envelopeId))
          .withAmountCents(500),
      )
      .build();

    mockTransactionRepo.findByUserIdAndDateRange = vi
      .fn()
      .mockResolvedValue([transaction]);

    const result = await useCase.execute({ userId });

    // accountBalance = -500 (from account target line)
    // envelopeAllocations = 500 (envelope has +500, Math.max(0, 500) = 500)
    // spendableBalance = -500 - 500 - 0 = -1000
    expect(result.accountBalance).toBe(-500);
    expect(result.envelopeAllocations).toBe(500);
    expect(result.spendableBalance).toBe(-1000);
  });

  it("should use asOfDate from endDate", async () => {
    mockTransactionRepo.findByUserIdAndDateRange = vi
      .fn()
      .mockResolvedValue([]);

    const endDate = new Date("2024-06-30");
    const result = await useCase.execute({
      userId,
      endDate,
    });

    expect(result.asOfDate).toBe(endDate.toISOString());
  });

  it("should return null asOfDate when no endDate provided", async () => {
    mockTransactionRepo.findByUserIdAndDateRange = vi
      .fn()
      .mockResolvedValue([]);

    const result = await useCase.execute({ userId });

    expect(result.asOfDate).toBeNull();
  });
});
