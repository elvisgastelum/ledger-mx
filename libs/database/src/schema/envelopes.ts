import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const envelopes = pgTable(
  "envelopes",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    name: text("name").notNull(),
    targetAmountCents: integer("target_amount_cents"),
    isProtected: boolean("is_protected").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    envelopesUserIdIdx: index("envelopes_user_id_idx").on(table.userId),
    envelopesTargetAmountNonNegativeCheck: check(
      "envelopes_target_amount_non_negative_check",
      sql`${table.targetAmountCents} IS NULL OR ${table.targetAmountCents} >= 0`,
    ),
  }),
);
