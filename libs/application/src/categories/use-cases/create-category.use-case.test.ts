import { describe, it, expect, beforeEach } from "vitest";
import { CreateCategoryUseCase } from "./create-category.use-case";
import type {
  CategoryRepository,
  CategoryGroupRepository,
  Category,
  CategoryGroup,
  UserId,
  CategoryId,
  CategoryGroupId,
} from "@ledger-mx/domain";
import type { IdGenerator } from "../../auth/ports/id-generator.port";
import type { Clock } from "../../auth/ports/clock.port";
import {
  categoryIdFromString,
  categoryGroupIdFromString,
} from "@ledger-mx/domain";
import { CategoryGroupNotFoundError } from "../../category-groups/category-group.errors";
import { InvalidParentCategoryError } from "../category.errors";
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

  async countTransactionLines(): Promise<Map<CategoryId, number>> {
    return new Map();
  }

  async softDelete(): Promise<void> {}

  async hasActiveChildren(): Promise<boolean> {
    return false;
  }

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

class FakeIdGenerator implements IdGenerator {
  private counter = 0;

  uuid(): string {
    return `00000000-0000-4000-8000-${String(++this.counter).padStart(12, "0")}`;
  }
}

class FakeClock implements Clock {
  now(): Date {
    return new Date("2024-01-01T00:00:00Z");
  }
}

describe("CreateCategoryUseCase", () => {
  let useCase: CreateCategoryUseCase;
  let categoryRepo: FakeCategoryRepository;
  let groupRepo: FakeCategoryGroupRepository;
  let idGenerator: FakeIdGenerator;
  let clock: FakeClock;
  const USER_ID = "00000000-0000-4000-8000-000000000101" as UserId;
  const OTHER_USER_ID = "00000000-0000-4000-8000-000000000999" as UserId;

  beforeEach(() => {
    categoryRepo = new FakeCategoryRepository();
    groupRepo = new FakeCategoryGroupRepository();
    idGenerator = new FakeIdGenerator();
    clock = new FakeClock();
    useCase = new CreateCategoryUseCase(
      categoryRepo,
      groupRepo,
      idGenerator,
      clock,
    );
  });

  describe("category group user ownership validation", () => {
    it("should throw CategoryGroupNotFoundError if group does not exist", async () => {
      const groupId = categoryGroupIdFromString(
        "00000000-0000-4000-8000-000000000201",
      );

      await expect(
        useCase.execute({
          userId: USER_ID,
          name: "Groceries",
          categoryGroupId: groupId,
        }),
      ).rejects.toThrow(CategoryGroupNotFoundError);
    });

    it("should throw CategoryGroupNotFoundError if group belongs to another user", async () => {
      const groupId = categoryGroupIdFromString(
        "00000000-0000-4000-8000-000000000201",
      );

      // Create group for other user
      await groupRepo.addGroup({
        id: groupId,
        userId: OTHER_USER_ID,
        name: "Other User Group",
        kind: "expense",
        idealPercentageBasisPoints: 5000,
        sortOrder: 0,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        useCase.execute({
          userId: USER_ID,
          name: "Groceries",
          categoryGroupId: groupId,
        }),
      ).rejects.toThrow(CategoryGroupNotFoundError);
    });

    it("should succeed if group belongs to the user", async () => {
      const groupId = categoryGroupIdFromString(
        "00000000-0000-4000-8000-000000000201",
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

      const result = await useCase.execute({
        userId: USER_ID,
        name: "Groceries",
        categoryGroupId: groupId,
      });

      expect(result.name).toBe("Groceries");
      expect(result.categoryGroupId).toBe(groupId);
    });
  });

  describe("parent category validation", () => {
    let groupId: CategoryGroupId;

    beforeEach(async () => {
      groupId = categoryGroupIdFromString(
        "00000000-0000-4000-8000-000000000201",
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
    });

    it("should throw InvalidParentCategoryError if parent does not exist", async () => {
      const parentId = categoryIdFromString(
        "00000000-0000-4000-8000-000000000301",
      );

      await expect(
        useCase.execute({
          userId: USER_ID,
          name: "Sub Category",
          categoryGroupId: groupId,
          parentId: parentId,
        }),
      ).rejects.toThrow(InvalidParentCategoryError);
    });

    it("should throw InvalidParentCategoryError if parent belongs to another user", async () => {
      const parentId = categoryIdFromString(
        "00000000-0000-4000-8000-000000000301",
      );

      // Create parent for other user
      await categoryRepo.addCategory({
        id: parentId,
        userId: OTHER_USER_ID,
        name: "Other Parent",
        parentId: null,
        categoryGroupId: groupId,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        useCase.execute({
          userId: USER_ID,
          name: "Sub Category",
          categoryGroupId: groupId,
          parentId: parentId,
        }),
      ).rejects.toThrow(InvalidParentCategoryError);
    });

    it("should throw InvalidParentCategoryError if parent is in different category group", async () => {
      const otherGroupId = categoryGroupIdFromString(
        "00000000-0000-4000-8000-000000000202",
      );
      const parentId = categoryIdFromString(
        "00000000-0000-4000-8000-000000000301",
      );

      // Create other group
      await groupRepo.addGroup({
        id: otherGroupId,
        userId: USER_ID,
        name: "Wants",
        kind: "expense",
        idealPercentageBasisPoints: 3000,
        sortOrder: 1,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create parent in other group
      await categoryRepo.addCategory({
        id: parentId,
        userId: USER_ID,
        name: "Entertainment",
        parentId: null,
        categoryGroupId: otherGroupId,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        useCase.execute({
          userId: USER_ID,
          name: "Movies",
          categoryGroupId: groupId,
          parentId: parentId,
        }),
      ).rejects.toThrow(InvalidParentCategoryError);
    });

    it("should throw InvalidParentCategoryError if parent is archived", async () => {
      const parentId = categoryIdFromString(
        "00000000-0000-4000-8000-000000000301",
      );

      // Create archived parent
      await categoryRepo.addCategory({
        id: parentId,
        userId: USER_ID,
        name: "Archived Parent",
        parentId: null,
        categoryGroupId: groupId,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      });

      await expect(
        useCase.execute({
          userId: USER_ID,
          name: "Sub Category",
          categoryGroupId: groupId,
          parentId: parentId,
        }),
      ).rejects.toThrow(InvalidParentCategoryError);
    });

    it("should succeed if parent exists and matches group", async () => {
      const parentId = categoryIdFromString(
        "00000000-0000-4000-8000-000000000301",
      );

      await categoryRepo.addCategory({
        id: parentId,
        userId: USER_ID,
        name: "Housing",
        parentId: null,
        categoryGroupId: groupId,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await useCase.execute({
        userId: USER_ID,
        name: "Rent",
        categoryGroupId: groupId,
        parentId: parentId,
      });

      expect(result.name).toBe("Rent");
      expect(result.parentId).toBe(parentId);
    });
  });

  describe("category name validation", () => {
    let groupId: CategoryGroupId;

    beforeEach(async () => {
      groupId = categoryGroupIdFromString(
        "00000000-0000-4000-8000-000000000201",
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
    });

    it("should throw error for empty name", async () => {
      await expect(
        useCase.execute({
          userId: USER_ID,
          name: "",
          categoryGroupId: groupId,
        }),
      ).rejects.toThrow("Category name cannot be empty");
    });

    it("should throw error for whitespace-only name", async () => {
      await expect(
        useCase.execute({
          userId: USER_ID,
          name: "   ",
          categoryGroupId: groupId,
        }),
      ).rejects.toThrow("Category name cannot be empty");
    });

    it("should throw error for name exceeding 100 characters", async () => {
      const longName = "a".repeat(101);
      await expect(
        useCase.execute({
          userId: USER_ID,
          name: longName,
          categoryGroupId: groupId,
        }),
      ).rejects.toThrow("Category name cannot exceed 100 characters");
    });

    it("should trim whitespace from name", async () => {
      const result = await useCase.execute({
        userId: USER_ID,
        name: "  Groceries  ",
        categoryGroupId: groupId,
      });

      expect(result.name).toBe("Groceries");
    });
  });

  describe("duplicate category name validation", () => {
    let groupId: CategoryGroupId;
    let otherGroupId: CategoryGroupId;

    beforeEach(async () => {
      groupId = categoryGroupIdFromString(
        "00000000-0000-4000-8000-000000000201",
      );
      otherGroupId = categoryGroupIdFromString(
        "00000000-0000-4000-8000-000000000202",
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

      await groupRepo.addGroup({
        id: otherGroupId,
        userId: USER_ID,
        name: "Wants",
        kind: "expense",
        idealPercentageBasisPoints: 3000,
        sortOrder: 1,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it("should throw DuplicateCategoryNameError if active category with same name exists in same group with same parent", async () => {
      // Create first category
      await useCase.execute({
        userId: USER_ID,
        name: "Groceries",
        categoryGroupId: groupId,
      });

      // Try to create duplicate
      await expect(
        useCase.execute({
          userId: USER_ID,
          name: "Groceries",
          categoryGroupId: groupId,
        }),
      ).rejects.toThrow(DuplicateCategoryNameError);
    });

    it("should throw DuplicateCategoryNameError for case-insensitive duplicate", async () => {
      // Create first category
      await useCase.execute({
        userId: USER_ID,
        name: "Groceries",
        categoryGroupId: groupId,
      });

      // Try to create with different case (should still fail as names are compared case-insensitively)
      await expect(
        useCase.execute({
          userId: USER_ID,
          name: "groceries",
          categoryGroupId: groupId,
        }),
      ).rejects.toThrow(DuplicateCategoryNameError);
    });

    it("should allow same name in different category group", async () => {
      // Create category in first group
      await useCase.execute({
        userId: USER_ID,
        name: "Groceries",
        categoryGroupId: groupId,
      });

      // Create category with same name in different group (should succeed)
      const result = await useCase.execute({
        userId: USER_ID,
        name: "Groceries",
        categoryGroupId: otherGroupId,
      });

      expect(result.name).toBe("Groceries");
      expect(result.categoryGroupId).toBe(otherGroupId);
    });

    it("should allow same name with different parent", async () => {
      // Create two parent categories
      const parent1Id = categoryIdFromString(
        "00000000-0000-4000-8000-000000000301",
      );
      const parent2Id = categoryIdFromString(
        "00000000-0000-4000-8000-000000000302",
      );

      await categoryRepo.addCategory({
        id: parent1Id,
        userId: USER_ID,
        name: "Parent 1",
        parentId: null,
        categoryGroupId: groupId,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await categoryRepo.addCategory({
        id: parent2Id,
        userId: USER_ID,
        name: "Parent 2",
        parentId: null,
        categoryGroupId: groupId,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create child category under parent1
      await useCase.execute({
        userId: USER_ID,
        name: "Child",
        categoryGroupId: groupId,
        parentId: parent1Id,
      });

      // Create child category with same name under parent2 (should succeed)
      const result = await useCase.execute({
        userId: USER_ID,
        name: "Child",
        categoryGroupId: groupId,
        parentId: parent2Id,
      });

      expect(result.name).toBe("Child");
      expect(result.parentId).toBe(parent2Id);
    });

    it("should allow creating category with same name if existing is archived", async () => {
      // Create first category
      const result1 = await useCase.execute({
        userId: USER_ID,
        name: "Groceries",
        categoryGroupId: groupId,
      });

      // Archive the category (simulate by setting deletedAt)
      const savedCategory = await categoryRepo.findById(USER_ID, result1.id);
      if (savedCategory) {
        savedCategory.deletedAt = new Date();
        await categoryRepo.save(savedCategory);
      }

      // Create category with same name (should succeed as existing one is archived)
      const result2 = await useCase.execute({
        userId: USER_ID,
        name: "Groceries",
        categoryGroupId: groupId,
      });

      expect(result2.name).toBe("Groceries");
    });

    it("should allow creating root category with same name as child category", async () => {
      // Create a parent category
      const parentId = categoryIdFromString(
        "00000000-0000-4000-8000-000000000301",
      );
      await categoryRepo.addCategory({
        id: parentId,
        userId: USER_ID,
        name: "Housing",
        parentId: null,
        categoryGroupId: groupId,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create child category
      await useCase.execute({
        userId: USER_ID,
        name: "Insurance",
        categoryGroupId: groupId,
        parentId: parentId,
      });

      // Create root category with same name (should succeed - different parent)
      const result = await useCase.execute({
        userId: USER_ID,
        name: "Insurance",
        categoryGroupId: groupId,
      });

      expect(result.name).toBe("Insurance");
      expect(result.parentId).toBeNull();
    });
  });
});
