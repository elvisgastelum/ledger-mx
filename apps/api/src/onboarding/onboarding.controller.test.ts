import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OnboardingModule } from "./onboarding.module";
import type { UserId } from "@ledger-mx/domain";
// categoryGroupIdFromString removed - unused
import { ApplyDefaultCategoryGroupLayoutUseCase } from "@ledger-mx/application";
import { CategoryGroupLayoutConflictError } from "@ledger-mx/application";

// Environment setup: save original and set test values before module creation
const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-for-onboarding-tests-minimum-32-chars';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
});

afterEach(() => {
  process.env = { ...originalEnv };
});

// Mock user
const validUserId = "550e8400-e29b-41d4-a716-446655440000" as UserId;

// Mock repository
// const mockCategoryGroupRepository = {
//   save: vi.fn(),
//   findById: vi.fn(),
//   listByUserId: vi.fn(),
//   hasActiveCategories: vi.fn(),
//   softDelete: vi.fn(),
// };

// Mock use case
const mockApplyLayoutUseCase = {
  execute: vi.fn(),
};

// Mock guard that attaches user to request
const mockJwtAuthGuard = {
  canActivate: vi.fn().mockImplementation((context: unknown) => {
    const request = context.switchToHttp().getRequest();
    request.user = { sub: validUserId, email: "test@example.com" };
    return true;
  }),
};

describe("OnboardingController", () => {
  let app: INestApplication;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [OnboardingModule.forRoot()],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideProvider(ApplyDefaultCategoryGroupLayoutUseCase)
      .useClass(class MockUseCase {
        execute = mockApplyLayoutUseCase.execute;
      })
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("POST /api/v1/onboarding/layout", () => {
    const mockCategoryGroups = [
      {
        id: "660e8400-e29b-41d4-a716-446655440000",
        name: "General",
        kind: "general",
        idealPercentageBasisPoints: null,
        sortOrder: 0,
        isSystem: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
    ];

    it("should create blank layout and return 200 with created=true", async () => {
      mockApplyLayoutUseCase.execute.mockResolvedValue({
        categoryGroups: mockCategoryGroups,
        created: true,
      });

      const response = await request(app.getHttpServer())
        .post("/api/v1/onboarding/layout")
        .send({ layout: "blank" })
        .expect(200);

      expect(response.body).toEqual({
        categoryGroups: [
          {
            id: mockCategoryGroups[0].id,
            name: mockCategoryGroups[0].name,
            kind: mockCategoryGroups[0].kind,
            idealPercentageBasisPoints: null,
            sortOrder: mockCategoryGroups[0].sortOrder,
            isSystem: mockCategoryGroups[0].isSystem,
            createdAt: mockCategoryGroups[0].createdAt.toISOString(),
            updatedAt: mockCategoryGroups[0].updatedAt.toISOString(),
          },
        ],
        created: true,
      });
      expect(mockApplyLayoutUseCase.execute).toHaveBeenCalledWith({
        userId: validUserId,
        layout: "blank",
      });
    });

    it("should create 50-30-20 layout and return 200", async () => {
      const mock503020Groups = [
        {
          id: "660e8400-e29b-41d4-a716-446655440001",
          name: "Need",
          kind: "expense",
          idealPercentageBasisPoints: 5000,
          sortOrder: 0,
          isSystem: true,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
        {
          id: "660e8400-e29b-41d4-a716-446655440002",
          name: "Want",
          kind: "expense",
          idealPercentageBasisPoints: 3000,
          sortOrder: 1,
          isSystem: true,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
        {
          id: "660e8400-e29b-41d4-a716-446655440003",
          name: "Savings",
          kind: "savings",
          idealPercentageBasisPoints: 2000,
          sortOrder: 2,
          isSystem: true,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ];

      mockApplyLayoutUseCase.execute.mockResolvedValue({
        categoryGroups: mock503020Groups,
        created: true,
      });

      const response = await request(app.getHttpServer())
        .post("/api/v1/onboarding/layout")
        .send({ layout: "50-30-20" })
        .expect(200);

      expect(response.body.categoryGroups).toHaveLength(3);
      expect(response.body.created).toBe(true);
    });

    it("should return 200 with created=false for idempotent call", async () => {
      mockApplyLayoutUseCase.execute.mockResolvedValue({
        categoryGroups: mockCategoryGroups,
        created: false,
      });

      const response = await request(app.getHttpServer())
        .post("/api/v1/onboarding/layout")
        .send({ layout: "blank" })
        .expect(200);

      expect(response.body.created).toBe(false);
    });

    it("should return 409 for layout conflict", async () => {
      mockApplyLayoutUseCase.execute.mockRejectedValue(
        new CategoryGroupLayoutConflictError(["Existing Group"]),
      );

      const response = await request(app.getHttpServer())
        .post("/api/v1/onboarding/layout")
        .send({ layout: "blank" })
        .expect(409);

      expect(response.body.message).toContain("Cannot apply layout");
    });

    it("should return 400 for invalid layout value", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/onboarding/layout")
        .send({ layout: "invalid-layout" })
        .expect(400);
    });

    it("should return 400 for missing layout field", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/onboarding/layout")
        .send({})
        .expect(400);
    });

    it("should use authenticated user_id from JWT", async () => {
      mockApplyLayoutUseCase.execute.mockResolvedValue({
        categoryGroups: mockCategoryGroups,
        created: true,
      });

      await request(app.getHttpServer())
        .post("/api/v1/onboarding/layout")
        .send({ layout: "blank" })
        .expect(200);

      expect(mockApplyLayoutUseCase.execute).toHaveBeenCalledWith({
        userId: validUserId,
        layout: "blank",
      });
    });
  });

  describe("POST /api/v1/onboarding/layout - unauthenticated", () => {
    it("should return 401 when no auth token provided", async () => {
      // Create a new module without the mock guard (uses real JwtAuthGuard)
      const module: TestingModule = await Test.createTestingModule({
        imports: [OnboardingModule.forRoot()],
      })
        .overrideProvider(ApplyDefaultCategoryGroupLayoutUseCase)
        .useClass(class MockUseCase {
          execute = mockApplyLayoutUseCase.execute;
        })
        .compile();

      const unauthApp = module.createNestApplication();
      await unauthApp.init();

      await request(unauthApp.getHttpServer())
        .post("/api/v1/onboarding/layout")
        .send({ layout: "blank" })
        .expect(401);

      await unauthApp.close();
    });
  });
});
