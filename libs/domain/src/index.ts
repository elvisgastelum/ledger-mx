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

export const CATEGORY_GROUP_KINDS = [
  "income",
  "expense",
  "savings",
  "general",
] as const;
export type CategoryGroupKind = (typeof CATEGORY_GROUP_KINDS)[number];

// Account status constants and types
export const ACCOUNT_STATUSES = ["active", "archived"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

// Ownership type constants and types
export const OWNERSHIP_TYPES = ["user", "system"] as const;
export type OwnershipType = (typeof OWNERSHIP_TYPES)[number];

// System account types
export type SystemRole = "expense" | "income" | "salary" | null;

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
  type CategoryGroupId,
  type TransactionId,
  type TransactionLineId,
  type TransactionLineTargetId,
  // Factory Functions
  userIdFromString,
  accountIdFromString,
  envelopeIdFromString,
  categoryIdFromString,
  categoryGroupIdFromString,
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
export type { CategoryGroup } from "./ledger/category-group";
export type { Account } from "./ledger/account";

// Auth Errors
export {
  InvalidCredentialsError,
  SessionRevokedError,
  SessionExpiredError,
  TokenReuseDetectedError,
  DuplicateEmailError,
} from "./auth/auth-errors";

// Auth Session
export {
  type SessionId,
  sessionIdFromString,
  type AuthSessionStatus,
  type AuthSession,
  isSessionExpired,
  isSessionRevoked,
  getSessionStatus,
} from "./auth/auth-session";

// Auth Audit Log
export type { AuthAuditEventType, AuthAuditLog } from "./auth/auth-audit-log";

// Repositories
export type { TransactionRepository } from "./repositories/transaction-repository";
export type {
  AuthUser,
  NewAuthUser,
  UserRepository,
} from "./repositories/user-repository";
export type { SessionRepository } from "./repositories/session-repository";
export type { AuthAuditLogRepository } from "./repositories/auth-audit-log-repository";
export type { CategoryGroupRepository } from "./repositories/category-group-repository";
export type { AccountRepository } from "./repositories/account-repository";
