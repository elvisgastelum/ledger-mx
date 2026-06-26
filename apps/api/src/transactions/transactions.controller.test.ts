import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TransactionsModule } from "./transactions.module";
import { TRANSACTIONS_TOKENS } from "./transactions.tokens";
import type { TransactionRepository } from "@ledger-mx/domain";
import {
  Transaction,
  TransactionLine,
  transactionIdFromString,
  userIdFromString,
  transactionLineIdFromString,
  accountIdFromString,
} from "@ledger-mx/domain";

// Environment setup using vi.stubEnv for proper test isolation
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv(
    "JWT_SECRET",
    "test-jwt-secret-for-transactions-tests-minimum-32-chars",
  );
  vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// Mock user (domain typed objects for repository/domain use)
const validUserId = userIdFromString("550e8400-e29b-41d4-a716-446655440000");
const validTransactionId = transactionIdFromString(
  "660e8400-e29b-41d4-a716-446655440000",
);
const otherTransactionId = transactionIdFromString(
  "880e8400-e29b-41d4-a716-446655440002",
);
const validAccountId = accountIdFromString(
  "990e8400-e29b-41d4-a716-446655440003",
);
const validLineId1 = transactionLineIdFromString(
  "a60e8400-e29b-41d4-a716-446655440004",
);
const validLineId2 = transactionLineIdFromString(
  "b60e8400-e29b-41d4-a716-446655440005",
);
const reversalLineId1 = transactionLineIdFromString(
  "c60e8400-e29b-41d4-a716-446655440006",
);
const reversalLineId2 = transactionLineIdFromString(
  "d60e8400-e29b-41d4-a716-446655440007",
);

// Plain UUID strings for HTTP request DTOs (ts-rest/Zod validation expects plain strings)
const validTransactionIdString = "660e8400-e29b-41d4-a716-446655440000";
const otherTransactionIdString = "880e8400-e29b-41d4-a716-446655440002";
const validAccountIdString = "990e8400-e29b-41d4-a716-446655440003";
const validLineId1String = "a60e8400-e29b-41d4-a716-446655440004";
const validLineId2String = "b60e8400-e29b-41d4-a716-446655440005";
const reversalLineId1String = "c60e8400-e29b-41d4-a716-446655440006";
const reversalLineId2String = "d60e8400-e29b-41d4-a716-446655440007";
const mockCategoryId = "220e8400-e29b-41d4-a716-446655440001"; // Valid UUID for category target
const mockReversalTransactionIdString = "e60e8400-e29b-41d4-a716-446655440008";
const mockReversalTransactionId = transactionIdFromString(
  mockReversalTransactionIdString,
);
const mockTransaction = new Transaction({
  id: validTransactionId,
  userId: validUserId,
  type: "expense",
  occurredAt: new Date("2024-01-01"),
  description: "Groceries",
  lines: [
    new TransactionLine({
      id: validLineId1,
      transactionId: validTransactionId,
      targetType: "account",
      targetId: validAccountId,
      amountCents: -1000, // User spent 1000 cents
    }),
    new TransactionLine({
      id: validLineId2,
      transactionId: validTransactionId,
      targetType: "category",
      targetId: mockCategoryId,
      amountCents: 1000, // Offset line
    }),
  ],
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
});

// Mock reversal transaction
const mockReversalTransaction = new Transaction({
  id: mockReversalTransactionId,
  userId: validUserId,
  type: "reversal",
  occurredAt: new Date("2024-01-02"),
  description: `Reversal of transaction ${validTransactionId}`,
  lines: [
    new TransactionLine({
      id: reversalLineId1,
      transactionId: mockReversalTransactionId,
      targetType: "account",
      targetId: validAccountId,
      amountCents: 1000, // Negated original amount
    }),
    new TransactionLine({
      id: reversalLineId2,
      transactionId: mockReversalTransactionId,
      targetType: "category",
      targetId: mockCategoryId,
      amountCents: -1000, // Negated original amount
    }),
  ],
  createdAt: new Date("2024-01-02"),
  updatedAt: new Date("2024-01-02"),
  reversalOfTransactionId: validTransactionId,
});

// Mock repository
const mockTransactionRepository = {
  save: vi.fn(),
  findById: vi.fn(),
  listByUserId: vi.fn(),
  findReversalByOriginalId: vi.fn(),
};

// Mock guard that attaches user to request
const mockJwtAuthGuard = {
  canActivate: vi.fn().mockImplementation((context) => {
    const request = context.switchToHttp().getRequest();
    request.user = { sub: validUserId, email: "test@example.com" };
    return true;
  }),
};

describe("TransactionsController", () => {
  let app: INestApplication;
  let repository: TransactionRepository;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TransactionsModule.forRoot({
          transactionRepository: {
            provide: TRANSACTIONS_TOKENS.TRANSACTION_REPOSITORY,
            useValue: mockTransactionRepository,
          },
        }),
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = module.createNestApplication();
    await app.init();

    repository = module.get<TransactionRepository>(
      TRANSACTIONS_TOKENS.TRANSACTION_REPOSITORY,
    );
  });

  afterEach(async () => {
    await app.close();
  });

  describe("GET /api/v1/transactions", () => {
    it("should return only current-user transactions and call list with authenticated user id", async () => {
      vi.spyOn(repository, "listByUserId").mockResolvedValue([mockTransaction]);

      const response = await request(app.getHttpServer())
        .get("/api/v1/transactions")
        .expect(200);

      expect(response.body.transactions).toHaveLength(1);
      expect(response.body.transactions[0].id).toBe(validTransactionId);
      expect(response.body.transactions[0].totalAmountCents).toBe(1000);
      expect(repository.listByUserId).toHaveBeenCalledWith(validUserId);
    });

    it("should return empty array when user has no transactions", async () => {
      vi.spyOn(repository, "listByUserId").mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get("/api/v1/transactions")
        .expect(200);

      expect(response.body).toEqual({ transactions: [] });
    });
  });

  describe("POST /api/v1/transactions", () => {
    const validCreateDto = {
      id: validTransactionIdString,
      transactionDate: "2024-01-01T00:00:00.000Z",
      type: "expense",
      note: "Groceries",
      lines: [
        {
          id: validLineId1String,
          targetType: "account" as const,
          accountId: validAccountIdString,
          categoryId: null,
          envelopeId: null,
          amountCents: -1000,
          type: "expense",
        },
        {
          id: validLineId2String,
          targetType: "category" as const,
          accountId: null,
          categoryId: mockCategoryId,
          envelopeId: null,
          amountCents: 1000,
          type: "expense",
        },
      ],
    };

    it("should create a balanced transaction with integer-cent lines and return created data", async () => {
      vi.spyOn(repository, "save").mockResolvedValue(undefined);
      vi.spyOn(repository, "findById").mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post("/api/v1/transactions")
        .send(validCreateDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: validTransactionId,
        type: "expense",
        totalAmountCents: 1000,
        note: "Groceries",
      });
      expect(response.body.lines).toHaveLength(2);
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it("should reject unbalanced lines with 4xx response", async () => {
      const unbalancedDto = {
        ...validCreateDto,
        lines: [
          {
            id: validLineId1String,
            targetType: "account" as const,
            accountId: validAccountIdString,
            categoryId: null,
            envelopeId: null,
            amountCents: -1000,
            type: "expense",
          },
          {
            id: validLineId2String,
            targetType: "category" as const,
            accountId: null,
            categoryId: mockCategoryId,
            envelopeId: null,
            amountCents: 500, // Sum: -1000 + 500 = -500 ≠ 0
            type: "expense",
          },
        ],
      };

      await request(app.getHttpServer())
        .post("/api/v1/transactions")
        .send(unbalancedDto)
        .expect(400);
    });

    it("should reject invalid money (non-integer cents) with 4xx response", async () => {
      const invalidMoneyDto = {
        ...validCreateDto,
        lines: [
          {
            id: validLineId1String,
            targetType: "account" as const,
            accountId: validAccountIdString,
            categoryId: null,
            envelopeId: null,
            amountCents: -10.5, // Non-integer cents
            type: "expense",
          },
          {
            id: validLineId2String,
            targetType: "category" as const,
            accountId: null,
            categoryId: mockCategoryId,
            envelopeId: null,
            amountCents: 10.5,
            type: "expense",
          },
        ],
      };

      await request(app.getHttpServer())
        .post("/api/v1/transactions")
        .send(invalidMoneyDto)
        .expect(400);
    });
  });

  describe("POST /api/v1/transactions/:id/reverse", () => {
    it("should create a reversal with negated line amounts and current user id", async () => {
      vi.spyOn(repository, "findById")
        .mockResolvedValueOnce(mockTransaction) // Original transaction
        .mockResolvedValueOnce(null); // No existing reversal
      vi.spyOn(repository, "findReversalByOriginalId").mockResolvedValue(null);
      vi.spyOn(repository, "save").mockResolvedValue(undefined);

      const reversalDto = {
        id: mockReversalTransactionIdString,
        lineIds: [reversalLineId1String, reversalLineId2String],
        transactionDate: "2024-01-02T00:00:00.000Z",
        note: `Reversal of transaction ${validTransactionIdString}`,
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/transactions/${validTransactionIdString}/reverse`)
        .send(reversalDto)
        .expect(201);

      expect(response.body.type).toBe("reversal");
      expect(response.body.reversalOfTransactionId).toBe(
        validTransactionIdString,
      );
      expect(response.body.lines[0].amountCents).toBe(1000); // Negated original -1000
      expect(response.body.lines[1].amountCents).toBe(-1000); // Negated original 1000
    });

    it("should return 404 when reversing a transaction belonging to another user", async () => {
      // Mock repository to return null (transaction not found for current user)
      vi.spyOn(repository, "findById").mockResolvedValue(null);

      const reversalDto = {
        id: mockReversalTransactionIdString,
        lineIds: [reversalLineId1String, reversalLineId2String],
        transactionDate: "2024-01-02T00:00:00.000Z",
      };

      await request(app.getHttpServer())
        .post(`/api/v1/transactions/${otherTransactionIdString}/reverse`)
        .send(reversalDto)
        .expect(404);

      expect(repository.findById).toHaveBeenCalledWith(
        validUserId,
        otherTransactionId,
      );
    });

    it("should return 409 for duplicate reversal", async () => {
      vi.spyOn(repository, "findById").mockResolvedValue(mockTransaction);
      vi.spyOn(repository, "findReversalByOriginalId").mockResolvedValue(
        mockReversalTransaction,
      );

      const duplicateReversalIdString = "f60e8400-e29b-41d4-a716-446655440009";
      const reversalDto = {
        id: duplicateReversalIdString,
        lineIds: [reversalLineId1String, reversalLineId2String],
        transactionDate: "2024-01-03T00:00:00.000Z",
      };

      await request(app.getHttpServer())
        .post(`/api/v1/transactions/${validTransactionIdString}/reverse`)
        .send(reversalDto)
        .expect(409);
    });
  });

  describe("DELETE /api/v1/transactions/:id", () => {
    it("should not expose delete endpoint (404 for delete request)", async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/transactions/${validTransactionIdString}`)
        .expect(404);
    });
  });
});
