import type { AuthAuditLog, AuthAuditLogRepository } from "@ledger-mx/domain";
import type { Database } from "../connection";
import { authAuditLogs } from "../schema";

/**
 * Drizzle ORM implementation of AuthAuditLogRepository.
 */
export class DrizzleAuthAuditLogRepository implements AuthAuditLogRepository {
  constructor(private readonly db: Database) {}

  async record(event: AuthAuditLog): Promise<void> {
    await this.db.insert(authAuditLogs).values({
      id: event.id,
      userId: event.userId ?? null,
      eventType: event.eventType,
      ipAddress: event.ipAddress ?? null,
      userAgent: event.userAgent ?? null,
      metadata: event.metadata ?? null,
      createdAt: event.createdAt,
    });
  }
}
