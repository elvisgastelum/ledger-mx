import { InjectionToken } from "@nestjs/common";

/**
 * DI tokens for export-related providers.
 * Using string tokens to avoid issues with interface injection.
 */
export const EXPORT_TOKENS = {
  TRANSACTION_EXPORT_REPOSITORY:
    "TRANSACTION_EXPORT_REPOSITORY" as InjectionToken,
} as const;
