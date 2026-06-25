import type { Account } from "../ledger/account";
import type { UserId, AccountId } from "../value-objects/uuid";
import type { SystemRole } from "../index";

/**
 * Repository interface for persisting and retrieving Accounts.
 * Framework-agnostic, no implementation details.
 */
export interface AccountRepository {
  /** Saves an account (creates or updates). */
  save(account: Account): Promise<void>;

  /** Retrieves an account by user ID and account ID, returns null if not found. */
  findById(userId: UserId, accountId: AccountId): Promise<Account | null>;

  /** Lists all non-archived accounts for a user. */
  listByUserId(userId: UserId): Promise<Account[]>;

  /** Soft-archives an account by setting status to "archived" and deletedAt to the current time. */
  archive(userId: UserId, accountId: AccountId, deletedAt: Date): Promise<void>;

  /** Finds all system accounts for a user. */
  findSystemAccounts(userId: UserId): Promise<Account[]>;

  /** Finds a system account by role for a user. Returns null if not found. */
  findBySystemRole(userId: UserId, role: SystemRole): Promise<Account | null>;
}
