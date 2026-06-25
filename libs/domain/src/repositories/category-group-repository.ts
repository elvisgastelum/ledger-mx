import type { UserId, CategoryGroupId } from "../value-objects/uuid";
import type { CategoryGroup } from "../ledger/category-group";

/**
 * Repository interface for persisting and retrieving category groups.
 * Framework-agnostic, no implementation details.
 */
export interface CategoryGroupRepository {
  /**
   * Saves a category group (creates or updates).
   * @param group - The category group data to save
   */
  save(group: CategoryGroup): Promise<void>;

  /**
   * Finds a category group by its ID.
   * @param userId - The user ID (for scoping)
   * @param id - The category group ID to search for
   * @returns The category group or null if not found
   */
  findById(userId: UserId, id: CategoryGroupId): Promise<CategoryGroup | null>;

  /**
   * Lists all active (non-soft-deleted) category groups for a user.
   * @param userId - The user ID
   * @returns Array of category groups ordered by sortOrder
   */
  listByUserId(userId: UserId): Promise<CategoryGroup[]>;

  /**
   * Checks if a category group has any active (non-soft-deleted) categories.
   * @param userId - The user ID
   * @param groupId - The category group ID
   * @returns True if the group has active categories
   */
  hasActiveCategories(
    userId: UserId,
    groupId: CategoryGroupId,
  ): Promise<boolean>;

  /**
   * Soft deletes a category group by setting deletedAt.
   * @param userId - The user ID
   * @param groupId - The category group ID
   * @param deletedAt - The deletion timestamp
   */
  softDelete(
    userId: UserId,
    groupId: CategoryGroupId,
    deletedAt: Date,
  ): Promise<void>;
}
