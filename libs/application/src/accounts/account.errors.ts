/**
 * Base error class for account application errors.
 */
export abstract class AccountApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Thrown when an account is not found.
 */
export class AccountNotFoundError extends AccountApplicationError {
  constructor(id: string) {
    super(`Account not found: ${id}`);
  }
}

/**
 * Thrown when attempting to modify a system account.
 */
export class SystemAccountModificationError extends AccountApplicationError {
  constructor(id: string) {
    super(`Cannot modify system account: ${id}`);
  }
}
