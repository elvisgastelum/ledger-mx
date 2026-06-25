import { describe, it, expect, beforeEach } from "vitest";
import { ApplyDefaultCategoryGroupLayoutUseCase } from "./apply-default-category-group-layout.use-case";
import type {
  CategoryGroupRepository,
  CategoryGroup,
  UserId,
  CategoryGroupId,
} from "@ledger-mx/domain";
import type { IdGenerator } from "../../auth/ports/id-generator.port";
import type { Clock } from "../../auth/ports/clock.port";
import { categoryGroupIdFromString } from "@ledger-mx/domain";
import { CategoryGroupLayoutConflictError } from "../onboarding.errors";

// In-memory fake repository
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
  let repo: FakeCategoryGroupRepository;
  let idGenerator: FakeIdGenerator;
  let clock: FakeClock;
  const USER_ID = "00000000-0000-4000-8000-000000000101" as UserId;

  beforeEach(() => {
    repo = new FakeCategoryGroupRepository();
    idGenerator = new FakeIdGenerator();
    clock = new FakeClock();
    useCase = new ApplyDefaultCategoryGroupLayoutUseCase(
      repo,
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
  });

  describe("conflict detection", () => {
    it("should throw CategoryGroupLayoutConflictError if existing groups don't match layout", async () => {
      // Pre-populate with a non-system group
      await repo.addGroup({
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
      await repo.addGroup({
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
      await repo.addGroup({
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
      await repo.addGroup({
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
  });
});
