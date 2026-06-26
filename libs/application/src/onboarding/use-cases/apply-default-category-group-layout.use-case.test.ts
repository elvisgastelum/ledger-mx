import { describe, it, expect, beforeEach } from "vitest";
import { ApplyDefaultCategoryGroupLayoutUseCase } from "./apply-default-category-group-layout.use-case";
import type {
  CategoryGroupRepository,
  CategoryGroup,
  CategoryRepository,
  Category,
  UserId,
  CategoryGroupId,
  CategoryId,
} from "@ledger-mx/domain";
import type { IdGenerator } from "../../auth/ports/id-generator.port";
import type { Clock } from "../../auth/ports/clock.port";
import {
  categoryGroupIdFromString,
  categoryIdFromString,
} from "@ledger-mx/domain";
import { CategoryGroupLayoutConflictError } from "../onboarding.errors";

// In-memory fake repository for CategoryGroup
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
    return Array.from(this.groups.values())
      .filter((g) => g.userId === userId && !g.deletedAt)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async hasActiveCategories(): Promise<boolean> {
    return false;
  }

  async softDelete(): Promise<void> {}

  reset() {
    this.groups.clear();
  }

  // Helper to pre-populate groups
  async addGroup(group: CategoryGroup): Promise<void> {
    await this.save(group);
  }
}

// In-memory fake repository for Category
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

  // Helper to pre-populate categories
  async addCategory(category: Category): Promise<void> {
    await this.save(category);
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

describe("ApplyDefaultCategoryGroupLayoutUseCase", () => {
  let useCase: ApplyDefaultCategoryGroupLayoutUseCase;
  let groupRepo: FakeCategoryGroupRepository;
  let categoryRepo: FakeCategoryRepository;
  let idGenerator: FakeIdGenerator;
  let clock: FakeClock;
  const USER_ID = "00000000-0000-4000-8000-000000000101" as UserId;

  beforeEach(() => {
    groupRepo = new FakeCategoryGroupRepository();
    categoryRepo = new FakeCategoryRepository();
    idGenerator = new FakeIdGenerator();
    clock = new FakeClock();
    useCase = new ApplyDefaultCategoryGroupLayoutUseCase(
      groupRepo,
      categoryRepo,
      idGenerator,
      clock,
    );
  });

  describe("blank layout", () => {
    it("should create General group with kind=general and null percentage", async () => {
      const result = await useCase.execute({
        userId: USER_ID,
        layout: "blank",
      });

      expect(result.created).toBe(true);
      expect(result.categoryGroups).toHaveLength(1);

      const group = result.categoryGroups[0];
      expect(group.name).toBe("General");
      expect(group.kind).toBe("general");
      expect(group.idealPercentageBasisPoints).toBeNull();
      expect(group.ownership).toBe("system");
      expect(group.sortOrder).toBe(0);
    });

    it("should seed default Uncategorized category under General group", async () => {
      const result = await useCase.execute({
        userId: USER_ID,
        layout: "blank",
      });

      expect(result.created).toBe(true);

      // Check that categories were created
      const categories = await categoryRepo.listByUserId(
        USER_ID,
        result.categoryGroups[0].id as CategoryGroupId,
      );

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe("Uncategorized");
      expect(categories[0].ownership).toBe("system");
    });

    it("should be idempotent - return existing groups on repeated call", async () => {
      // First call creates
      const result1 = await useCase.execute({
        userId: USER_ID,
        layout: "blank",
      });

      expect(result1.created).toBe(true);

      // Second call should return existing (created=false)
      const result2 = await useCase.execute({
        userId: USER_ID,
        layout: "blank",
      });

      expect(result2.created).toBe(false);
      expect(result2.categoryGroups).toHaveLength(1);
      expect(result2.categoryGroups[0].id).toBe(result1.categoryGroups[0].id);
    });

    it("should be idempotent with categories - not duplicate on repeated call", async () => {
      // First call creates
      await useCase.execute({
        userId: USER_ID,
        layout: "blank",
      });

      // Second call should not create duplicate categories
      await useCase.execute({
        userId: USER_ID,
        layout: "blank",
      });

      const groups = await groupRepo.listByUserId(USER_ID);
      const categories = await categoryRepo.listByUserId(USER_ID, groups[0].id);

      // Should only have 1 Uncategorized category
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe("Uncategorized");
    });
  });

  describe("50-30-20 layout", () => {
    it("should create Need (5000), Want (3000), Savings (2000) groups", async () => {
      const result = await useCase.execute({
        userId: USER_ID,
        layout: "50-30-20",
      });

      expect(result.created).toBe(true);
      expect(result.categoryGroups).toHaveLength(3);

      const need = result.categoryGroups[0];
      expect(need.name).toBe("Needs");
      expect(need.kind).toBe("expense");
      expect(need.idealPercentageBasisPoints).toBe(5000);
      expect(need.ownership).toBe("system");
      expect(need.sortOrder).toBe(0);

      const want = result.categoryGroups[1];
      expect(want.name).toBe("Wants");
      expect(want.kind).toBe("expense");
      expect(want.idealPercentageBasisPoints).toBe(3000);
      expect(want.ownership).toBe("system");
      expect(want.sortOrder).toBe(1);

      const savings = result.categoryGroups[2];
      expect(savings.name).toBe("Savings");
      expect(savings.kind).toBe("savings");
      expect(savings.idealPercentageBasisPoints).toBe(2000);
      expect(savings.ownership).toBe("system");
      expect(savings.sortOrder).toBe(2);
    });

    it("should seed default categories for all groups", async () => {
      const result = await useCase.execute({
        userId: USER_ID,
        layout: "50-30-20",
      });

      expect(result.created).toBe(true);

      // Check categories for each group
      for (const group of result.categoryGroups) {
        const categories = await categoryRepo.listByUserId(
          USER_ID,
          group.id as CategoryGroupId,
        );

        expect(categories.length).toBeGreaterThan(0);

        // All should be system ownership
        for (const cat of categories) {
          expect(cat.ownership).toBe("system");
        }
      }

      // Verify specific parent/child relationships
      const needsGroup = result.categoryGroups.find((g) => g.name === "Needs");
      expect(needsGroup).toBeDefined();

      const needsCategories = await categoryRepo.listByUserId(
        USER_ID,
        needsGroup!.id as CategoryGroupId,
      );

      // Should have parent categories like Housing, Transportation, etc.
      const parentCategories = needsCategories.filter((c) => !c.parentId);
      expect(parentCategories.length).toBeGreaterThan(0);

      // Should have child categories
      const childCategories = needsCategories.filter((c) => c.parentId);
      expect(childCategories.length).toBeGreaterThan(0);
    });

    it("should be idempotent - return existing groups on repeated call", async () => {
      // First call creates
      const result1 = await useCase.execute({
        userId: USER_ID,
        layout: "50-30-20",
      });

      expect(result1.created).toBe(true);

      // Second call should return existing (created=false)
      const result2 = await useCase.execute({
        userId: USER_ID,
        layout: "50-30-20",
      });

      expect(result2.created).toBe(false);
      expect(result2.categoryGroups).toHaveLength(3);
    });

    it("should be idempotent with categories - not duplicate on repeated call", async () => {
      // First call creates
      const result1 = await useCase.execute({
        userId: USER_ID,
        layout: "50-30-20",
      });

      // Count categories after first call
      let totalCategories = 0;
      for (const group of result1.categoryGroups) {
        const cats = await categoryRepo.listByUserId(
          USER_ID,
          group.id as CategoryGroupId,
        );
        totalCategories += cats.length;
      }

      // Second call
      await useCase.execute({
        userId: USER_ID,
        layout: "50-30-20",
      });

      // Count categories after second call
      let totalCategoriesAfter = 0;
      for (const group of result1.categoryGroups) {
        const cats = await categoryRepo.listByUserId(
          USER_ID,
          group.id as CategoryGroupId,
        );
        totalCategoriesAfter += cats.length;
      }

      // Should be the same (no duplicates)
      expect(totalCategoriesAfter).toBe(totalCategories);
    });

    it("should handle partial seed - create only missing children for existing parents", async () => {
      // First, create the groups manually but only some categories
      const result1 = await useCase.execute({
        userId: USER_ID,
        layout: "50-30-20",
      });

      // Get the Needs group
      const needsGroup = result1.categoryGroups.find((g) => g.name === "Needs");
      expect(needsGroup).toBeDefined();

      // Manually delete some child categories to simulate partial seed
      const categories = await categoryRepo.listByUserId(
        USER_ID,
        needsGroup!.id as CategoryGroupId,
      );

      const childCategory = categories.find(
        (c) => c.parentId && c.name === "Rent/Mortgage",
      );
      expect(childCategory).toBeDefined();

      // Delete the child category (simulating partial state)
      if (childCategory) {
        await categoryRepo.softDelete(USER_ID, childCategory.id, new Date());
      }

      // Re-run the use case - should recreate missing child
      await useCase.execute({
        userId: USER_ID,
        layout: "50-30-20",
      });

      // Check that the child category exists again
      const categoriesAfter = await categoryRepo.listByUserId(
        USER_ID,
        needsGroup!.id as CategoryGroupId,
      );

      const rentCategory = categoriesAfter.find(
        (c) => c.name === "Rent/Mortgage",
      );
      expect(rentCategory).toBeDefined();
      expect(rentCategory!.parentId).toBeDefined();
    });
  });

  describe("conflict detection", () => {
    it("should throw CategoryGroupLayoutConflictError if existing groups don't match layout", async () => {
      // Pre-populate with a non-system group
      await groupRepo.addGroup({
        id: categoryGroupIdFromString("00000000-0000-4000-8000-000000000201"),
        userId: USER_ID,
        name: "Custom Group",
        kind: "expense",
        idealPercentageBasisPoints: 10000,
        sortOrder: 0,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        useCase.execute({
          userId: USER_ID,
          layout: "blank",
        }),
      ).rejects.toThrow(CategoryGroupLayoutConflictError);
    });

    it("should throw CategoryGroupLayoutConflictError if existing system groups are different", async () => {
      // Pre-populate with a different system group
      await groupRepo.addGroup({
        id: categoryGroupIdFromString("00000000-0000-4000-8000-000000000201"),
        userId: USER_ID,
        name: "Different",
        kind: "expense",
        idealPercentageBasisPoints: 10000,
        sortOrder: 0,
        ownership: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        useCase.execute({
          userId: USER_ID,
          layout: "blank",
        }),
      ).rejects.toThrow(CategoryGroupLayoutConflictError);
    });

    it("should throw conflict if user has extra active groups beyond the default set", async () => {
      // Create the default blank layout groups
      await useCase.execute({
        userId: USER_ID,
        layout: "blank",
      });

      // Add an extra non-system group
      await groupRepo.addGroup({
        id: categoryGroupIdFromString("00000000-0000-4000-8000-000000000201"),
        userId: USER_ID,
        name: "Extra Group",
        kind: "expense",
        idealPercentageBasisPoints: 1000,
        sortOrder: 1,
        ownership: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Trying to apply same layout again should conflict due to extra groups
      await expect(
        useCase.execute({
          userId: USER_ID,
          layout: "blank",
        }),
      ).rejects.toThrow(CategoryGroupLayoutConflictError);
    });

    it("should be idempotent when same default set is selected and no extra groups", async () => {
      // First call creates
      const result1 = await useCase.execute({
        userId: USER_ID,
        layout: "blank",
      });

      expect(result1.created).toBe(true);

      // Second call with same layout should be idempotent (no extra groups)
      const result2 = await useCase.execute({
        userId: USER_ID,
        layout: "blank",
      });

      expect(result2.created).toBe(false);
      expect(result2.categoryGroups).toHaveLength(1);
      expect(result2.categoryGroups[0].id).toBe(result1.categoryGroups[0].id);
    });
  });

  describe("user scoping", () => {
    it("should not be affected by another user's groups", async () => {
      const OTHER_USER_ID = "00000000-0000-4000-8000-000000000999" as UserId;

      // Other user has groups
      await groupRepo.addGroup({
        id: categoryGroupIdFromString("00000000-0000-4000-8000-000000000201"),
        userId: OTHER_USER_ID,
        name: "Other User Group",
        kind: "expense",
        idealPercentageBasisPoints: 10000,
        sortOrder: 0,
        ownership: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Current user should still be able to create layout
      const result = await useCase.execute({
        userId: USER_ID,
        layout: "blank",
      });

      expect(result.created).toBe(true);
      expect(result.categoryGroups).toHaveLength(1);
      expect(result.categoryGroups[0].name).toBe("General");
    });

    it("should not be affected by another user's categories", async () => {
      const OTHER_USER_ID = "00000000-0000-4000-8000-000000000999" as UserId;

      // Create layout for current user
      await useCase.execute({
        userId: USER_ID,
        layout: "blank",
      });

      // Other user has categories in their own group
      const otherGroupId = categoryGroupIdFromString(
        "00000000-0000-4000-8000-000000000201",
      );
      await groupRepo.addGroup({
        id: otherGroupId,
        userId: OTHER_USER_ID,
        name: "General",
        kind: "general",
        idealPercentageBasisPoints: null,
        sortOrder: 0,
        ownership: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await categoryRepo.addCategory({
        id: categoryIdFromString("00000000-0000-4000-8000-000000000301"),
        userId: OTHER_USER_ID,
        name: "Other User Category",
        parentId: null,
        categoryGroupId: otherGroupId,
        ownership: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Current user's categories should be unaffected
      const groups = await groupRepo.listByUserId(USER_ID);
      const categories = await categoryRepo.listByUserId(USER_ID, groups[0].id);

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe("Uncategorized");
    });
  });
});
