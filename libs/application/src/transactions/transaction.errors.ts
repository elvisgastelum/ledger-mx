/**
 * Base error class for transaction application errors.
 */
export abstract class TransactionApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Thrown when a transaction is not found.
 */
export class TransactionNotFoundError extends TransactionApplicationError {
  constructor(id: string) {
    super(`Transaction not found: ${id}`);
  }
}

/**
 * Thrown when attempting to create a duplicate reversal for a transaction.
 */
export class DuplicateReversalError extends TransactionApplicationError {
  constructor(transactionId: string) {
    super(`Transaction ${transactionId} already has a reversal`);
  }
}

/**
 * Thrown when a transaction line target (account, category, or envelope) is not found or not accessible by the user.
 */
export class TransactionTargetNotFoundError extends TransactionApplicationError {
  constructor(targetType: string, targetId: string) {
    super(`${targetType} not found or not accessible: ${targetId}`);
  }
}
