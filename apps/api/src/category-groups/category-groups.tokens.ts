import { InjectionToken } from "@nestjs/common";

/**
 * DI tokens for category-groups-related providers.
 * Using string tokens to avoid issues with interface injection.
 */
export const CATEGORY_GROUPS_TOKENS = {
  CATEGORY_GROUP_REPOSITORY: "CATEGORY_GROUP_REPOSITORY" as InjectionToken,
} as const;
