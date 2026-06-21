import { InjectionToken } from "@nestjs/common";

/**
 * DI tokens for auth-related providers.
 * Using string tokens to avoid issues with interface injection.
 */
export const AUTH_TOKENS = {
  USER_REPOSITORY: "USER_REPOSITORY" as InjectionToken,
  SESSION_REPOSITORY: "SESSION_REPOSITORY" as InjectionToken,
  AUTH_AUDIT_LOG_REPOSITORY: "AUTH_AUDIT_LOG_REPOSITORY" as InjectionToken,
  TOKEN_SERVICE: "TOKEN_SERVICE" as InjectionToken,
  PASSWORD_HASHER: "PASSWORD_HASHER" as InjectionToken,
  ID_GENERATOR: "ID_GENERATOR" as InjectionToken,
  CLOCK: "CLOCK" as InjectionToken,
} as const;
