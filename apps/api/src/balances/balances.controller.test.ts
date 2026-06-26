import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { BalancesModule } from "./balances.module";
import { BALANCES_TOKENS } from "./balances.tokens";
import type { BalanceRepository } from "@ledger-mx/domain";
import { userIdFromString, accountIdFromString } from "@ledger-mx/domain";

// Environment setup using vi.stubEnv for proper test isolation
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv(
    "JWT_SECRET",
    "test-jwt-secret-for-balances-tests-minimum-32-chars",
  );
  vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// Mock users
const validUserId = userIdFromString("550e8400-e29b-41d4-a716-446655440000");

// Mock account IDs using proper domain constructors
const userACheckingId = accountIdFromString(
  "990e8400-e29b-41d4-a716-446655440003",
);
const userBCheckingId = accountIdFromString(
  "990e8400-e29b-41d4-a716-446655440005",
);

// Mock balance data for user A
const userACheckingBalance = {
  accountId: userACheckingId,
  balanceCents: 50000, // $500.00
};

const userAByAccountType = [
  {
    accountType: "debit" as const,
    balanceCents: 50000,
    accountCount: 1,
  },
  {
    accountType: "savings" as const,
    balanceCents: 120000,
    accountCount: 1,
  },
];

const userALiabilities = [
  {
    accountId: accountIdFromString("aa0e8400-e29b-41d4-a716-446655440010"),
    accountName: "Credit Card",
    accountType: "credit" as const,
    balanceCents: -150000, // $1500.00 debt
  },
];

// Updated mock for getBalancesByAccountType to include liabilities
// This is what GetGeneralBalanceUseCase actually uses
const userAByAccountTypeWithLiabilities = [
  {
    accountType: "debit" as const,
    balanceCents: 50000,
    accountCount: 1,
  },
  {
    accountType: "savings" as const,
    balanceCents: 120000,
    accountCount: 1,
  },
  {
    accountType: "credit" as const,
    balanceCents: -150000, // Liability
    accountCount: 1,
  },
];

// Mock repository
const mockBalanceRepository = {
  getAccountBalance: vi.fn(),
  getAccountBalances: vi.fn(),
  getBalancesByAccountType: vi.fn(),
  getLiabilityBalances: vi.fn(),
};

// Mock guard that attaches user to request
const mockJwtAuthGuard = {
  canActivate: vi.fn().mockImplementation((context) => {
    const request = context.switchToHttp().getRequest();
    request.user = { sub: validUserId, email: "test@example.com" };
    return true;
  }),
};

describe("BalancesController", () => {
  let app: INestApplication;
  let repository: BalanceRepository;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BalancesModule.forRoot({
          balanceRepository: {
            provide: BALANCES_TOKENS.BALANCE_REPOSITORY,
            useValue: mockBalanceRepository,
          },
        }),
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = module.createNestApplication();
    await app.init();

    repository = module.get<BalanceRepository>(
      BALANCES_TOKENS.BALANCE_REPOSITORY,
    );
  });

  afterEach(async () => {
    await app.close();
  });

  describe("GET /api/v1/balances", () => {
    it("should return general balance/net worth for authenticated user and verify repository receives only current user id", async () => {
      // GetGeneralBalanceUseCase uses getBalancesByAccountType to calculate totals
      vi.spyOn(repository, "getBalancesByAccountType").mockResolvedValue(
        userAByAccountTypeWithLiabilities,
      );

      const response = await request(app.getHttpServer())
        .get("/api/v1/balances")
        .expect(200);

      // Assets: 50000 + 120000 = 170000
      // Liabilities: -150000
      // Net worth: 170000 + (-150000) = 20000
      expect(response.body).toMatchObject({
        assetsBalanceCents: 170000,
        liabilitiesBalanceCents: -150000,
        netWorthCents: 20000,
      });
      expect(repository.getBalancesByAccountType).toHaveBeenCalledWith(
        validUserId,
      );
    });
  });

  describe("GET /api/v1/balances/accounts/:accountId", () => {
    it("should return one account balance for current user", async () => {
      vi.spyOn(repository, "getAccountBalance").mockResolvedValue(
        userACheckingBalance,
      );

      const response = await request(app.getHttpServer())
        .get(`/api/v1/balances/accounts/${userACheckingId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        accountId: userACheckingId,
        balanceCents: 50000,
      });
      expect(repository.getAccountBalance).toHaveBeenCalledWith(
        validUserId,
        userACheckingId,
      );
    });

    it("should return 404 for account belonging to another user", async () => {
      // Repository returns null for account not owned by current user
      vi.spyOn(repository, "getAccountBalance").mockResolvedValue(null);

      await request(app.getHttpServer())
        .get(`/api/v1/balances/accounts/${userBCheckingId}`)
        .expect(404);
    });

    it("should return 404 for non-existent account", async () => {
      vi.spyOn(repository, "getAccountBalance").mockResolvedValue(null);

      // Use a valid UUID format for non-existent account
      const nonExistentAccountId = "00000000-0000-0000-0000-000000000000";
      await request(app.getHttpServer())
        .get(`/api/v1/balances/accounts/${nonExistentAccountId}`)
        .expect(404);
    });
  });

  describe("GET /api/v1/balances/by-account-type", () => {
    it("should return grouped balances scoped to current user", async () => {
      vi.spyOn(repository, "getBalancesByAccountType").mockResolvedValue(
        userAByAccountType,
      );

      const response = await request(app.getHttpServer())
        .get("/api/v1/balances/by-account-type")
        .expect(200);

      expect(response.body.balances).toHaveLength(2);
      expect(response.body.balances[0]).toMatchObject({
        accountType: "debit",
        balanceCents: 50000,
        accountCount: 1,
      });
      expect(repository.getBalancesByAccountType).toHaveBeenCalledWith(
        validUserId,
      );
    });
  });

  describe("GET /api/v1/balances/liabilities", () => {
    it("should return only liability balances scoped to current user", async () => {
      vi.spyOn(repository, "getLiabilityBalances").mockResolvedValue(
        userALiabilities,
      );

      const response = await request(app.getHttpServer())
        .get("/api/v1/balances/liabilities")
        .expect(200);

      expect(response.body.liabilities).toHaveLength(1);
      expect(response.body.liabilities[0]).toMatchObject({
        accountId: userALiabilities[0].accountId,
        accountName: "Credit Card",
        accountType: "credit",
        balanceCents: -150000,
      });
      expect(repository.getLiabilityBalances).toHaveBeenCalledWith(validUserId);
    });
  });
});
