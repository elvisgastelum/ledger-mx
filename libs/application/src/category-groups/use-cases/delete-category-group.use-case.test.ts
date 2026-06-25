import { describe, it, expect, beforeEach } from "vitest";
import { DeleteCategoryGroupUseCase } from "./delete-category-group.use-case";
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
  CategoryGroupHasActiveCategoriesError,
} from "../category-group.errors";

// In-memory fake repository
class FakeCategoryGroupRepository implements CategoryGroupRepository {
  private groups: Map<string, CategoryGroup> = new Map();
  private activeCategories = new Map<string, boolean>();

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

  async hasActiveCategories(
    userId: UserId,
    groupId: CategoryGroupId,
  ): Promise<boolean> {
    return this.activeCategories.get(`${userId}:${groupId}`) ?? false;
  }

  async softDelete(
    userId: UserId,
    groupId: CategoryGroupId,
    deletedAt: Date,
  ): Promise<void> {
    const group = this.groups.get(`${userId}:${groupId}`);
    if (group) {
      group.deletedAt = deletedAt;
    }
  }

  setHasActiveCategories(
    userId: UserId,
    groupId: CategoryGroupId,
    has: boolean,
  ) {
    this.activeCategories.set(`${userId}:${groupId}`, has);
  }

  reset() {
    this.groups.clear();
    this.activeCategories.clear();
  }
}

class FakeClock implements Clock {
  now(): Date {
    return new Date("2024-06-15T00:00:00Z");
  }
}

describe("DeleteCategoryGroupUseCase", () => {
  let useCase: DeleteCategoryGroupUseCase;
  let repo: FakeCategoryGroupRepository;
  let clock: FakeClock;
  const userId = "00000000-0000-4000-8000-000000000101" as UserId;
  const groupId = categoryGroupIdFromString(
    "00000000-0000-4000-8000-000000000001",
  );

  beforeEach(() => {
    repo = new FakeCategoryGroupRepository();
    clock = new FakeClock();
    useCase = new DeleteCategoryGroupUseCase(repo, clock);
  });

  it("should throw if group not found", async () => {
    await expect(
      useCase.execute({
        userId,
        id: groupId,
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
      }),
    ).rejects.toThrow(SystemCategoryGroupModificationError);
  });

  it("should throw if active categories exist", async () => {
    await repo.save({
      id: groupId,
      userId,
      name: "Group with Categories",
      kind: "expense",
      idealPercentageBasisPoints: 5000,
      sortOrder: 0,
      ownership: "user",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });

    repo.setHasActiveCategories(userId, groupId, true);

    await expect(
      useCase.execute({
        userId,
        id: groupId,
      }),
    ).rejects.toThrow(CategoryGroupHasActiveCategoriesError);
  });

  it("should soft delete normal group", async () => {
    await repo.save({
      id: groupId,
      userId,
      name: "Deletable Group",
      kind: "expense",
      idealPercentageBasisPoints: 5000,
      sortOrder: 0,
      ownership: "user",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });

    await useCase.execute({
      userId,
      id: groupId,
    });

    const deleted = await repo.findById(userId, groupId);
    expect(deleted?.deletedAt).toEqual(new Date("2024-06-15T00:00:00Z"));
  });
});
