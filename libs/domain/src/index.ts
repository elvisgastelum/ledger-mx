export const PACKAGE_NAME = "@ledger-mx/domain";

export const ACCOUNT_TYPES = [
  "debit",
  "credit",
  "loan",
  "savings",
  "cash",
] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const TRANSACTION_TYPES = [
  "income",
  "expense",
  "transfer",
  "adjustment",
  "reversal",
  "debt_payment",
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_LINE_TARGET_TYPES = [
  "account",
  "envelope",
  "category",
] as const;
export type TransactionLineTargetType =
  (typeof TRANSACTION_LINE_TARGET_TYPES)[number];

// Value Objects
export { Money } from "./value-objects/money";
export {
  assertUuidV4,
  isUuidV4,
  UUID_V4_REGEX,
  // Branded ID Types
  type UserId,
  type AccountId,
  type EnvelopeId,
  type CategoryId,
  type TransactionId,
  type TransactionLineId,
  type TransactionLineTargetId,
  // Factory Functions
  userIdFromString,
  accountIdFromString,
  envelopeIdFromString,
  categoryIdFromString,
  transactionIdFromString,
  transactionLineIdFromString,
} from "./value-objects/uuid";

// Ledger Errors
export {
  InvalidMoneyAmountError,
  InvalidTransactionLineAmountError,
  InvalidTransactionLineCountError,
  UnbalancedTransactionError,
  InvalidIdError,
} from "./ledger/ledger-errors";

// Ledger Models
export { TransactionLine } from "./ledger/transaction-line";
export type { TransactionLineProps } from "./ledger/transaction-line";
export { Transaction } from "./ledger/transaction";
export type { TransactionProps } from "./ledger/transaction";

// Repositories
export type { TransactionRepository } from "./repositories/transaction-repository";
