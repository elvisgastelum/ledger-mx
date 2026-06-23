import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { accountTypeEnum } from "./enums";

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    name: text("name").notNull(),
    type: accountTypeEnum("type").notNull(),
    currencyCode: text("currency_code").default("USD").notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'date' }),
  },
  (table) => ({
    accountsUserIdIdx: index("accounts_user_id_idx").on(table.userId),
    accountsUserIdTypeIdx: index("accounts_user_id_type_idx").on(
      table.userId,
      table.type,
    ),
  }),
);
