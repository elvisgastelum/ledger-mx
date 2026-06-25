import { z } from "zod";

/**
 * CategoryGroupKind enum values
 */
export const CATEGORY_GROUP_KINDS = [
  "income",
  "expense",
  "savings",
  "general",
] as const;
export type CategoryGroupKind = (typeof CATEGORY_GROUP_KINDS)[number];

/**
 * Ownership type enum values
 */
export const OWNERSHIP_TYPES = ["user", "system"] as const;
export type OwnershipType = (typeof OWNERSHIP_TYPES)[number];

/**
 * Schema for CategoryGroup response
 */
export const CategoryGroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  kind: z.enum(CATEGORY_GROUP_KINDS),
  idealPercentageBasisPoints: z.number().int().min(0).max(10000).nullable(),
  sortOrder: z.number().int().min(0),
  ownership: z
    .enum(OWNERSHIP_TYPES)
    .describe("Whether this is a user or system-managed category group"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CategoryGroup = z.infer<typeof CategoryGroupSchema>;

/**
 * Schema for creating a category group
 */
export const CreateCategoryGroupRequestSchema = z.object({
  name: z.string().min(1).max(100),
  kind: z.enum(CATEGORY_GROUP_KINDS),
  idealPercentageBasisPoints: z
    .number()
    .int()
    .min(0)
    .max(10000)
    .nullable()
    .optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type CreateCategoryGroupRequest = z.infer<
  typeof CreateCategoryGroupRequestSchema
>;

/**
 * Schema for updating a category group
 */
export const UpdateCategoryGroupRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  kind: z.enum(CATEGORY_GROUP_KINDS).optional(),
  idealPercentageBasisPoints: z
    .number()
    .int()
    .min(0)
    .max(10000)
    .nullable()
    .optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type UpdateCategoryGroupRequest = z.infer<
  typeof UpdateCategoryGroupRequestSchema
>;

/**
 * Schema for list category groups response
 */
export const ListCategoryGroupsResponseSchema = z.object({
  categoryGroups: z.array(CategoryGroupSchema),
});

export type ListCategoryGroupsResponse = z.infer<
  typeof ListCategoryGroupsResponseSchema
>;

/**
 * Schema for create/update category group response
 */
export const CategoryGroupResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  kind: z.enum(CATEGORY_GROUP_KINDS),
  idealPercentageBasisPoints: z.number().int().nullable(),
  sortOrder: z.number().int(),
  ownership: z.enum(OWNERSHIP_TYPES),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CategoryGroupResponse = z.infer<typeof CategoryGroupResponseSchema>;
