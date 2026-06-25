import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { accountTypeEnum, accountStatusEnum, ownershipTypeEnum } from "./enums";

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
    status: accountStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
    ownership: ownershipTypeEnum("ownership").default("user").notNull(),
    systemRole: text("system_role", { enum: ["expense", "income", "salary"] }),
  },
  (table) => ({
    accountsUserIdIdx: index("accounts_user_id_idx").on(table.userId),
    accountsUserIdTypeIdx: index("accounts_user_id_type_idx").on(
      table.userId,
      table.type,
    ),
    accountsUserIdOwnershipIdx: index("accounts_user_id_ownership_idx").on(
      table.userId,
      table.ownership,
    ),
    accountsUserIdSystemRoleIdx: index("accounts_user_id_system_role_idx").on(
      table.userId,
      table.systemRole,
    ),
  }),
);
