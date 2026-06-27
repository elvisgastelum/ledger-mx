import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetExpensesByCategoryUseCase } from "./get-expenses-by-category.use-case";
import type {
  TransactionRepository,
  CategoryRepository,
  CategoryGroupRepository,
  Category,
  CategoryGroup,
} from "@ledger-mx/domain";
import { TransactionBuilder } from "@ledger-mx/domain";
import {
  userIdFromString,
  transactionIdFromString,
  transactionLineIdFromString,
  accountIdFromString,
  categoryIdFromString,
} from "@ledger-mx/domain";

// Valid UUID v4 constants
const VALID_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_CATEGORY_ID_1 = "550e8400-e29b-41d4-a716-446655440011";
const VALID_CATEGORY_ID_2 = "550e8400-e29b-41d4-a716-446655440012";
const VALID_CATEGORY_GROUP_ID = "550e8400-e29b-41d4-a716-446655440021";
const VALID_ACCOUNT_ID = "550e8400-e29b-41d4-a716-446655440031";
const VALID_TRANSACTION_ID_1 = "550e8400-e29b-41d4-a716-446655440041";
const VALID_TRANSACTION_ID_2 = "550e8400-e29b-41d4-a716-446655440071";
const VALID_LINE_ID_1 = "550e8400-e29b-41d4-a716-446655440051";
const VALID_LINE_ID_2 = "550e8400-e29b-41d4-a716-446655440061";
const VALID_LINE_ID_3 = "550e8400-e29b-41d4-a716-446655440081";
const VALID_LINE_ID_4 = "550e8400-e29b-41d4-a716-446655440091";
const VALID_CATEGORY_ID_3 = "550e8400-e29b-41d4-a716-446655440013";
const VALID_TRANSACTION_ID_3 = "550e8400-e29b-41d4-a716-446655440042";
const VALID_LINE_ID_5 = "550e8400-e29b-41d4-a716-446655440052";
const VALID_LINE_ID_6 = "550e8400-e29b-41d4-a716-446655440062";

describe("GetExpensesByCategoryUseCase", () => {
  let mockTransactionRepo: TransactionRepository;
  let mockCategoryRepo: CategoryRepository;
  let mockCategoryGroupRepo: CategoryGroupRepository;
  let useCase: GetExpensesByCategoryUseCase;
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

    mockCategoryRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      listByUserId: vi.fn(),
      listChildren: vi.fn(),
      hasTransactionLines: vi.fn(),
      countTransactionLines: vi.fn(),
      softDelete: vi.fn(),
      hasActiveChildren: vi.fn(),
    };

    mockCategoryGroupRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      listByUserId: vi.fn(),
      hasActiveCategories: vi.fn(),
      softDelete: vi.fn(),
    };

    useCase = new GetExpensesByCategoryUseCase(
      mockTransactionRepo,
      mockCategoryRepo,
      mockCategoryGroupRepo,
    );
  });

  it("should calculate expenses by category group", async () => {
    const categoryId1 = VALID_CATEGORY_ID_1;
    const categoryId2 = VALID_CATEGORY_ID_2;
    const categoryGroupId = VALID_CATEGORY_GROUP_ID;
    const accountId = VALID_ACCOUNT_ID;

    // Mock categories
    mockCategoryRepo.listByUserId = vi.fn().mockResolvedValue([
      { id: categoryId1, categoryGroupId, name: "Groceries" },
      { id: categoryId2, categoryGroupId, name: "Dining" },
    ] as Category[]);

    // Mock category group
    mockCategoryGroupRepo.listByUserId = vi
      .fn()
      .mockResolvedValue([
        { id: categoryGroupId, name: "Food" },
      ] as CategoryGroup[]);

    // Create expense transactions
    const transaction1 = new TransactionBuilder()
      .withId(transactionIdFromString(VALID_TRANSACTION_ID_1))
      .withUserId(userId)
      .withType("expense")
      .withOccurredAt(new Date("2024-01-15"))
      .withTransactionLine((builder) =>
        builder
          .withId(transactionLineIdFromString(VALID_LINE_ID_1))
          .withAccountTarget(accountIdFromString(accountId))
          .withAmountCents(500),
      )
      .withTransactionLine((builder) =>
        builder
          .withId(transactionLineIdFromString(VALID_LINE_ID_2))
          .withCategoryTarget(categoryIdFromString(categoryId1))
          .withAmountCents(-500),
      )
      .build();

    const transaction2 = new TransactionBuilder()
      .withId(transactionIdFromString(VALID_TRANSACTION_ID_2))
      .withUserId(userId)
      .withType("expense")
      .withOccurredAt(new Date("2024-01-16"))
      .withTransactionLine((builder) =>
        builder
          .withId(transactionLineIdFromString(VALID_LINE_ID_3))
          .withAccountTarget(accountIdFromString(accountId))
          .withAmountCents(300),
      )
      .withTransactionLine((builder) =>
        builder
          .withId(transactionLineIdFromString(VALID_LINE_ID_4))
          .withCategoryTarget(categoryIdFromString(categoryId2))
          .withAmountCents(-300),
      )
      .build();

    mockTransactionRepo.findByUserIdAndDateRange = vi
      .fn()
      .mockResolvedValue([transaction1, transaction2]);

    const result = await useCase.execute({ userId });

    expect(result.totalExpenses).toBe(800); // 500 + 300
    expect(result.expenses).toHaveLength(1); // Both categories in same group
    expect(result.expenses[0].categoryGroupId).toBe(categoryGroupId);
    expect(result.expenses[0].categoryGroupName).toBe("Food");
    expect(result.expenses[0].totalExpenses).toBe(800);
    expect(result.expenses[0].percentageOfTotal).toBe(100);
  });

  it("should only consider expense transactions", async () => {
    const categoryId = VALID_CATEGORY_ID_3;
    const categoryGroupId = VALID_CATEGORY_GROUP_ID;
    const accountId = VALID_ACCOUNT_ID;

    // Mock categories
    mockCategoryRepo.listByUserId = vi
      .fn()
      .mockResolvedValue([
        { id: categoryId, categoryGroupId, name: "Salary" },
      ] as Category[]);

    // Mock category group
    mockCategoryGroupRepo.listByUserId = vi
      .fn()
      .mockResolvedValue([
        { id: categoryGroupId, name: "Income" },
      ] as CategoryGroup[]);

    // Create income transaction (should not be counted)
    const transaction = new TransactionBuilder()
      .withId(transactionIdFromString(VALID_TRANSACTION_ID_3))
      .withUserId(userId)
      .withType("income")
      .withOccurredAt(new Date("2024-01-15"))
      .withTransactionLine((builder) =>
        builder
          .withId(transactionLineIdFromString(VALID_LINE_ID_5))
          .withAccountTarget(accountIdFromString(accountId))
          .withAmountCents(-1000),
      )
      .withTransactionLine((builder) =>
        builder
          .withId(transactionLineIdFromString(VALID_LINE_ID_6))
          .withCategoryTarget(categoryIdFromString(categoryId))
          .withAmountCents(1000),
      )
      .build();

    mockTransactionRepo.findByUserIdAndDateRange = vi
      .fn()
      .mockResolvedValue([transaction]);

    const result = await useCase.execute({ userId });

    expect(result.totalExpenses).toBe(0);
    expect(result.expenses).toHaveLength(0);
  });

  it("should return empty result when no expenses", async () => {
    mockCategoryRepo.listByUserId = vi.fn().mockResolvedValue([]);
    mockCategoryGroupRepo.listByUserId = vi.fn().mockResolvedValue([]);
    mockTransactionRepo.findByUserIdAndDateRange = vi
      .fn()
      .mockResolvedValue([]);

    const result = await useCase.execute({ userId });

    expect(result.totalExpenses).toBe(0);
    expect(result.expenses).toHaveLength(0);
  });
});
