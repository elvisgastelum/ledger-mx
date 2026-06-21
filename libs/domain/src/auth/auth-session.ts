import type { UserId } from "../value-objects/uuid";
import { assertUuidV4, Brand } from "../value-objects/uuid";

/**
 * Branded type for SessionId.
 */
export type SessionId = Brand<string, "SessionId">;

/**
 * Creates a SessionId from a string after validating it's a valid UUID v4.
 * @param value - The UUID v4 string
 * @returns SessionId (branded string)
 * @throws InvalidIdError if value is not a valid UUID v4
 */
export function sessionIdFromString(value: string): SessionId {
  assertUuidV4(value, "SessionId");
  return value as SessionId;
}

/**
 * Possible statuses for an auth session.
 */
export type AuthSessionStatus = "active" | "revoked" | "expired";

/**
 * Auth session entity representing a user's authenticated session.
 * Refresh tokens are stored by hash only for security.
 */
export interface AuthSession {
  /** Unique session identifier */
  id: SessionId;
  /** User this session belongs to */
  userId: UserId;
  /** Hashed refresh token (raw token is never stored) */
  refreshTokenHash: string;
  /** Optional device name for session tracking */
  deviceName?: string;
  /** Optional IP address for session tracking */
  ipAddress?: string;
  /** Optional user agent for session tracking */
  userAgent?: string;
  /** When the session was last active */
  lastActiveAt: Date;
  /** When the session expires */
  expiresAt: Date;
  /** When the session was revoked (if applicable) */
  revokedAt?: Date;
  /** When the session was created */
  createdAt: Date;
  /** When the session was last updated */
  updatedAt: Date;
}

/**
 * Checks if a session is expired based on the current time.
 * @param session - The session to check
 * @param now - Current time (defaults to new Date())
 * @returns true if the session is expired
 */
export function isSessionExpired(session: AuthSession, now?: Date): boolean {
  return session.expiresAt.getTime() < (now ?? new Date()).getTime();
}

/**
 * Checks if a session is revoked.
 * @param session - The session to check
 * @returns true if the session is revoked
 */
export function isSessionRevoked(session: AuthSession): boolean {
  return session.revokedAt != null;
}

/**
 * Gets the current status of a session.
 * @param session - The session to check
 * @param now - Current time (defaults to new Date())
 * @returns The session status
 */
export function getSessionStatus(
  session: AuthSession,
  now?: Date,
): AuthSessionStatus {
  if (isSessionRevoked(session)) {
    return "revoked";
  }
  if (isSessionExpired(session, now)) {
    return "expired";
  }
  return "active";
}
