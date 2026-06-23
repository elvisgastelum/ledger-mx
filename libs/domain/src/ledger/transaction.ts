import { TransactionType, TRANSACTION_TYPES } from "../index";
import { TransactionLine } from "./transaction-line";
import {
  InvalidTransactionLineCountError,
  UnbalancedTransactionError,
} from "./ledger-errors";
import { UserId, TransactionId } from "../value-objects/uuid";

export interface TransactionProps {
  id: TransactionId;
  userId: UserId;
  type: TransactionType;
  occurredAt: Date;
  description?: string;
  lines: TransactionLine[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Double-entry transaction entity enforcing ledger invariants.
 * Requires 2+ lines, all lines linked to the transaction, and balanced sum.
 */
export class Transaction {
  public readonly id: TransactionId;
  public readonly userId: UserId;
  public readonly type: TransactionType;
  public readonly occurredAt: Date;
  public readonly description?: string;
  public readonly lines: TransactionLine[];
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: TransactionProps) {
    if (!TRANSACTION_TYPES.includes(props.type)) {
      throw new Error(`Invalid transaction type: ${props.type}`);
    }

    if (props.lines.length < 2) {
      throw new InvalidTransactionLineCountError(
        "Transaction must have at least 2 lines",
      );
    }

    // Verify all lines belong to this transaction
    for (const line of props.lines) {
      if (line.transactionId !== props.id) {
        throw new Error(
          `Transaction line ${line.id} has transactionId ${line.transactionId}, expected ${props.id}: lines must belong to the same transaction`,
        );
      }
    }

    // Verify lines sum to zero
    const lineSum = props.lines.reduce(
      (sum, line) => sum + line.amountCents,
      0,
    );
    if (lineSum !== 0) {
      throw new UnbalancedTransactionError(
        `Transaction lines sum to ${lineSum}, must be zero`,
      );
    }

    this.id = props.id;
    this.userId = props.userId;
    this.type = props.type;
    this.occurredAt = props.occurredAt;
    this.description = props.description;
    this.lines = [...props.lines]; // Immutable copy
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }
}

// Re-export TransactionType for convenience
export type { TransactionType } from "../index";
