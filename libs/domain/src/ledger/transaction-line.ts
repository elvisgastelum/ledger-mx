import { TransactionLineTargetType } from "../index";
import { InvalidTransactionLineAmountError } from "./ledger-errors";
import {
  TransactionLineId,
  TransactionId,
  TransactionLineTargetId,
} from "../value-objects/uuid";

export interface TransactionLineProps {
  id: TransactionLineId;
  transactionId: TransactionId;
  targetType: TransactionLineTargetType;
  targetId: TransactionLineTargetId;
  amountCents: number;
}

/**
 * Represents a single line in a double-entry transaction.
 * Enforces non-zero integer amounts and valid IDs (validated at boundaries via factory functions).
 */
export class TransactionLine {
  public readonly id: TransactionLineId;
  public readonly transactionId: TransactionId;
  public readonly targetType: TransactionLineTargetType;
  public readonly targetId: TransactionLineTargetId;
  public readonly amountCents: number;

  constructor(props: TransactionLineProps) {
    if (!Number.isInteger(props.amountCents)) {
      throw new InvalidTransactionLineAmountError(
        `Transaction line amount must be an integer, got ${props.amountCents}`,
      );
    }
    if (props.amountCents === 0) {
      throw new InvalidTransactionLineAmountError(
        "Transaction line amount cannot be zero",
      );
    }

    this.id = props.id;
    this.transactionId = props.transactionId;
    this.targetType = props.targetType;
    this.targetId = props.targetId;
    this.amountCents = props.amountCents;
  }
}

// Re-export target type for convenience
export type { TransactionLineTargetType } from "../index";
