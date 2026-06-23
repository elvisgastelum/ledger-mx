import type { Account } from "../ledger/account";
import type { UserId, AccountId } from "../value-objects/uuid";

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

  /** Soft-archives an account by setting isArchived to true and deletedAt to the current time. */
  archive(userId: UserId, accountId: AccountId, deletedAt: Date): Promise<void>;
}
