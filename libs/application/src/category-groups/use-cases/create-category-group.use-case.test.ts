import { describe, it, expect, beforeEach } from "vitest";
import { CreateCategoryGroupUseCase } from "./create-category-group.use-case";
import type {
  CategoryGroupRepository,
  CategoryGroup,
  UserId,
  CategoryGroupId,
} from "@ledger-mx/domain";
import type { IdGenerator } from "../../auth/ports/id-generator.port";
import type { Clock } from "../../auth/ports/clock.port";
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

describe("CreateCategoryGroupUseCase", () => {
  let useCase: CreateCategoryGroupUseCase;
  let repo: FakeCategoryGroupRepository;
  let idGenerator: FakeIdGenerator;
  let clock: FakeClock;

  beforeEach(() => {
    repo = new FakeCategoryGroupRepository();
    idGenerator = new FakeIdGenerator();
    clock = new FakeClock();
    useCase = new CreateCategoryGroupUseCase(repo, idGenerator, clock);
  });

  it("should save a group with generated id, userId, name, kind, idealPercentageBasisPoints, sortOrder, ownership default user, timestamps", async () => {
    const result = await useCase.execute({
      userId: "00000000-0000-4000-8000-000000000101" as UserId,
      name: "  Needs  ",
      kind: "expense",
      idealPercentageBasisPoints: 5000,
      sortOrder: 1,
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe("Needs");
    expect(result.kind).toBe("expense");
    expect(result.idealPercentageBasisPoints).toBe(5000);
    expect(result.sortOrder).toBe(1);
    expect(result.ownership).toBe("user");
    expect(result.createdAt).toEqual(new Date("2024-01-01T00:00:00Z"));
    expect(result.updatedAt).toEqual(new Date("2024-01-01T00:00:00Z"));

    // Verify saved in repository
    const saved = await repo.findById(
      "00000000-0000-4000-8000-000000000101" as UserId,
      categoryGroupIdFromString(result.id),
    );
    expect(saved).toBeDefined();
    expect(saved?.name).toBe("Needs");
  });

  it("should use defaults for optional fields", async () => {
    const result = await useCase.execute({
      userId: "00000000-0000-4000-8000-000000000101" as UserId,
      name: "General",
      kind: "expense",
    });

    expect(result.idealPercentageBasisPoints).toBeNull();
    expect(result.sortOrder).toBe(0);
    expect(result.ownership).toBe("user");
  });
});
