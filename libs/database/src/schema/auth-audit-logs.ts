import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const authAuditLogs = pgTable(
  "auth_audit_logs",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id").references(() => users.id),
    eventType: text("event_type").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("auth_audit_logs_user_id_idx").on(table.userId),
    eventTypeIdx: index("auth_audit_logs_event_type_idx").on(table.eventType),
    createdAtIdx: index("auth_audit_logs_created_at_idx").on(table.createdAt),
  }),
);
