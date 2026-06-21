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
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_LINE_TARGET_TYPES = [
  "account",
  "envelope",
  "category",
] as const;
export type TransactionLineTargetType =
  (typeof TRANSACTION_LINE_TARGET_TYPES)[number];
