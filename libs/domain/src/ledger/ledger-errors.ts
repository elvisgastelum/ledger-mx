/**
 * Thrown when a Money amount is invalid (non-integer, non-finite).
 */
export class InvalidMoneyAmountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidMoneyAmountError";
  }
}

/**
 * Thrown when a transaction line has an invalid amount (zero, non-integer).
 */
export class InvalidTransactionLineAmountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTransactionLineAmountError";
  }
}

/**
 * Thrown when a transaction has fewer than 2 lines.
 */
export class InvalidTransactionLineCountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTransactionLineCountError";
  }
}

/**
 * Thrown when a transaction's lines do not sum to zero.
 */
export class UnbalancedTransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnbalancedTransactionError";
  }
}

/**
 * Thrown when an ID is invalid (empty, non-UUID v4).
 */
export class InvalidIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidIdError";
  }
}
