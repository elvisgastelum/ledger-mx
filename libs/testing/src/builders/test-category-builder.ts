import {
  CategoryBuilder as DomainCategoryBuilder,
  Category,
  CategoryId,
  UserId,
  CategoryGroupId,
  OwnershipType,
} from "@ledger-mx/domain";
import {
  testUserId,
  testCategoryId,
  testCategoryGroupId,
} from "./test-ids";

/**
 * Test-only CategoryBuilder with safe defaults.
 */
export class TestCategoryBuilder {
  private builder = new DomainCategoryBuilder();

  constructor() {
    // Set sensible defaults
    this.builder
      .withId(testCategoryId())
      .withUserId(testUserId())
      .withName("Test Category")
      .withParentId(null)
      .withCategoryGroupId(testCategoryGroupId())
      .withCreatedAt(new Date("2024-01-15T00:00:00.000Z"))
      .withUpdatedAt(new Date("2024-01-15T00:00:00.000Z"))
      .withOwnership("user");
  }

  withId(id: CategoryId): this {
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

  withParentId(parentId: CategoryId | null): this {
    this.builder.withParentId(parentId);
    return this;
  }

  withCategoryGroupId(categoryGroupId: CategoryGroupId): this {
    this.builder.withCategoryGroupId(categoryGroupId);
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

  build(): Category {
    return this.builder.build();
  }
}
