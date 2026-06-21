import { z } from "zod";
import { CATEGORY_GROUP_KINDS } from "../category-groups/category-group.schemas";

/**
 * Layout type enum for onboarding category group layout selection.
 */
export const LAYOUT_TYPES = ["blank", "50-30-20"] as const;
export type LayoutType = (typeof LAYOUT_TYPES)[number];

/**
 * Schema for applying a default category group layout during onboarding.
 */
export const ApplyLayoutRequestSchema = z.object({
  layout: z.enum(LAYOUT_TYPES, {
    errorMap: () => ({ message: "Layout must be either 'blank' or '50-30-20'" }),
  }),
});

export type ApplyLayoutRequest = z.infer<typeof ApplyLayoutRequestSchema>;

/**
 * Schema for category group in onboarding response.
 * Reuses fields from CategoryGroupSchema but avoids direct import issues.
 */
export const OnboardingCategoryGroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  kind: z.enum(CATEGORY_GROUP_KINDS),
  idealPercentageBasisPoints: z.number().int().min(0).max(10000).nullable(),
  sortOrder: z.number().int().min(0),
  isSystem: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Schema for apply layout response.
 */
export const ApplyLayoutResponseSchema = z.object({
  categoryGroups: z.array(OnboardingCategoryGroupSchema),
  created: z.boolean(),
});

export type ApplyLayoutResponse = z.infer<typeof ApplyLayoutResponseSchema>;
