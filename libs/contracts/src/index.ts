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

// Onboarding
export {
  LAYOUT_TYPES,
  ApplyLayoutRequestSchema,
  OnboardingCategoryGroupSchema,
  ApplyLayoutResponseSchema,
} from "./onboarding";
export type {
  LayoutType,
  ApplyLayoutRequest,
  ApplyLayoutResponse,
} from "./onboarding";

// ts-rest contract (single source of truth for API shape)
export { contract, type Contract } from "./contract";

// Generated OpenAPI document (single source of truth for API documentation)
export { openApiDocument, writeOpenApiJson } from "./openapi";
