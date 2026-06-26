/**
 * Tokens for dependency injection in the Categories module.
 * Use these tokens to override default implementations in tests or when extending the module.
 */
export const CATEGORIES_TOKENS = {
  CATEGORY_REPOSITORY: Symbol("CATEGORY_REPOSITORY"),
  CATEGORY_GROUP_REPOSITORY: Symbol("CATEGORY_GROUP_REPOSITORY"),
} as const;
