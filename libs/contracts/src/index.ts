export const PACKAGE_NAME = "@ledger-mx/contracts";

// Common schemas
export {
  ErrorResponseSchema,
  type ErrorResponse,
  UuidSchema,
  MoneySchema,
  DateRangeQuerySchema,
  type DateRangeQuery,
  PaginationQuerySchema,
  type PaginationQuery,
} from "./common.schemas";

// Auth schemas
export * from "./auth";

// Category Groups
export {
  CATEGORY_GROUP_KINDS,
  CategoryGroupSchema,
  CreateCategoryGroupRequestSchema,
  UpdateCategoryGroupRequestSchema,
  ListCategoryGroupsResponseSchema,
  CategoryGroupResponseSchema,
} from "./category-groups/category-group.schemas";
export type {
  CategoryGroupKind,
  CategoryGroup,
  CreateCategoryGroupRequest,
  UpdateCategoryGroupRequest,
  ListCategoryGroupsResponse,
  CategoryGroupResponse,
} from "./category-groups/category-group.schemas";

// Categories
export {
  CategorySchema,
  CreateCategoryRequestSchema,
  UpdateCategoryRequestSchema,
  CategoryWithUsageSchema,
  ListCategoriesResponseSchema,
  GetCategoryResponseSchema,
  CategoryResponseSchema,
} from "./categories/category.schemas";
export type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryWithUsage,
  ListCategoriesResponse,
  GetCategoryResponse,
  CategoryResponse,
} from "./categories/category.schemas";

// Accounts (planned)
export * from "./accounts";

// Envelopes (planned)
export * from "./envelopes";

// Transactions (planned)
export * from "./transactions";

// Balances
export * from "./balances";

// Onboarding
export * from "./onboarding";

// ts-rest contract (single source of truth for API shape)
export { contract, type Contract } from "./contract";
