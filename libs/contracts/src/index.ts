export const PACKAGE_NAME = "@ledger-mx/contracts";

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
