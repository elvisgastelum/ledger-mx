import { Transaction } from "../ledger/transaction";
import type { UserId, TransactionId, EnvelopeId } from "../value-objects/uuid";

/**
 * Date range filter for transaction queries
 */
export interface TransactionDateRange {
  startDate?: Date;
  endDate?: Date;
}

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
   * Finds transactions for a user within an optional date range.
   * @param userId - The user ID
   * @param dateRange - Optional date range with startDate and/or endDate
   * @returns Transactions ordered by occurredAt ascending
   */
  findByUserIdAndDateRange(
    userId: UserId,
    dateRange?: TransactionDateRange,
  ): Promise<Transaction[]>;

  /**
   * Finds a reversal transaction for a given original transaction ID.
   * Returns null if no reversal exists.
   */
  findReversalByOriginalId(
    userId: UserId,
    originalTransactionId: TransactionId,
  ): Promise<Transaction | null>;

  /**
   * Finds transactions that involve a specific envelope.
   * Returns transactions where any line has targetType='envelope' and matches the envelopeId.
   */
  findByEnvelopeId(
    userId: UserId,
    envelopeId: EnvelopeId,
  ): Promise<Transaction[]>;
}
