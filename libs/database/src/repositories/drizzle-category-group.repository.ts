import { eq, and, isNull, count } from "drizzle-orm";
import type {
  CategoryGroup,
  CategoryGroupRepository,
  OwnershipType,
} from "@ledger-mx/domain";
import type { UserId, CategoryGroupId } from "@ledger-mx/domain";
import type { Database } from "../connection";
import { categoryGroups, categories } from "../schema";

/**
 * Drizzle ORM implementation of CategoryGroupRepository.
 */
export class DrizzleCategoryGroupRepository implements CategoryGroupRepository {
  constructor(private readonly db: Database) {}

  async save(group: CategoryGroup): Promise<void> {
    const data = this.mapToDb(group);

    await this.db
      .insert(categoryGroups)
      .values(data)
      .onConflictDoUpdate({
        target: categoryGroups.id,
        set: {
          name: data.name,
          kind: data.kind,
          idealPercentageBasisPoints: data.idealPercentageBasisPoints,
          sortOrder: data.sortOrder,
          ownership: data.ownership,
          updatedAt: new Date(),
          deletedAt: data.deletedAt,
        },
        where: eq(categoryGroups.userId, group.userId),
      });
  }

  async findById(
    userId: UserId,
    id: CategoryGroupId,
  ): Promise<CategoryGroup | null> {
    const result = await this.db
      .select()
      .from(categoryGroups)
      .where(
        and(
          eq(categoryGroups.id, id),
          eq(categoryGroups.userId, userId),
          isNull(categoryGroups.deletedAt),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapToDomain(result[0]);
  }

  async listByUserId(userId: UserId): Promise<CategoryGroup[]> {
    const result = await this.db
      .select()
      .from(categoryGroups)
      .where(
        and(
          eq(categoryGroups.userId, userId),
          isNull(categoryGroups.deletedAt),
        ),
      )
      .orderBy(categoryGroups.sortOrder);

    return result.map((row) => this.mapToDomain(row));
  }

  async hasActiveCategories(
    userId: UserId,
    groupId: CategoryGroupId,
  ): Promise<boolean> {
    const result = await this.db
      .select({ count: count() })
      .from(categories)
      .where(
        and(
          eq(categories.userId, userId),
          eq(categories.categoryGroupId, groupId),
          isNull(categories.deletedAt),
        ),
      );

    return (result[0]?.count ?? 0) > 0;
  }

  async softDelete(
    userId: UserId,
    groupId: CategoryGroupId,
    deletedAt: Date,
  ): Promise<void> {
    await this.db
      .update(categoryGroups)
      .set({ deletedAt, updatedAt: new Date() })
      .where(
        and(eq(categoryGroups.id, groupId), eq(categoryGroups.userId, userId)),
      );
  }

  private mapToDomain(row: typeof categoryGroups.$inferSelect): CategoryGroup {
    return {
      id: row.id as CategoryGroupId,
      userId: row.userId as UserId,
      name: row.name,
      kind: row.kind,
      idealPercentageBasisPoints: row.idealPercentageBasisPoints,
      sortOrder: row.sortOrder,
      ownership: row.ownership as OwnershipType,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? undefined,
    };
  }

  private mapToDb(group: CategoryGroup) {
    return {
      id: group.id,
      userId: group.userId,
      name: group.name,
      kind: group.kind,
      idealPercentageBasisPoints: group.idealPercentageBasisPoints,
      sortOrder: group.sortOrder,
      ownership: group.ownership,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      deletedAt: group.deletedAt ?? null,
    };
  }
}
