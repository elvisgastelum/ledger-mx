import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CategoriesModule } from "./categories.module";
import { CATEGORIES_TOKENS } from "./categories.tokens";
import type {
  CategoryRepository,
  CategoryGroupRepository,
} from "@ledger-mx/domain";
import type { Category, UserId, CategoryGroup } from "@ledger-mx/domain";
import {
  categoryIdFromString,
  categoryGroupIdFromString,
} from "@ledger-mx/domain";

// Environment setup
const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET =
    "test-jwt-secret-for-categories-tests-minimum-32-chars";
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

// Mock user
const validUserId = "550e8400-e29b-41d4-a716-446655440000" as UserId;
const validCategoryId = categoryIdFromString(
  "660e8400-e29b-41d4-a716-446655440001",
);
const validGroupId = categoryGroupIdFromString(
  "660e8400-e29b-41d4-a716-446655440000",
);

// Mock category
const mockCategory: Category = {
  id: validCategoryId,
  userId: validUserId,
  name: "Groceries",
  parentId: null,
  categoryGroupId: validGroupId,
  ownership: "user",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// Mock category group
const mockCategoryGroup: CategoryGroup = {
  id: validGroupId,
  userId: validUserId,
  name: "Needs",
  kind: "expense",
  idealPercentageBasisPoints: 5000,
  sortOrder: 0,
  ownership: "user",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// Mock repositories
const mockCategoryRepository = {
  save: vi.fn(),
  findById: vi.fn(),
  listByUserId: vi.fn(),
  listChildren: vi.fn(),
  hasTransactionLines: vi.fn(),
  countTransactionLines: vi.fn(),
  softDelete: vi.fn(),
  hasActiveChildren: vi.fn(),
};

const mockCategoryGroupRepository = {
  save: vi.fn(),
  findById: vi.fn(),
  listByUserId: vi.fn(),
  hasActiveCategories: vi.fn(),
  softDelete: vi.fn(),
};

// Mock guard
const mockJwtAuthGuard = {
  canActivate: vi.fn().mockImplementation(
    (context: {
      switchToHttp: () => {
        getRequest: () => { user: { sub: string; email: string } };
      };
    }) => {
      const request = context.switchToHttp().getRequest();
      request.user = { sub: validUserId, email: "test@example.com" };
      return true;
    },
  ),
};

describe("CategoriesController", () => {
  let app: INestApplication;
  let categoryRepo: CategoryRepository;
  let groupRepo: CategoryGroupRepository;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CategoriesModule.forRoot({
          categoryRepository: {
            provide: CATEGORIES_TOKENS.CATEGORY_REPOSITORY,
            useValue: mockCategoryRepository,
          },
          categoryGroupRepository: {
            provide: CATEGORIES_TOKENS.CATEGORY_GROUP_REPOSITORY,
            useValue: mockCategoryGroupRepository,
          },
        }),
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = module.createNestApplication();
    await app.init();

    categoryRepo = module.get<CategoryRepository>(
      CATEGORIES_TOKENS.CATEGORY_REPOSITORY,
    );
    groupRepo = module.get<CategoryGroupRepository>(
      CATEGORIES_TOKENS.CATEGORY_GROUP_REPOSITORY,
    );
  });

  afterEach(async () => {
    await app.close();
  });

  describe("GET /api/v1/categories", () => {
    it("should return list of categories with usage counts", async () => {
      vi.spyOn(categoryRepo, "listByUserId").mockResolvedValue([mockCategory]);
      vi.spyOn(categoryRepo, "countTransactionLines").mockResolvedValue(
        new Map([[validCategoryId, 5]]),
      );

      const response = await request(app.getHttpServer())
        .get("/api/v1/categories")
        .expect(200);

      expect(response.body).toEqual({
        categories: [
          {
            id: mockCategory.id,
            name: mockCategory.name,
            parentId: mockCategory.parentId,
            categoryGroupId: mockCategory.categoryGroupId,
            ownership: mockCategory.ownership,
            createdAt: mockCategory.createdAt.toISOString(),
            updatedAt: mockCategory.updatedAt.toISOString(),
            usageCount: 5,
          },
        ],
      });
    });

    it("should filter by categoryGroupId when provided", async () => {
      vi.spyOn(categoryRepo, "listByUserId").mockResolvedValue([mockCategory]);
      vi.spyOn(categoryRepo, "countTransactionLines").mockResolvedValue(
        new Map(),
      );

      await request(app.getHttpServer())
        .get(`/api/v1/categories?categoryGroupId=${validGroupId}`)
        .expect(200);

      expect(categoryRepo.listByUserId).toHaveBeenCalledWith(
        validUserId,
        validGroupId,
      );
    });
  });

  describe("POST /api/v1/categories", () => {
    const validCreateDto = {
      name: "Groceries",
      categoryGroupId: validGroupId,
    };

    it("should create category and return 201", async () => {
      vi.spyOn(groupRepo, "findById").mockResolvedValue(mockCategoryGroup);
      vi.spyOn(categoryRepo, "listByUserId").mockResolvedValue([]); // No duplicates
      vi.spyOn(categoryRepo, "save").mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post("/api/v1/categories")
        .send(validCreateDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: validCreateDto.name,
        categoryGroupId: validGroupId,
        ownership: "user",
      });
      expect(response.body.id).toBeDefined();
    });

    it("should return 404 if category group not found", async () => {
      vi.spyOn(groupRepo, "findById").mockResolvedValue(null);

      await request(app.getHttpServer())
        .post("/api/v1/categories")
        .send(validCreateDto)
        .expect(404);
    });
  });

  describe("GET /api/v1/categories/:id", () => {
    it("should return category by id", async () => {
      vi.spyOn(categoryRepo, "findById").mockResolvedValue(mockCategory);
      vi.spyOn(categoryRepo, "countTransactionLines").mockResolvedValue(
        new Map([[validCategoryId, 3]]),
      );

      const response = await request(app.getHttpServer())
        .get(`/api/v1/categories/${validCategoryId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        category: {
          id: mockCategory.id,
          name: mockCategory.name,
          usageCount: 3,
        },
      });
    });

    it("should return 404 for non-existent category", async () => {
      vi.spyOn(categoryRepo, "findById").mockResolvedValue(null);

      await request(app.getHttpServer())
        .get(`/api/v1/categories/${validCategoryId}`)
        .expect(404);
    });
  });

  describe("PUT /api/v1/categories/:id", () => {
    const validUpdateDto = {
      name: "Updated Groceries",
    };

    it("should update category and return 200", async () => {
      vi.spyOn(categoryRepo, "findById").mockResolvedValue(mockCategory);
      vi.spyOn(categoryRepo, "listByUserId").mockResolvedValue([]); // No duplicates
      vi.spyOn(categoryRepo, "save").mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .put(`/api/v1/categories/${validCategoryId}`)
        .send(validUpdateDto)
        .expect(200);

      expect(response.body).toMatchObject({
        id: validCategoryId,
        name: "Updated Groceries",
        categoryGroupId: validGroupId,
        ownership: "user",
      });
    });

    it("should return 404 if category not found", async () => {
      vi.spyOn(categoryRepo, "findById").mockResolvedValue(null);

      await request(app.getHttpServer())
        .put(`/api/v1/categories/${validCategoryId}`)
        .send(validUpdateDto)
        .expect(404);
    });

    it("should return 409 if modifying system category", async () => {
      const systemCategory = {
        ...mockCategory,
        ownership: "system" as const,
      };

      vi.spyOn(categoryRepo, "findById").mockResolvedValue(systemCategory);

      await request(app.getHttpServer())
        .put(`/api/v1/categories/${validCategoryId}`)
        .send(validUpdateDto)
        .expect(409);
    });
  });

  describe("POST /api/v1/categories/:id/archive", () => {
    it("should archive custom category and return 204", async () => {
      vi.spyOn(categoryRepo, "findById").mockResolvedValue(mockCategory);
      vi.spyOn(categoryRepo, "hasActiveChildren").mockResolvedValue(false);
      vi.spyOn(categoryRepo, "hasTransactionLines").mockResolvedValue(false);
      vi.spyOn(categoryRepo, "softDelete").mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post(`/api/v1/categories/${validCategoryId}/archive`)
        .expect(204);
    });

    it("should return 404 if category not found", async () => {
      vi.spyOn(categoryRepo, "findById").mockResolvedValue(null);

      await request(app.getHttpServer())
        .post(`/api/v1/categories/${validCategoryId}/archive`)
        .expect(404);
    });

    it("should return 409 if archiving system category", async () => {
      const systemCategory = {
        ...mockCategory,
        ownership: "system" as const,
      };

      vi.spyOn(categoryRepo, "findById").mockResolvedValue(systemCategory);

      await request(app.getHttpServer())
        .post(`/api/v1/categories/${validCategoryId}/archive`)
        .expect(409);
    });

    it("should return 409 if category has active children", async () => {
      vi.spyOn(categoryRepo, "findById").mockResolvedValue(mockCategory);
      vi.spyOn(categoryRepo, "hasActiveChildren").mockResolvedValue(true);

      await request(app.getHttpServer())
        .post(`/api/v1/categories/${validCategoryId}/archive`)
        .expect(409);
    });

    it("should return 409 if category has transaction lines", async () => {
      vi.spyOn(categoryRepo, "findById").mockResolvedValue(mockCategory);
      vi.spyOn(categoryRepo, "hasActiveChildren").mockResolvedValue(false);
      vi.spyOn(categoryRepo, "hasTransactionLines").mockResolvedValue(true);

      await request(app.getHttpServer())
        .post(`/api/v1/categories/${validCategoryId}/archive`)
        .expect(409);
    });
  });
});
