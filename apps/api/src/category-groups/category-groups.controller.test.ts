import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CategoryGroupsModule } from "./category-groups.module";
import { CATEGORY_GROUPS_TOKENS } from "./category-groups.tokens";
import type { CategoryGroupRepository } from "@ledger-mx/domain";
import type { CategoryGroup, CategoryGroupKind, UserId, CategoryGroupId } from "@ledger-mx/domain";
import { categoryGroupIdFromString } from "@ledger-mx/domain";

// Environment setup: save original and set test values before module creation
const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-for-category-groups-tests-minimum-32-chars';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
});

afterEach(() => {
  process.env = { ...originalEnv };
});

// Mock user
const validUserId = "550e8400-e29b-41d4-a716-446655440000" as UserId;
const validGroupId = categoryGroupIdFromString("660e8400-e29b-41d4-a716-446655440000");

// Mock category group
const mockCategoryGroup: CategoryGroup = {
  id: validGroupId,
  userId: validUserId,
  name: "Needs",
  kind: "expense" as CategoryGroupKind,
  idealPercentageBasisPoints: 5000,
  sortOrder: 0,
  isSystem: false,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// Mock repository
const mockCategoryGroupRepository = {
  save: vi.fn(),
  findById: vi.fn(),
  listByUserId: vi.fn(),
  hasActiveCategories: vi.fn(),
  softDelete: vi.fn(),
};

// Mock guard that attaches user to request
const mockJwtAuthGuard = {
  canActivate: vi.fn().mockImplementation((context) => {
    const request = context.switchToHttp().getRequest();
    request.user = { sub: validUserId, email: "test@example.com" };
    return true;
  }),
};

describe("CategoryGroupsController", () => {
  let app: INestApplication;
  let repository: CategoryGroupRepository;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CategoryGroupsModule.forRoot({
          categoryGroupRepository: {
            provide: CATEGORY_GROUPS_TOKENS.CATEGORY_GROUP_REPOSITORY,
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

    repository = module.get<CategoryGroupRepository>(
      CATEGORY_GROUPS_TOKENS.CATEGORY_GROUP_REPOSITORY,
    );
  });

  afterEach(async () => {
    await app.close();
  });

  describe("GET /category-groups", () => {
    it("should return list of category groups for authenticated user", async () => {
      vi.spyOn(repository, "listByUserId").mockResolvedValue([mockCategoryGroup]);

      const response = await request(app.getHttpServer())
        .get("/category-groups")
        .expect(200);

      expect(response.body).toEqual({
        categoryGroups: [
          {
            id: mockCategoryGroup.id,
            name: mockCategoryGroup.name,
            kind: mockCategoryGroup.kind,
            idealPercentageBasisPoints: mockCategoryGroup.idealPercentageBasisPoints,
            sortOrder: mockCategoryGroup.sortOrder,
            isSystem: mockCategoryGroup.isSystem,
            createdAt: mockCategoryGroup.createdAt.toISOString(),
            updatedAt: mockCategoryGroup.updatedAt.toISOString(),
          },
        ],
      });
      expect(repository.listByUserId).toHaveBeenCalledWith(validUserId);
    });

    it("should return empty array when user has no category groups", async () => {
      vi.spyOn(repository, "listByUserId").mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get("/category-groups")
        .expect(200);

      expect(response.body).toEqual({ categoryGroups: [] });
    });
  });

  describe("POST /category-groups", () => {
    const validCreateDto = {
      name: "Savings",
      kind: "savings",
      idealPercentageBasisPoints: 2000,
      sortOrder: 1,
    };

    it("should create category group and return 201", async () => {
      vi.spyOn(repository, "save").mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post("/category-groups")
        .send(validCreateDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: validCreateDto.name,
        kind: validCreateDto.kind,
        idealPercentageBasisPoints: validCreateDto.idealPercentageBasisPoints,
        sortOrder: validCreateDto.sortOrder,
        isSystem: false,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it("should return 400 for invalid basis points (over 10000)", async () => {
      await request(app.getHttpServer())
        .post("/category-groups")
        .send({
          ...validCreateDto,
          idealPercentageBasisPoints: 15000,
        })
        .expect(400);
    });

    it("should return 400 for missing required fields", async () => {
      await request(app.getHttpServer())
        .post("/category-groups")
        .send({})
        .expect(400);
    });

    it("should return 400 for invalid kind", async () => {
      await request(app.getHttpServer())
        .post("/category-groups")
        .send({
          ...validCreateDto,
          kind: "invalid-kind",
        })
        .expect(400);
    });
  });

  describe("PATCH /category-groups/:id", () => {
    const updateDto = {
      name: "Updated Needs",
      idealPercentageBasisPoints: 5500,
    };

    it("should update category group and return updated data", async () => {
      const updatedGroup = {
        ...mockCategoryGroup,
        name: updateDto.name,
        idealPercentageBasisPoints: updateDto.idealPercentageBasisPoints,
      };
      vi.spyOn(repository, "findById").mockResolvedValue(updatedGroup);
      vi.spyOn(repository, "save").mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .patch(`/category-groups/${validGroupId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toMatchObject({
        id: validGroupId,
        name: updateDto.name,
        idealPercentageBasisPoints: updateDto.idealPercentageBasisPoints,
      });
    });

    it("should return 404 for non-existent category group", async () => {
      vi.spyOn(repository, "findById").mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch(`/category-groups/${validGroupId}`)
        .send(updateDto)
        .expect(404);
    });

    it("should return 400 for invalid UUID in param", async () => {
      await request(app.getHttpServer())
        .patch("/category-groups/invalid-uuid")
        .send(updateDto)
        .expect(400);
    });
  });

  describe("DELETE /category-groups/:id", () => {
    it("should soft delete category group and return success", async () => {
      vi.spyOn(repository, "findById").mockResolvedValue(mockCategoryGroup);
      vi.spyOn(repository, "hasActiveCategories").mockResolvedValue(false);
      vi.spyOn(repository, "softDelete").mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete(`/category-groups/${validGroupId}`)
        .expect(200);

      expect(response.body).toEqual({ success: true });
    });

    it("should return 404 for non-existent category group", async () => {
      vi.spyOn(repository, "findById").mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete(`/category-groups/${validGroupId}`)
        .expect(404);
    });

    it("should return 409 for system category group", async () => {
      const systemGroup = { ...mockCategoryGroup, isSystem: true };
      vi.spyOn(repository, "findById").mockResolvedValue(systemGroup);

      await request(app.getHttpServer())
        .delete(`/category-groups/${validGroupId}`)
        .expect(409);
    });

    it("should return 409 when category group has active categories", async () => {
      vi.spyOn(repository, "findById").mockResolvedValue(mockCategoryGroup);
      vi.spyOn(repository, "hasActiveCategories").mockResolvedValue(true);

      await request(app.getHttpServer())
        .delete(`/category-groups/${validGroupId}`)
        .expect(409);
    });
  });
});
