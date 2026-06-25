import { describe, it, expect, beforeEach } from "vitest";
import { UpdateCategoryGroupUseCase } from "./update-category-group.use-case";
import type {
  CategoryGroupRepository,
  CategoryGroup,
  UserId,
  CategoryGroupId,
} from "@ledger-mx/domain";
import type { Clock } from "../../auth/ports/clock.port";
import { categoryGroupIdFromString } from "@ledger-mx/domain";
import {
  CategoryGroupNotFoundError,
  SystemCategoryGroupModificationError,
} from "../category-group.errors";

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
}

class FakeClock implements Clock {
  now(): Date {
    return new Date("2024-06-15T00:00:00Z");
  }
}

describe("UpdateCategoryGroupUseCase", () => {
  let useCase: UpdateCategoryGroupUseCase;
  let repo: FakeCategoryGroupRepository;
  let clock: FakeClock;
  const userId = "00000000-0000-4000-8000-000000000101" as UserId;
  const groupId = categoryGroupIdFromString(
    "00000000-0000-4000-8000-000000000001",
  );

  beforeEach(() => {
    repo = new FakeCategoryGroupRepository();
    clock = new FakeClock();
    useCase = new UpdateCategoryGroupUseCase(repo, clock);
  });

  it("should throw if group not found", async () => {
    await expect(
      useCase.execute({
        userId,
        id: groupId,
        name: "Updated",
      }),
    ).rejects.toThrow(CategoryGroupNotFoundError);
  });

  it("should throw if system group", async () => {
    await repo.save({
      id: groupId,
      userId,
      name: "System Group",
      kind: "expense",
      idealPercentageBasisPoints: 5000,
      sortOrder: 0,
      ownership: "system",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });

    await expect(
      useCase.execute({
        userId,
        id: groupId,
        name: "Updated",
      }),
    ).rejects.toThrow(SystemCategoryGroupModificationError);
  });

  it("should update normal mutable fields and updatedAt", async () => {
    await repo.save({
      id: groupId,
      userId,
      name: "Original",
      kind: "expense",
      idealPercentageBasisPoints: 5000,
      sortOrder: 0,
      ownership: "user",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });

    const result = await useCase.execute({
      userId,
      id: groupId,
      name: "Updated",
      kind: "income",
      idealPercentageBasisPoints: null,
      sortOrder: 5,
    });

    expect(result.name).toBe("Updated");
    expect(result.kind).toBe("income");
    expect(result.idealPercentageBasisPoints).toBeNull();
    expect(result.sortOrder).toBe(5);
    expect(result.updatedAt).toEqual(new Date("2024-06-15T00:00:00Z"));
    expect(result.createdAt).toEqual(new Date("2024-01-01")); // unchanged
    expect(result.ownership).toBe("user");
  });

  it("should trim name when updating", async () => {
    await repo.save({
      id: groupId,
      userId,
      name: "Original",
      kind: "expense",
      idealPercentageBasisPoints: null,
      sortOrder: 0,
      ownership: "user",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });

    const result = await useCase.execute({
      userId,
      id: groupId,
      name: "  Trimmed  ",
    });

    expect(result.name).toBe("Trimmed");
  });
});
