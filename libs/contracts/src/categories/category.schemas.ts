import { z } from "zod";

/**
 * Schema for Category response
 */
export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  parentId: z.string().uuid().nullable(),
  categoryGroupId: z.string().uuid(),
  ownership: z
    .enum(["user", "system"])
    .describe("Whether this is a user or system-managed category"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Category = z.infer<typeof CategorySchema>;

/**
 * Schema for creating a category
 */
export const CreateCategoryRequestSchema = z.object({
  name: z.string().min(1).max(100),
  categoryGroupId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
});

export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequestSchema>;

/**
 * Schema for updating a category
 */
export const UpdateCategoryRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequestSchema>;

/**
 * Schema for list categories response with usage counts
 */
export const CategoryWithUsageSchema = CategorySchema.extend({
  usageCount: z
    .number()
    .int()
    .min(0)
    .describe("Number of transaction lines using this category"),
});

export type CategoryWithUsage = z.infer<typeof CategoryWithUsageSchema>;

/**
 * Schema for list categories response
 */
export const ListCategoriesResponseSchema = z.object({
  categories: z.array(CategoryWithUsageSchema),
});

export type ListCategoriesResponse = z.infer<
  typeof ListCategoriesResponseSchema
>;

/**
 * Schema for get single category response
 */
export const GetCategoryResponseSchema = z.object({
  category: CategoryWithUsageSchema,
});

export type GetCategoryResponse = z.infer<typeof GetCategoryResponseSchema>;

/**
 * Schema for create/update category response
 */
export const CategoryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  parentId: z.string().uuid().nullable(),
  categoryGroupId: z.string().uuid(),
  ownership: z.enum(["user", "system"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
