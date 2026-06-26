import type {
  UserId,
  CategoryId,
  CategoryGroupId,
} from "../value-objects/uuid";
import type { OwnershipType } from "../index";

/**
 * Category entity representing a budget category within a category group.
 * Examples: "Rent/Mortgage", "Groceries", "Dining Out"
 * Can be hierarchical with parent/child relationships within the same group.
 */
export interface Category {
  /** Unique category identifier */
  id: CategoryId;
  /** User who owns this category */
  userId: UserId;
  /** Display name (e.g., "Rent/Mortgage", "Groceries") */
  name: string;
  /**
   * Parent category ID for hierarchical categories.
   * Null for top-level categories.
   */
  parentId: CategoryId | null;
  /** Category group this category belongs to */
  categoryGroupId: CategoryGroupId;
  /**
   * Ownership type: "system" means auto-created/not user-editable (e.g., default categories).
   * "user" means created and managed by the user.
   */
  ownership: OwnershipType;
  /** When the category was created */
  createdAt: Date;
  /** When the category was last updated */
  updatedAt: Date;
  /** Soft delete timestamp (null if active) */
  deletedAt?: Date | null;
}
