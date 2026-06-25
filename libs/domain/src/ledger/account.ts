import type { UserId, AccountId } from "../value-objects/uuid";
import type { AccountType, AccountStatus, OwnershipType } from "../index";

/**
 * System role for system accounts.
 * - "expense": Used as the target for expense transactions
 * - "income": Used as the source for income transactions
 * - "salary": Alternative source for income transactions (payroll)
 */
export type SystemRole = "expense" | "income" | "salary" | null;

/**
 * Account entity representing a user's financial account.
 * Examples: checking account, savings account, credit card, cash wallet.
 * System accounts (ownership="system") are created automatically and used for transaction balancing.
 */
export interface Account {
  /** Unique account identifier */
  id: AccountId;
  /** User who owns this account */
  userId: UserId;
  /** Display name (e.g., "Chase Checking", "Savings") */
  name: string;
  /** Account type for classification */
  type: AccountType;
  /** ISO 4217 currency code (e.g., "MXN", "USD") */
  currencyCode: string;
  /** Account status: "active" or "archived" (soft delete) */
  status: AccountStatus;
  /** When the account was created */
  createdAt: Date;
  /** When the account was last updated */
  updatedAt: Date;
  /** Soft delete timestamp (null if active) */
  deletedAt?: Date | null;
  /**
   * Ownership type: "system" means auto-created/not user-editable.
   * "user" means created and managed by the user.
   */
  ownership: OwnershipType;
  /** System role for system accounts (expense, income, salary, or null for user accounts) */
  systemRole: SystemRole;
}
