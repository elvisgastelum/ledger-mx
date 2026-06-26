import { eq, and, isNull, count, inArray } from "drizzle-orm";
import type {
  Category,
  CategoryRepository,
  OwnershipType,
} from "@ledger-mx/domain";
import type { UserId, CategoryId, CategoryGroupId } from "@ledger-mx/domain";
import type { Database } from "../connection";
import { categories, transactionLines } from "../schema";

/**
 * Drizzle ORM implementation of CategoryRepository.
 */
export class DrizzleCategoryRepository implements CategoryRepository {
  constructor(private readonly db: Database) {}

  async save(category: Category): Promise<void> {
    const data = this.mapToDb(category);

    await this.db
      .insert(categories)
      .values(data)
      .onConflictDoUpdate({
        target: categories.id,
        set: {
          name: data.name,
          parentId: data.parentId,
          categoryGroupId: data.categoryGroupId,
          ownership: data.ownership,
          updatedAt: new Date(),
          deletedAt: data.deletedAt,
        },
        where: eq(categories.userId, category.userId),
      });
  }

  async findById(userId: UserId, id: CategoryId): Promise<Category | null> {
    const result = await this.db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, id),
          eq(categories.userId, userId),
          isNull(categories.deletedAt),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.mapToDomain(result[0]);
  }

  async listByUserId(
    userId: UserId,
    categoryGroupId?: CategoryGroupId,
  ): Promise<Category[]> {
    const conditions = [
      eq(categories.userId, userId),
      isNull(categories.deletedAt),
    ];

    if (categoryGroupId) {
      conditions.push(eq(categories.categoryGroupId, categoryGroupId));
    }

    const result = await this.db
      .select()
      .from(categories)
      .where(and(...conditions))
      .orderBy(categories.name);

    return result.map((row) => this.mapToDomain(row));
  }

  async listChildren(
    userId: UserId,
    parentId: CategoryId,
  ): Promise<Category[]> {
    const result = await this.db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.userId, userId),
          eq(categories.parentId, parentId),
          isNull(categories.deletedAt),
        ),
      )
      .orderBy(categories.name);

    return result.map((row) => this.mapToDomain(row));
  }

  async hasTransactionLines(
    userId: UserId,
    categoryId: CategoryId,
  ): Promise<boolean> {
    const result = await this.db
      .select({ count: count() })
      .from(transactionLines)
      .where(
        and(
          eq(transactionLines.userId, userId),
          eq(transactionLines.categoryId, categoryId),
          isNull(transactionLines.deletedAt),
        ),
      );

    return (result[0]?.count ?? 0) > 0;
  }

  async countTransactionLines(
    userId: UserId,
    categoryIds?: CategoryId[],
  ): Promise<Map<CategoryId, number>> {
    const conditions = [
      eq(categories.userId, userId),
      isNull(categories.deletedAt),
      isNull(transactionLines.deletedAt),
    ];

    if (categoryIds && categoryIds.length > 0) {
      conditions.push(inArray(transactionLines.categoryId, categoryIds));
    }

    const result = await this.db
      .select({
        categoryId: transactionLines.categoryId,
        count: count(),
      })
      .from(transactionLines)
      .innerJoin(categories, eq(transactionLines.categoryId, categories.id))
      .where(and(...conditions))
      .groupBy(transactionLines.categoryId);

    const counts = new Map<CategoryId, number>();
    for (const row of result) {
      if (row.categoryId) {
        counts.set(row.categoryId as CategoryId, row.count);
      }
    }

    return counts;
  }

  async softDelete(
    userId: UserId,
    categoryId: CategoryId,
    deletedAt: Date,
  ): Promise<void> {
    await this.db
      .update(categories)
      .set({ deletedAt, updatedAt: new Date() })
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));
  }

  async hasActiveChildren(
    userId: UserId,
    parentId: CategoryId,
  ): Promise<boolean> {
    const result = await this.db
      .select({ count: count() })
      .from(categories)
      .where(
        and(
          eq(categories.userId, userId),
          eq(categories.parentId, parentId),
          isNull(categories.deletedAt),
        ),
      );

    return (result[0]?.count ?? 0) > 0;
  }

  private mapToDomain(row: typeof categories.$inferSelect): Category {
    return {
      id: row.id as CategoryId,
      userId: row.userId as UserId,
      name: row.name,
      parentId: row.parentId as CategoryId | null,
      categoryGroupId: row.categoryGroupId as CategoryGroupId,
      ownership: row.ownership as OwnershipType,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? undefined,
    };
  }

  private mapToDb(category: Category) {
    return {
      id: category.id,
      userId: category.userId,
      name: category.name,
      parentId: category.parentId,
      categoryGroupId: category.categoryGroupId,
      ownership: category.ownership,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      deletedAt: category.deletedAt ?? null,
    };
  }
}
