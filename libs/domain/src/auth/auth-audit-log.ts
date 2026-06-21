import type { UserId } from "../value-objects/uuid";

/**
 * Auth audit event types for tracking authentication-related activities.
 */
export type AuthAuditEventType =
  | "user_registered"
  | "login_success"
  | "login_failed"
  | "token_refreshed"
  | "logout"
  | "token_reuse_detected";

/**
 * Auth audit log entry for tracking authentication events.
 * Never stores raw tokens or passwords in metadata.
 */
export interface AuthAuditLog {
  /** Unique identifier for the audit log entry */
  id: string;
  /** User associated with the event (nullable for failed login attempts) */
  userId: UserId | null;
  /** Type of authentication event */
  eventType: AuthAuditEventType;
  /** Optional IP address where the event originated */
  ipAddress?: string | null;
  /** Optional user agent of the client */
  userAgent?: string | null;
  /** Additional event metadata (must not contain sensitive data like raw tokens/passwords) */
  metadata?: Record<string, unknown>;
  /** When the event occurred */
  createdAt: Date;
}
