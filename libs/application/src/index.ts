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

// Onboarding Types
export type {
  ApplyDefaultCategoryGroupLayoutInput,
  ApplyDefaultCategoryGroupLayoutResult,
} from "./onboarding";

// Onboarding Use Cases
export { ApplyDefaultCategoryGroupLayoutUseCase } from "./onboarding";

// Onboarding Errors
export { CategoryGroupLayoutConflictError } from "./onboarding";
