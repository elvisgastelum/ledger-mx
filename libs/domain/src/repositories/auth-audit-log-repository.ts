import type { AuthAuditLog } from "../auth/auth-audit-log";

/**
 * Repository interface for recording auth audit log entries.
 * Framework-agnostic, no implementation details.
 */
export interface AuthAuditLogRepository {
  /**
   * Records an auth audit event.
   * @param event - The audit log entry to record
   */
  record(event: AuthAuditLog): Promise<void>;
}
