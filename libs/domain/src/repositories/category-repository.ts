import type {
  UserId,
  CategoryId,
  CategoryGroupId,
} from "../value-objects/uuid";
import type { Category } from "../ledger/category";

/**
 * Repository interface for persisting and retrieving categories.
 * Framework-agnostic, no implementation details.
 */
export interface CategoryRepository {
  /**
   * Saves a category (creates or updates).
   * @param category - The category data to save
   */
  save(category: Category): Promise<void>;

  /**
   * Finds a category by its ID.
   * @param userId - The user ID (for scoping)
   * @param id - The category ID to search for
   * @returns The category or null if not found
   */
  findById(userId: UserId, id: CategoryId): Promise<Category | null>;

  /**
   * Lists all active (non-soft-deleted) categories for a user.
   * Optionally filtered by category group ID.
   * @param userId - The user ID
   * @param categoryGroupId - Optional category group ID to filter by
   * @returns Array of categories ordered by name
   */
  listByUserId(
    userId: UserId,
    categoryGroupId?: CategoryGroupId,
  ): Promise<Category[]>;

  /**
   * Lists all active (non-soft-deleted) child categories for a parent category.
   * @param userId - The user ID
   * @param parentId - The parent category ID
   * @returns Array of child categories
   */
  listChildren(userId: UserId, parentId: CategoryId): Promise<Category[]>;

  /**
   * Checks if a category has any transaction lines referencing it.
   * @param userId - The user ID
   * @param categoryId - The category ID
   * @returns True if the category has transaction lines
   */
  hasTransactionLines(userId: UserId, categoryId: CategoryId): Promise<boolean>;

  /**
   * Counts transaction lines per category for a user.
   * @param userId - The user ID
   * @param categoryIds - Optional array of category IDs to count for
   * @returns Map of category ID to transaction line count
   */
  countTransactionLines(
    userId: UserId,
    categoryIds?: CategoryId[],
  ): Promise<Map<CategoryId, number>>;

  /**
   * Soft deletes a category by setting deletedAt.
   * @param userId - The user ID
   * @param categoryId - The category ID
   * @param deletedAt - The deletion timestamp
   */
  softDelete(
    userId: UserId,
    categoryId: CategoryId,
    deletedAt: Date,
  ): Promise<void>;

  /**
   * Checks if a category has any active (non-soft-deleted) child categories.
   * @param userId - The user ID
   * @param parentId - The parent category ID
   * @returns True if the category has active children
   */
  hasActiveChildren(userId: UserId, parentId: CategoryId): Promise<boolean>;
}
