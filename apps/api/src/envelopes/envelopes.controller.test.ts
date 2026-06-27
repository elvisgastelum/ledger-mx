import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { EnvelopesController } from "./envelopes.controller";
import {
  CreateEnvelopeUseCase,
  ListEnvelopesUseCase,
  GetEnvelopeUseCase,
  UpdateEnvelopeUseCase,
  ArchiveEnvelopeUseCase,
  FundEnvelopeUseCase,
  AllocateEnvelopeUseCase,
  GetEnvelopeBalanceUseCase,
  GetEnvelopeBalancesUseCase,
  GetEnvelopeTransactionsUseCase,
} from "@ledger-mx/application";
import type { Envelope } from "@ledger-mx/domain";
import {
  userIdFromString,
  envelopeIdFromString,
} from "@ledger-mx/domain";

// Environment setup using vi.stubEnv for proper test isolation
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv(
    "JWT_SECRET",
    "test-jwt-secret-for-envelopes-tests-minimum-32-chars",
  );
  vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// Mock users
const validUserId = userIdFromString("550e8400-e29b-41d4-a716-446655440000");

// Mock envelope IDs
const userEnvelope1Id = envelopeIdFromString(
  "770e8400-e29b-41d4-a716-446655440000",
);
const userEnvelope2Id = envelopeIdFromString(
  "770e8400-e29b-41d4-a716-446655440001",
);

// Mock envelope data
const userEnvelope1: Envelope = {
  id: userEnvelope1Id,
  userId: validUserId,
  name: "Groceries",
  targetAmountCents: 50000,
  isProtected: false,
  sortOrder: 0,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const userEnvelope2: Envelope = {
  id: userEnvelope2Id,
  userId: validUserId,
  name: "Emergency Fund",
  targetAmountCents: 1000000,
  isProtected: true,
  sortOrder: 1,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// Mock use cases
const mockListEnvelopesUseCase = {
  execute: vi.fn(),
};

const mockGetEnvelopeUseCase = {
  execute: vi.fn(),
};

const mockGetEnvelopeBalanceUseCase = {
  execute: vi.fn(),
};

const mockGetEnvelopeBalancesUseCase = {
  execute: vi.fn(),
};

const mockCreateEnvelopeUseCase = {
  execute: vi.fn(),
};

const mockUpdateEnvelopeUseCase = {
  execute: vi.fn(),
};

const mockArchiveEnvelopeUseCase = {
  execute: vi.fn(),
};

const mockFundEnvelopeUseCase = {
  execute: vi.fn(),
};

const mockAllocateEnvelopeUseCase = {
  execute: vi.fn(),
};

const mockGetEnvelopeTransactionsUseCase = {
  execute: vi.fn(),
};

// Mock guard that attaches user to request
const mockJwtAuthGuard = {
  canActivate: vi.fn().mockImplementation((context) => {
    const request = context.switchToHttp().getRequest();
    request.user = { sub: validUserId, email: "test@example.com" };
    return true;
  }),
};

describe("EnvelopesController", () => {
  let app: INestApplication;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnvelopesController],
      providers: [
        {
          provide: ListEnvelopesUseCase,
          useValue: mockListEnvelopesUseCase,
        },
        {
          provide: GetEnvelopeUseCase,
          useValue: mockGetEnvelopeUseCase,
        },
        {
          provide: GetEnvelopeBalanceUseCase,
          useValue: mockGetEnvelopeBalanceUseCase,
        },
        {
          provide: GetEnvelopeBalancesUseCase,
          useValue: mockGetEnvelopeBalancesUseCase,
        },
        {
          provide: CreateEnvelopeUseCase,
          useValue: mockCreateEnvelopeUseCase,
        },
        {
          provide: UpdateEnvelopeUseCase,
          useValue: mockUpdateEnvelopeUseCase,
        },
        {
          provide: ArchiveEnvelopeUseCase,
          useValue: mockArchiveEnvelopeUseCase,
        },
        {
          provide: FundEnvelopeUseCase,
          useValue: mockFundEnvelopeUseCase,
        },
        {
          provide: AllocateEnvelopeUseCase,
          useValue: mockAllocateEnvelopeUseCase,
        },
        {
          provide: GetEnvelopeTransactionsUseCase,
          useValue: mockGetEnvelopeTransactionsUseCase,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("GET /api/v1/envelopes", () => {
    it("should return list of envelopes with actual derived balances for authenticated user", async () => {
      // Mock list use case to return envelopes
      mockListEnvelopesUseCase.execute.mockResolvedValue({
        envelopes: [userEnvelope1, userEnvelope2],
      });

      // Mock batch balance use case to return balances
      const balanceMap = new Map<string, number>();
      balanceMap.set(userEnvelope1Id, 25000); // $250.00
      balanceMap.set(userEnvelope2Id, 500000); // $5000.00
      mockGetEnvelopeBalancesUseCase.execute.mockResolvedValue({
        balances: balanceMap,
      });

      const response = await request(app.getHttpServer())
        .get("/api/v1/envelopes")
        .expect(200);

      expect(response.body).toHaveProperty("envelopes");
      expect(response.body.envelopes).toHaveLength(2);

      // Verify first envelope has correct derived balance
      expect(response.body.envelopes[0]).toMatchObject({
        id: userEnvelope1Id,
        name: "Groceries",
        targetAmountCents: 50000,
        balanceCents: 25000, // Derived from transaction lines, not hardcoded 0
        isProtected: false,
      });

      // Verify second envelope has correct derived balance
      expect(response.body.envelopes[1]).toMatchObject({
        id: userEnvelope2Id,
        name: "Emergency Fund",
        targetAmountCents: 1000000,
        balanceCents: 500000, // Derived from transaction lines
        isProtected: true,
      });

      // Verify use cases were called with correct user ID
      expect(mockListEnvelopesUseCase.execute).toHaveBeenCalledWith({
        userId: validUserId,
      });
      expect(mockGetEnvelopeBalancesUseCase.execute).toHaveBeenCalledWith({
        userId: validUserId,
        envelopeIds: expect.arrayContaining([userEnvelope1Id, userEnvelope2Id]),
      });
    });

    it("should return empty array when user has no envelopes", async () => {
      mockListEnvelopesUseCase.execute.mockResolvedValue({
        envelopes: [],
      });

      mockGetEnvelopeBalancesUseCase.execute.mockResolvedValue({
        balances: new Map(),
      });

      const response = await request(app.getHttpServer())
        .get("/api/v1/envelopes")
        .expect(200);

      expect(response.body).toHaveProperty("envelopes");
      expect(response.body.envelopes).toHaveLength(0);
    });
  });

  describe("GET /api/v1/envelopes/:id", () => {
    it("should return single envelope with derived balance for authenticated user", async () => {
      // Mock get use case
      mockGetEnvelopeUseCase.execute.mockResolvedValue(userEnvelope1);

      // Mock balance use case
      mockGetEnvelopeBalanceUseCase.execute.mockResolvedValue({
        envelopeId: userEnvelope1Id,
        balanceCents: 25000,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/envelopes/${userEnvelope1Id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: userEnvelope1Id,
        name: "Groceries",
        targetAmountCents: 50000,
        balanceCents: 25000, // Actual derived balance
        isProtected: false,
      });

      // Verify use cases were called with correct user ID and envelope ID
      expect(mockGetEnvelopeUseCase.execute).toHaveBeenCalledWith({
        userId: validUserId,
        id: userEnvelope1Id,
      });
      expect(mockGetEnvelopeBalanceUseCase.execute).toHaveBeenCalledWith({
        userId: validUserId,
        envelopeId: userEnvelope1Id,
      });
    });
  });

  describe("POST /api/v1/envelopes", () => {
    it("should create envelope and return with balanceCents of 0 for new envelope", async () => {
      const newEnvelopeId = envelopeIdFromString(
        "990e8400-e29b-41d4-a716-446655440000",
      );
      mockCreateEnvelopeUseCase.execute.mockResolvedValue({
        id: newEnvelopeId,
        userId: validUserId,
        name: "New Envelope",
        targetAmountCents: 10000,
        isProtected: false,
        sortOrder: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .post("/api/v1/envelopes")
        .send({
          name: "New Envelope",
          targetAmountCents: 10000,
          isProtected: false,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        name: "New Envelope",
        targetAmountCents: 10000,
        balanceCents: 0, // New envelope has zero balance
        isProtected: false,
      });

      expect(mockCreateEnvelopeUseCase.execute).toHaveBeenCalledWith({
        userId: validUserId,
        name: "New Envelope",
        targetAmountCents: 10000,
        isProtected: false,
      });
    });
  });

  describe("GET /api/v1/envelopes/:id/transactions", () => {
    it("should return transactions for an envelope", async () => {
      // Mock envelope exists
      mockGetEnvelopeTransactionsUseCase.execute.mockResolvedValue({
        envelopeId: userEnvelope1Id,
        transactions: [
          {
            id: "test-tx-id",
            userId: validUserId,
            type: "envelope_allocation",
            occurredAt: new Date("2024-01-15"),
            description: "Funding groceries",
            lines: [
              {
                id: "line-1",
                transactionId: "test-tx-id",
                targetType: "account",
                targetId: "account-id",
                amountCents: -5000,
              },
              {
                id: "line-2",
                transactionId: "test-tx-id",
                targetType: "envelope",
                targetId: userEnvelope1Id,
                amountCents: 5000,
              },
            ],
            createdAt: new Date("2024-01-15"),
            updatedAt: new Date("2024-01-15"),
            reversalOfTransactionId: undefined,
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/envelopes/${userEnvelope1Id}/transactions`)
        .expect(200);

      expect(response.body).toHaveProperty("envelopeId");
      expect(response.body.envelopeId).toBe(userEnvelope1Id);
      expect(response.body).toHaveProperty("transactions");
      expect(response.body.transactions).toHaveLength(1);
      expect(response.body.transactions[0]).toHaveProperty("id");
      expect(response.body.transactions[0].id).toBe("test-tx-id");
      expect(response.body.transactions[0]).toHaveProperty("lines");
      expect(response.body.transactions[0].lines).toHaveLength(2);
    });

    it("should return empty transactions array if envelope has no transactions", async () => {
      mockGetEnvelopeTransactionsUseCase.execute.mockResolvedValue({
        envelopeId: userEnvelope1Id,
        transactions: [],
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/envelopes/${userEnvelope1Id}/transactions`)
        .expect(200);

      expect(response.body).toHaveProperty("envelopeId");
      expect(response.body.envelopeId).toBe(userEnvelope1Id);
      expect(response.body).toHaveProperty("transactions");
      expect(response.body.transactions).toHaveLength(0);
    });
  });

  describe("User scoping", () => {
    it("should only access envelopes belonging to authenticated user", async () => {
      // Verify that the guard attaches the correct user
      mockGetEnvelopeUseCase.execute.mockResolvedValue(userEnvelope1);
      mockGetEnvelopeBalanceUseCase.execute.mockResolvedValue({
        envelopeId: userEnvelope1Id,
        balanceCents: 25000,
      });

      await request(app.getHttpServer())
        .get(`/api/v1/envelopes/${userEnvelope1Id}`)
        .expect(200);

      // Verify the use case was called with the authenticated user's ID
      expect(mockGetEnvelopeUseCase.execute).toHaveBeenCalledWith({
        userId: validUserId,
        id: userEnvelope1Id,
      });
    });
  });
});
