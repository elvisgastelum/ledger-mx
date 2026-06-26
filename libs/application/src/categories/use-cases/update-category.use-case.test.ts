import { describe, it, expect, beforeEach } from "vitest";
import { UpdateCategoryUseCase } from "./update-category.use-case";
import type {
  CategoryRepository,
  CategoryGroupRepository,
  Category,
  CategoryGroup,
  UserId,
  CategoryId,
  CategoryGroupId,
} from "@ledger-mx/domain";
import type { Clock } from "../../auth/ports/clock.port";
import {
  categoryIdFromString,
  categoryGroupIdFromString,
} from "@ledger-mx/domain";
import { CategoryNotFoundError } from "../category.errors";
import { SystemCategoryModificationError } from "../category.errors";
import { DuplicateCategoryNameError } from "../category.errors";

// In-memory fake repositories
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

    // Sort by name as per interface contract
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  async listChildren(
    userId: UserId,
    parentId: CategoryId,
  ): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(
      (c) => c.userId === userId && c.parentId === parentId && !c.deletedAt,
    );
  }

  async hasTransactionLines(): Promise<boolean> {
    return false;
  }

  async hasActiveChildren(): Promise<boolean> {
    return false;
  }

  async countTransactionLines(): Promise<Map<CategoryId, number>> {
    return new Map();
  }

  async softDelete(): Promise<void> {}

  reset() {
    this.categories.clear();
  }

  async addCategory(category: Category): Promise<void> {
    await this.save(category);
  }
}

class FakeCategoryGroupRepository implements CategoryGroupRepository {
  private groups: Map<string, CategoryGroup> = new Map();

  async save(group: CategoryGroup): Promise<void> {
    this.groups.set(`${group.userId}:${group.id}`, group);
  }

  async findById(
    userId: UserId,
    id: CategoryGroupId,
  ): Promise<CategoryGroup | null> {
    return this.groups.get(`${userId}:${id}`) ?? null;
  }

  async listByUserId(userId: UserId): Promise<CategoryGroup[]> {
    return Array.from(this.groups.values()).filter(
      (g) => g.userId === userId && !g.deletedAt,
    );
  }

  async hasActiveCategories(): Promise<boolean> {
    return false;
  }

  async softDelete(): Promise<void> {}

  reset() {
    this.groups.clear();
  }

  async addGroup(group: CategoryGroup): Promise<void> {
    await this.save(group);
  }
}

class FakeClock implements Clock {
  now(): Date {
    return new Date("2024-01-01T00:00:00Z");
  }
}

describe("UpdateCategoryUseCase", () => {
  let useCase: UpdateCategoryUseCase;
  let categoryRepo: FakeCategoryRepository;
  let groupRepo: FakeCategoryGroupRepository;
  let clock: FakeClock;
  const USER_ID = "00000000-0000-4000-8000-000000000101" as UserId;
  const OTHER_USER_ID = "00000000-0000-4000-8000-000000000999" as UserId;

  beforeEach(() => {
    categoryRepo = new FakeCategoryRepository();
    groupRepo = new FakeCategoryGroupRepository();
    clock = new FakeClock();
    useCase = new UpdateCategoryUseCase(categoryRepo, groupRepo, clock);
  });

  describe("category existence and ownership", () => {
    it("should throw CategoryNotFoundError if category does not exist", async () => {
      const categoryId = categoryIdFromString(
        "00000000-0000-4000-8000-000000000201",
      );

      await expect(
        useCase.execute({
          userId: USER_ID,
          id: categoryId,
          name: "Updated Name",
        }),
      ).rejects.toThrow(CategoryNotFoundError);
    });

    it("should throw SystemCategoryModificationError if updating system category", async () => {
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
        ownership: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        useCase.execute({
          userId: USER_ID,
          id: categoryId,
          name: "Updated Name",
        }),
      ).rejects.toThrow(SystemCategoryModificationError);
    });

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

      await expect(
        useCase.execute({
          userId: USER_ID,
          id: categoryId,
          name: "Updated Name",
        }),
      ).rejects.toThrow(CategoryNotFoundError);
    });
  });

  describe("update behavior", () => {
    let categoryId: CategoryId;
    let groupId: CategoryGroupId;

    beforeEach(async () => {
      groupId = categoryGroupIdFromString(
        "00000000-0000-4000-8000-000000000301",
      );
      await groupRepo.addGroup({
        id: groupId,
        userId: USER_ID,
        name: "Needs",
        kind: "expense",
        idealPercentageBasisPoints: 5000,
        sortOrder: 0,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      categoryId = categoryIdFromString("00000000-0000-4000-8000-000000000201");
      await categoryRepo.addCategory({
        id: categoryId,
        userId: USER_ID,
        name: "Groceries",
        parentId: null,
        categoryGroupId: groupId,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it("should update category name", async () => {
      const result = await useCase.execute({
        userId: USER_ID,
        id: categoryId,
        name: "Updated Groceries",
      });

      expect(result.name).toBe("Updated Groceries");
    });

    it("should update parentId", async () => {
      const parentId = categoryIdFromString(
        "00000000-0000-4000-8000-000000000202",
      );

      // Create parent category
      await categoryRepo.addCategory({
        id: parentId,
        userId: USER_ID,
        name: "Food",
        parentId: null,
        categoryGroupId: groupId,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await useCase.execute({
        userId: USER_ID,
        id: categoryId,
        parentId,
      });

      expect(result.parentId).toBe(parentId);
    });

    it("should not update ownership", async () => {
      const result = await useCase.execute({
        userId: USER_ID,
        id: categoryId,
        name: "Updated Name",
      });

      expect(result.ownership).toBe("user");
    });
  });

  describe("category name validation", () => {
    let categoryId: CategoryId;
    let groupId: CategoryGroupId;

    beforeEach(async () => {
      groupId = categoryGroupIdFromString(
        "00000000-0000-4000-8000-000000000301",
      );
      await groupRepo.addGroup({
        id: groupId,
        userId: USER_ID,
        name: "Needs",
        kind: "expense",
        idealPercentageBasisPoints: 5000,
        sortOrder: 0,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      categoryId = categoryIdFromString("00000000-0000-4000-8000-000000000201");
      await categoryRepo.addCategory({
        id: categoryId,
        userId: USER_ID,
        name: "Groceries",
        parentId: null,
        categoryGroupId: groupId,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it("should throw error for empty name", async () => {
      await expect(
        useCase.execute({
          userId: USER_ID,
          id: categoryId,
          name: "",
        }),
      ).rejects.toThrow("Category name cannot be empty");
    });

    it("should throw error for whitespace-only name", async () => {
      await expect(
        useCase.execute({
          userId: USER_ID,
          id: categoryId,
          name: "   ",
        }),
      ).rejects.toThrow("Category name cannot be empty");
    });

    it("should throw error for name exceeding 100 characters", async () => {
      const longName = "a".repeat(101);
      await expect(
        useCase.execute({
          userId: USER_ID,
          id: categoryId,
          name: longName,
        }),
      ).rejects.toThrow("Category name cannot exceed 100 characters");
    });

    it("should trim whitespace from name", async () => {
      const result = await useCase.execute({
        userId: USER_ID,
        id: categoryId,
        name: "  Updated Groceries  ",
      });

      expect(result.name).toBe("Updated Groceries");
    });

    it("should throw DuplicateCategoryNameError for case-insensitive duplicate name", async () => {
      // Create another category with the same name (different case)
      const otherCategoryId = categoryIdFromString(
        "00000000-0000-4000-8000-000000000202",
      );
      await categoryRepo.addCategory({
        id: otherCategoryId,
        userId: USER_ID,
        name: "DINING",
        parentId: null,
        categoryGroupId: groupId,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Try to update category to "dining" (should fail as "DINING" exists)
      await expect(
        useCase.execute({
          userId: USER_ID,
          id: categoryId,
          name: "dining",
        }),
      ).rejects.toThrow(DuplicateCategoryNameError);
    });

    it("should allow updating category name to same name (case-insensitive)", async () => {
      // Update category to same name with different case (should succeed)
      const result = await useCase.execute({
        userId: USER_ID,
        id: categoryId,
        name: "GROCERIES",
      });

      expect(result.name).toBe("GROCERIES");
    });
  });

  describe("cross-user isolation", () => {
    it("should not update category belonging to another user", async () => {
      const categoryId = categoryIdFromString(
        "00000000-0000-4000-8000-000000000201",
      );

      // Create category for other user
      await categoryRepo.addCategory({
        id: categoryId,
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

      // Try to update as current user
      await expect(
        useCase.execute({
          userId: USER_ID,
          id: categoryId,
          name: "Hacked Name",
        }),
      ).rejects.toThrow(CategoryNotFoundError);
    });
  });
});
