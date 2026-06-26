export const PACKAGE_NAME = "@ledger-mx/application";

// Auth Ports
export type { PasswordHasher } from "./auth/ports/password-hasher.port";
export type {
  AccessTokenPayload,
  TokenService,
} from "./auth/ports/token-service.port";
export type { Clock } from "./auth/ports/clock.port";
export { SystemClock } from "./auth/ports/clock.port";
export type { IdGenerator } from "./auth/ports/id-generator.port";

// Auth DTOs
export type { AuthRequestContext } from "./auth/dtos/auth-context.dto";
export type { AuthResult } from "./auth/dtos/auth-result.dto";

// Auth Use Cases
export { RegisterUserUseCase } from "./auth/use-cases/register-user.use-case";
export type { RegisterUserInput } from "./auth/use-cases/register-user.use-case";
export { LoginUserUseCase } from "./auth/use-cases/login-user.use-case";
export type { LoginUserInput } from "./auth/use-cases/login-user.use-case";
export { RefreshTokenUseCase } from "./auth/use-cases/refresh-token.use-case";
export type { RefreshTokenInput } from "./auth/use-cases/refresh-token.use-case";
export { LogoutUseCase } from "./auth/use-cases/logout.use-case";
export type {
  LogoutInput,
  LogoutResult,
} from "./auth/use-cases/logout.use-case";

// Category Groups Types
export type {
  ListCategoryGroupsInput,
  CreateCategoryGroupInput,
  UpdateCategoryGroupInput,
  DeleteCategoryGroupInput,
} from "./category-groups/category-group.types";

// Category Groups Use Cases
export { ListCategoryGroupsUseCase } from "./category-groups/use-cases/list-category-groups.use-case";
export { CreateCategoryGroupUseCase } from "./category-groups/use-cases/create-category-group.use-case";
export { UpdateCategoryGroupUseCase } from "./category-groups/use-cases/update-category-group.use-case";
export { DeleteCategoryGroupUseCase } from "./category-groups/use-cases/delete-category-group.use-case";

// Category Groups Errors
export {
  CategoryGroupApplicationError,
  CategoryGroupNotFoundError,
  SystemCategoryGroupModificationError,
  CategoryGroupHasActiveCategoriesError,
} from "./category-groups/category-group.errors";

// Categories Types
export type {
  CreateCategoryInput,
  UpdateCategoryInput,
  ListCategoriesInput,
  GetCategoryInput,
  ArchiveCategoryInput,
  CategoryOutput,
  CategoryWithUsageOutput,
} from "./categories/category.types";

// Categories Use Cases
export { CreateCategoryUseCase } from "./categories/use-cases/create-category.use-case";
export { ListCategoriesUseCase } from "./categories/use-cases/list-categories.use-case";
export { GetCategoryUseCase } from "./categories/use-cases/get-category.use-case";
export { UpdateCategoryUseCase } from "./categories/use-cases/update-category.use-case";
export { ArchiveCategoryUseCase } from "./categories/use-cases/archive-category.use-case";

// Categories Errors
export {
  CategoryApplicationError,
  CategoryNotFoundError,
  SystemCategoryModificationError,
  InvalidParentCategoryError,
  CategoryInUseError,
  CategoryHasActiveChildrenError,
  DuplicateCategoryNameError,
} from "./categories/category.errors";

// Onboarding Types
export type {
  ApplyDefaultCategoryGroupLayoutInput,
  ApplyDefaultCategoryGroupLayoutResult,
} from "./onboarding";

// Onboarding Use Cases
export { ApplyDefaultCategoryGroupLayoutUseCase } from "./onboarding";

// Onboarding Errors
export { CategoryGroupLayoutConflictError } from "./onboarding";

// Export Use Cases
export { ExportTransactionsCsvUseCase } from "./export/use-cases/export-transactions-csv.use-case";
export type { ExportTransactionsCsvResult } from "./export/use-cases/export-transactions-csv.use-case";

// Export Ports
export type { TransactionExportRepository } from "./export/ports/transaction-export.repository.port";

// Export Types
export type { TransactionExportRow } from "./export/ports/transaction-export.repository.port";

// Export Utilities
export { escapeCsvValue } from "./export/csv-utils";

// Account Types
export type {
  CreateAccountInput,
  UpdateAccountInput,
  ListAccountsInput,
} from "./accounts/account.types";

// Account Use Cases
export { CreateAccountUseCase } from "./accounts/use-cases/create-account.use-case";
export { ListAccountsUseCase } from "./accounts/use-cases/list-accounts.use-case";
export { UpdateAccountUseCase } from "./accounts/use-cases/update-account.use-case";
export { ArchiveAccountUseCase } from "./accounts/use-cases/archive-account.use-case";
export { EnsureSystemAccountsUseCase } from "./accounts/use-cases/ensure-system-accounts.use-case";

// Account Errors
export {
  AccountApplicationError,
  AccountNotFoundError,
  SystemAccountModificationError,
} from "./accounts/account.errors";

// Transaction Types
export type {
  CreateTransactionInput,
  ListTransactionsInput,
  TransactionLineOutput,
  CreateTransactionOutput,
  ListTransactionsOutput,
  CreateReversalInput,
  CreateReversalOutput,
  CreateCorrectionInput,
  CreateCorrectionOutput,
} from "./transactions/transaction.types";

// Transaction Use Cases
export { CreateTransactionUseCase } from "./transactions/use-cases/create-transaction.use-case";
export { ListTransactionsUseCase } from "./transactions/use-cases/list-transactions.use-case";
export { CreateReversalUseCase } from "./transactions/use-cases/create-reversal.use-case";
export { CreateCorrectionUseCase } from "./transactions/use-cases/create-correction.use-case";

// Transaction Errors
export {
  TransactionApplicationError,
  TransactionNotFoundError,
  DuplicateReversalError,
  TransactionTargetNotFoundError,
} from "./transactions/transaction.errors";

// Balance Types
export type {
  GetAccountBalanceInput,
  GetAccountBalancesInput,
  GetBalancesByTypeInput,
  GetLiabilityBalancesInput,
  GeneralBalanceResult,
} from "./balances/balance.types";

// Balance Use Cases
export { GetAccountBalanceUseCase } from "./balances/use-cases/get-account-balance.use-case";
export { GetAccountBalancesUseCase } from "./balances/use-cases/get-account-balances.use-case";
export { GetBalancesByTypeUseCase } from "./balances/use-cases/get-balances-by-type.use-case";
export { GetLiabilityBalancesUseCase } from "./balances/use-cases/get-liability-balances.use-case";
export { GetGeneralBalanceUseCase } from "./balances/use-cases/get-general-balance.use-case";

// Balance Errors
export {
  AccountBalanceNotFoundError,
  BalanceNotFoundError,
} from "./balances/balance.errors";
