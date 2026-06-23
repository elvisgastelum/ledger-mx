import type { UserId, AccountId } from "../value-objects/uuid";
import type { AccountType } from "../index";

/**
 * Account entity representing a user's financial account.
 * Examples: checking account, savings account, credit card, cash wallet.
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
  /** Whether the account is archived (soft delete) */
  isArchived: boolean;
  /** When the account was created */
  createdAt: Date;
  /** When the account was last updated */
  updatedAt: Date;
  /** Soft delete timestamp (null if active) */
  deletedAt?: Date | null;
}
