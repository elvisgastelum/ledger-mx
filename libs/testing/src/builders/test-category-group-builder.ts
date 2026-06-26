import {
  CategoryGroupBuilder as DomainCategoryGroupBuilder,
  CategoryGroup,
  CategoryGroupId,
  UserId,
  CategoryGroupKind,
  OwnershipType,
} from "@ledger-mx/domain";
import {
  testUserId,
  testCategoryGroupId,
} from "./test-ids";

/**
 * Test-only CategoryGroupBuilder with safe defaults.
 */
export class TestCategoryGroupBuilder {
  private builder = new DomainCategoryGroupBuilder();

  constructor() {
    // Set sensible defaults
    this.builder
      .withId(testCategoryGroupId())
      .withUserId(testUserId())
      .withName("Test Category Group")
      .withKind("expense")
      .withIdealPercentageBasisPoints(5000) // 50%
      .withSortOrder(0)
      .withCreatedAt(new Date("2024-01-15T00:00:00.000Z"))
      .withUpdatedAt(new Date("2024-01-15T00:00:00.000Z"))
      .withOwnership("user");
  }

  withId(id: CategoryGroupId): this {
    this.builder.withId(id);
    return this;
  }

  withUserId(userId: UserId): this {
    this.builder.withUserId(userId);
    return this;
  }

  withName(name: string): this {
    this.builder.withName(name);
    return this;
  }

  withKind(kind: CategoryGroupKind): this {
    this.builder.withKind(kind);
    return this;
  }

  withIdealPercentageBasisPoints(idealPercentageBasisPoints: number | null): this {
    this.builder.withIdealPercentageBasisPoints(idealPercentageBasisPoints);
    return this;
  }

  withSortOrder(sortOrder: number): this {
    this.builder.withSortOrder(sortOrder);
    return this;
  }

  withCreatedAt(createdAt: Date): this {
    this.builder.withCreatedAt(createdAt);
    return this;
  }

  withUpdatedAt(updatedAt: Date): this {
    this.builder.withUpdatedAt(updatedAt);
    return this;
  }

  withDeletedAt(deletedAt: Date | null): this {
    this.builder.withDeletedAt(deletedAt);
    return this;
  }

  withOwnership(ownership: OwnershipType): this {
    this.builder.withOwnership(ownership);
    return this;
  }

  build(): CategoryGroup {
    return this.builder.build();
  }
}
