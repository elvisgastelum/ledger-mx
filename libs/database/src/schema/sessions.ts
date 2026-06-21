import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    deviceName: text("device_name"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
    refreshTokenHashIdx: index("sessions_refresh_token_hash_idx").on(
      table.refreshTokenHash,
    ),
    expiresAtIdx: index("sessions_expires_at_idx").on(table.expiresAt),
    revokedAtIdx: index("sessions_revoked_at_idx").on(table.revokedAt),
  }),
);
