import { TransactionType, TRANSACTION_TYPES } from "../index";
import { TransactionLine } from "./transaction-line";
import {
  InvalidTransactionLineCountError,
  UnbalancedTransactionError,
} from "./ledger-errors";
import {
  UserId,
  TransactionId,
  TransactionLineId,
} from "../value-objects/uuid";

export interface TransactionProps {
  id: TransactionId;
  userId: UserId;
  type: TransactionType;
  occurredAt: Date;
  description?: string;
  lines: TransactionLine[];
  createdAt?: Date;
  updatedAt?: Date;
  reversalOfTransactionId?: TransactionId;
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
  public readonly reversalOfTransactionId?: TransactionId;

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
    this.reversalOfTransactionId = props.reversalOfTransactionId;
  }

  /**
   * Creates a reversal transaction that negates this transaction.
   * The reversal has type "reversal" and lines with negated amounts.
   * @param input - Reversal input with new IDs and optional fields
   * @returns A new Transaction representing the reversal
   */
  createReversal(input: {
    reversalTransactionId: TransactionId;
    reversalLineIds: TransactionLineId[];
    occurredAt?: Date;
    description?: string;
  }): Transaction {
    if (input.reversalLineIds.length !== this.lines.length) {
      throw new InvalidTransactionLineCountError(
        `Reversal must have same number of lines as original. Original: ${this.lines.length}, provided: ${input.reversalLineIds.length}`,
      );
    }

    const reversalLines = this.lines.map((originalLine, index) => {
      return new TransactionLine({
        id: input.reversalLineIds[index],
        transactionId: input.reversalTransactionId,
        targetType: originalLine.targetType,
        targetId: originalLine.targetId,
        amountCents: -originalLine.amountCents, // Negate the amount
      });
    });

    const reversalDescription =
      input.description ?? `Reversal of transaction ${this.id}`;

    return new Transaction({
      id: input.reversalTransactionId,
      userId: this.userId,
      type: "reversal",
      occurredAt: input.occurredAt ?? new Date(),
      description: reversalDescription,
      lines: reversalLines,
      reversalOfTransactionId: this.id,
    });
  }
}

// Re-export TransactionType for convenience
export type { TransactionType } from "../index";
