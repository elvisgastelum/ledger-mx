import type { UserId, CategoryGroupId } from "../value-objects/uuid";
import type { CategoryGroupKind, OwnershipType } from "../index";

/**
 * Category Group entity representing a group of categories for budget planning.
 * Examples: "Needs" (50%), "Wants" (30%), "Savings" (20%), "Income" (null %)
 */
export interface CategoryGroup {
  /** Unique category group identifier */
  id: CategoryGroupId;
  /** User who owns this category group */
  userId: UserId;
  /** Display name (e.g., "Needs", "Wants", "Savings", "Income") */
  name: string;
  /** Group kind for classification */
  kind: CategoryGroupKind;
  /**
   * Ideal percentage in basis points (5000 = 50%).
   * Null for income groups (not applicable).
   */
  idealPercentageBasisPoints: number | null;
  /** Display sort order */
  sortOrder: number;
  /**
   * Ownership type: "system" means auto-created/not user-editable (e.g., default "General" group).
   * "user" means created and managed by the user.
   */
  ownership: OwnershipType;
  /** When the group was created */
  createdAt: Date;
  /** When the group was last updated */
  updatedAt: Date;
  /** Soft delete timestamp (null if active) */
  deletedAt?: Date | null;
}
