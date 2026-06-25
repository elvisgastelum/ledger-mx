import { describe, it, expect, beforeEach } from "vitest";
import { ListCategoryGroupsUseCase } from "./list-category-groups.use-case";
import type {
  CategoryGroupRepository,
  CategoryGroup,
  UserId,
  CategoryGroupId,
} from "@ledger-mx/domain";
import { categoryGroupIdFromString } from "@ledger-mx/domain";

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

describe("ListCategoryGroupsUseCase", () => {
  let useCase: ListCategoryGroupsUseCase;
  let repo: FakeCategoryGroupRepository;

  beforeEach(() => {
    repo = new FakeCategoryGroupRepository();
    useCase = new ListCategoryGroupsUseCase(repo);
  });

  it("should return user-scoped groups sorted as repository returns", async () => {
    const user1Id = "00000000-0000-4000-8000-000000000101" as UserId;
    const user2Id = "00000000-0000-4000-8000-000000000102" as UserId;

    // Add groups for user 1
    await repo.save({
      id: categoryGroupIdFromString("00000000-0000-4000-8000-000000000001"),
      userId: user1Id,
      name: "Needs",
      kind: "expense",
      idealPercentageBasisPoints: 5000,
      sortOrder: 2,
      ownership: "user",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });

    await repo.save({
      id: categoryGroupIdFromString("00000000-0000-4000-8000-000000000002"),
      userId: user1Id,
      name: "Wants",
      kind: "expense",
      idealPercentageBasisPoints: 3000,
      sortOrder: 1,
      ownership: "user",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });

    // Add group for user 2 (should not be returned)
    await repo.save({
      id: categoryGroupIdFromString("00000000-0000-4000-8000-000000000003"),
      userId: user2Id,
      name: "Income",
      kind: "income",
      idealPercentageBasisPoints: null,
      sortOrder: 0,
      ownership: "user",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });

    const result = await useCase.execute({ userId: user1Id });

    expect(result.categoryGroups).toHaveLength(2);
    // Should be sorted by sortOrder
    expect(result.categoryGroups[0].name).toBe("Wants");
    expect(result.categoryGroups[1].name).toBe("Needs");
    // Should not include user 2's group
    expect(
      result.categoryGroups.find((g) => g.name === "Income"),
    ).toBeUndefined();
  });

  it("should return empty array when user has no groups", async () => {
    const result = await useCase.execute({
      userId: "00000000-0000-4000-8000-000000000101" as UserId,
    });

    expect(result.categoryGroups).toHaveLength(0);
  });
});
