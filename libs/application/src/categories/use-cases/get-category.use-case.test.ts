import { describe, it, expect, beforeEach } from "vitest";
import { GetCategoryUseCase } from "./get-category.use-case";
import type {
  CategoryRepository,
  Category,
  UserId,
  CategoryId,
  CategoryGroupId,
} from "@ledger-mx/domain";
import {
  categoryIdFromString,
  categoryGroupIdFromString,
} from "@ledger-mx/domain";
import { CategoryNotFoundError } from "../category.errors";

// In-memory fake repository
class FakeCategoryRepository implements CategoryRepository {
  private categories: Map<string, Category> = new Map();

  async save(category: Category): Promise<void> {
    this.categories.set(`${category.userId}:${category.id}`, category);
  }

  async findById(userId: UserId, id: CategoryId): Promise<Category | null> {
    return this.categories.get(`${userId}:${id}`) ?? null;
  }

  async listByUserId(
    userId: UserId,
    categoryGroupId?: CategoryGroupId,
  ): Promise<Category[]> {
    let result = Array.from(this.categories.values()).filter(
      (c) => c.userId === userId && !c.deletedAt,
    );

    if (categoryGroupId) {
      result = result.filter((c) => c.categoryGroupId === categoryGroupId);
    }

    return result;
  }

  async listChildren(): Promise<Category[]> {
    return [];
  }

  async hasTransactionLines(): Promise<boolean> {
    return false;
  }

  async countTransactionLines(): Promise<Map<CategoryId, number>> {
    return new Map();
  }

  async hasActiveChildren(): Promise<boolean> {
    return false;
  }

  async softDelete(): Promise<void> {}

  reset() {
    this.categories.clear();
  }

  async addCategory(category: Category): Promise<void> {
    await this.save(category);
  }
}

describe("GetCategoryUseCase", () => {
  let useCase: GetCategoryUseCase;
  let categoryRepo: FakeCategoryRepository;
  const USER_ID = "00000000-0000-4000-8000-000000000101" as UserId;
  const OTHER_USER_ID = "00000000-0000-4000-8000-000000000999" as UserId;

  beforeEach(() => {
    categoryRepo = new FakeCategoryRepository();
    useCase = new GetCategoryUseCase(categoryRepo);
  });

  describe("category retrieval", () => {
    it("should return category with usage count", async () => {
      const categoryId = categoryIdFromString(
        "00000000-0000-4000-8000-000000000201",
      );

      await categoryRepo.addCategory({
        id: categoryId,
        userId: USER_ID,
        name: "Groceries",
        parentId: null,
        categoryGroupId: categoryGroupIdFromString(
          "00000000-0000-4000-8000-000000000301",
        ),
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await useCase.execute({
        userId: USER_ID,
        id: categoryId,
      });

      expect(result.category).toBeDefined();
      expect(result.category.id).toBe(categoryId);
      expect(result.category.name).toBe("Groceries");
      expect(result.category.usageCount).toBe(0);
    });

    it("should throw CategoryNotFoundError if category does not exist", async () => {
      const categoryId = categoryIdFromString(
        "00000000-0000-4000-8000-000000000201",
      );

      await expect(
        useCase.execute({
          userId: USER_ID,
          id: categoryId,
        }),
      ).rejects.toThrow(CategoryNotFoundError);
    });
  });

  describe("cross-user isolation", () => {
    it("should throw CategoryNotFoundError if category belongs to another user", async () => {
      const categoryId = categoryIdFromString(
        "00000000-0000-4000-8000-000000000201",
      );

      // Create category for other user
      await categoryRepo.addCategory({
        id: categoryId,
        userId: OTHER_USER_ID,
        name: "Other User Category",
        parentId: null,
        categoryGroupId: categoryGroupIdFromString(
          "00000000-0000-4000-8000-000000000301",
        ),
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Current user should not be able to get it
      await expect(
        useCase.execute({
          userId: USER_ID,
          id: categoryId,
        }),
      ).rejects.toThrow(CategoryNotFoundError);
    });

    it("should only return categories belonging to the authenticated user", async () => {
      const userCategoryId = categoryIdFromString(
        "00000000-0000-4000-8000-000000000201",
      );
      const otherCategoryId = categoryIdFromString(
        "00000000-0000-4000-8000-000000000202",
      );

      // Create category for current user
      await categoryRepo.addCategory({
        id: userCategoryId,
        userId: USER_ID,
        name: "My Category",
        parentId: null,
        categoryGroupId: categoryGroupIdFromString(
          "00000000-0000-4000-8000-000000000301",
        ),
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create category for other user with same ID (simulating ID collision)
      await categoryRepo.addCategory({
        id: otherCategoryId,
        userId: OTHER_USER_ID,
        name: "Other Category",
        parentId: null,
        categoryGroupId: categoryGroupIdFromString(
          "00000000-0000-4000-8000-000000000301",
        ),
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Should return current user's category
      const result = await useCase.execute({
        userId: USER_ID,
        id: userCategoryId,
      });

      expect(result.category).toBeDefined();
      expect(result.category.id).toBe(userCategoryId);
      expect(result.category.name).toBe("My Category");
    });
  });
});
