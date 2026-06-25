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
