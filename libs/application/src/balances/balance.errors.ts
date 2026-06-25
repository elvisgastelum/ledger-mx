/**
 * Error thrown when an account balance is not found.
 * This typically means the account doesn't exist or doesn't belong to the user.
 */
export class AccountBalanceNotFoundError extends Error {
  constructor(accountId: string) {
    super(`Account balance not found for account: ${accountId}`);
    this.name = "AccountBalanceNotFoundError";
  }
}

/**
 * Error thrown when balances are not found or cannot be calculated.
 */
export class BalanceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BalanceNotFoundError";
  }
}
