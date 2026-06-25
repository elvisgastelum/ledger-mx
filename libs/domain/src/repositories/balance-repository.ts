import type { UserId, AccountId } from "../value-objects/uuid";
import type { AccountType } from "../index";

/**
 * Account balance data
 */
export interface AccountBalance {
  accountId: AccountId;
  balanceCents: number;
}

/**
 * Balance grouped by account type
 */
export interface BalanceByAccountType {
  accountType: AccountType;
  balanceCents: number;
  accountCount: number;
}

/**
 * Liability account balance with account details
 */
export interface LiabilityAccountBalance {
  accountId: AccountId;
  accountName: string;
  accountType: AccountType;
  balanceCents: number;
}

/**
 * Repository interface for calculating account balances.
 * Balances are runtime-derived from transaction lines, not stored.
 * Framework-agnostic, no implementation details.
 */
export interface BalanceRepository {
  /**
   * Get balance for a single account.
   * Returns null if account not found or not owned by user.
   */
  getAccountBalance(
    userId: UserId,
    accountId: AccountId,
  ): Promise<AccountBalance | null>;

  /**
   * Get balances for multiple accounts.
   * If accountIds provided, only returns balances for those accounts.
   * Otherwise returns balances for all user accounts.
   * Accounts with no transaction lines return 0.
   */
  getAccountBalances(
    userId: UserId,
    accountIds?: AccountId[],
  ): Promise<AccountBalance[]>;

  /**
   * Get balances grouped by account type.
   * Only includes non-deleted accounts owned by the user.
   */
  getBalancesByAccountType(userId: UserId): Promise<BalanceByAccountType[]>;

  /**
   * Get balances for liability accounts (credit and loan).
   * Only includes non-deleted accounts owned by the user.
   */
  getLiabilityBalances(userId: UserId): Promise<LiabilityAccountBalance[]>;
}
