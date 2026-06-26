import { describe, it, expect, beforeEach, vi } from "vitest";
import { ArchiveCategoryUseCase } from "./archive-category.use-case";
import type {
  CategoryRepository,
  Category,
  UserId,
  CategoryId,
} from "@ledger-mx/domain";
import type { Clock } from "../../auth/ports/clock.port";
import {
  categoryIdFromString,
  categoryGroupIdFromString,
} from "@ledger-mx/domain";
import { CategoryNotFoundError } from "../category.errors";
import { SystemCategoryModificationError } from "../category.errors";
import { CategoryHasActiveChildrenError } from "../category.errors";

// In-memory fake repository
class FakeCategoryRepository implements CategoryRepository {
  private categories: Map<string, Category> = new Map();

  async save(category: Category): Promise<void> {
    this.categories.set(`${category.userId}:${category.id}`, category);
  }

  async findById(userId: UserId, id: CategoryId): Promise<Category | null> {
    return this.categories.get(`${userId}:${id}`) ?? null;
  }

  async listByUserId(userId: UserId): Promise<Category[]> {
    const result = Array.from(this.categories.values()).filter(
      (c) => c.userId === userId && !c.deletedAt,
    );

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

  async softDelete(
    userId: UserId,
    categoryId: CategoryId,
    deletedAt: Date,
  ): Promise<void> {
    const key = `${userId}:${categoryId}`;
    const category = this.categories.get(key);
    if (category) {
      category.deletedAt = deletedAt;
    }
  }

  reset() {
    this.categories.clear();
  }

  async addCategory(category: Category): Promise<void> {
    await this.save(category);
  }
}

class FakeClock implements Clock {
  now(): Date {
    return new Date("2024-01-01T00:00:00Z");
  }
}

describe("ArchiveCategoryUseCase", () => {
  let useCase: ArchiveCategoryUseCase;
  let categoryRepo: FakeCategoryRepository;
  let clock: FakeClock;
  const USER_ID = "00000000-0000-4000-8000-000000000101" as UserId;
  const OTHER_USER_ID = "00000000-0000-4000-8000-000000000999" as UserId;

  beforeEach(() => {
    categoryRepo = new FakeCategoryRepository();
    clock = new FakeClock();
    useCase = new ArchiveCategoryUseCase(categoryRepo, clock);
  });

  describe("system category prevention", () => {
    it("should throw SystemCategoryModificationError when archiving system category", async () => {
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
        }),
      ).rejects.toThrow(SystemCategoryModificationError);
    });

    it("should succeed when archiving user category", async () => {
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

      await expect(
        useCase.execute({
          userId: USER_ID,
          id: categoryId,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("soft delete behavior", () => {
    it("should set deletedAt instead of hard deleting", async () => {
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

      await useCase.execute({
        userId: USER_ID,
        id: categoryId,
      });

      // Category should still exist but with deletedAt set
      const archived = await categoryRepo.findById(USER_ID, categoryId);
      expect(archived).not.toBeNull();
      expect(archived!.deletedAt).toBeDefined();
      expect(archived!.deletedAt).toBeInstanceOf(Date);
    });

    it("should not affect other categories", async () => {
      const categoryId1 = categoryIdFromString(
        "00000000-0000-4000-8000-000000000201",
      );
      const categoryId2 = categoryIdFromString(
        "00000000-0000-4000-8000-000000000202",
      );

      await categoryRepo.addCategory({
        id: categoryId1,
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

      await categoryRepo.addCategory({
        id: categoryId2,
        userId: USER_ID,
        name: "Dining Out",
        parentId: null,
        categoryGroupId: categoryGroupIdFromString(
          "00000000-0000-4000-8000-000000000301",
        ),
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Archive first category
      await useCase.execute({
        userId: USER_ID,
        id: categoryId1,
      });

      // Second category should not be affected
      const stillActive = await categoryRepo.findById(USER_ID, categoryId2);
      expect(stillActive).not.toBeNull();
      expect(stillActive!.deletedAt).toBeUndefined();
    });
  });

  describe("cross-user isolation", () => {
    it("should return not found when category belongs to another user", async () => {
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

      // Current user should not be able to archive it
      await expect(
        useCase.execute({
          userId: USER_ID,
          id: categoryId,
        }),
      ).rejects.toThrow(CategoryNotFoundError);
    });

    it("should only archive categories belonging to the authenticated user", async () => {
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

      // Create category for other user
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

      // Archive current user's category
      await useCase.execute({
        userId: USER_ID,
        id: userCategoryId,
      });

      // Other user's category should not be affected
      const otherCategory = await categoryRepo.findById(
        OTHER_USER_ID,
        otherCategoryId,
      );
      expect(otherCategory).not.toBeNull();
      expect(otherCategory!.deletedAt).toBeUndefined();
    });
  });

  describe("active children check", () => {
    it("should prevent archiving category with active children", async () => {
      const parentId = categoryIdFromString(
        "00000000-0000-4000-8000-000000000201",
      );
      const childId = categoryIdFromString(
        "00000000-0000-4000-8000-000000000202",
      );

      // Create parent
      await categoryRepo.addCategory({
        id: parentId,
        userId: USER_ID,
        name: "Housing",
        parentId: null,
        categoryGroupId: categoryGroupIdFromString(
          "00000000-0000-4000-8000-000000000301",
        ),
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create child
      await categoryRepo.addCategory({
        id: childId,
        userId: USER_ID,
        name: "Rent",
        parentId: parentId,
        categoryGroupId: categoryGroupIdFromString(
          "00000000-0000-4000-8000-000000000301",
        ),
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock hasActiveChildren to return true
      vi.spyOn(categoryRepo, "hasActiveChildren").mockResolvedValue(true);

      await expect(
        useCase.execute({
          userId: USER_ID,
          id: parentId,
        }),
      ).rejects.toThrow(CategoryHasActiveChildrenError);
    });
  });
});
