import { Transaction } from "../ledger/transaction";
import type { UserId, TransactionId } from "../value-objects/uuid";

/**
 * Repository interface for persisting and retrieving Transactions.
 * Framework-agnostic, no implementation details.
 */
export interface TransactionRepository {
  /** Saves a transaction (creates or updates). */
  save(transaction: Transaction): Promise<void>;

  /** Retrieves a transaction by user ID and transaction ID, returns null if not found. */
  findById(
    userId: UserId,
    transactionId: TransactionId,
  ): Promise<Transaction | null>;

  /** Lists all transactions for a user, ordered by occurredAt descending. */
  listByUserId(userId: UserId): Promise<Transaction[]>;

  /**
   * Finds a reversal transaction for a given original transaction ID.
   * Returns null if no reversal exists.
   */
  findReversalByOriginalId(
    userId: UserId,
    originalTransactionId: TransactionId,
  ): Promise<Transaction | null>;
}
