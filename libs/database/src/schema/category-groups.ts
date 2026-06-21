import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { categoryGroupKindEnum } from "./enums";

export const categoryGroups = pgTable(
  "category_groups",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    name: text("name").notNull(),
    kind: categoryGroupKindEnum("kind").notNull(),
    idealPercentageBasisPoints: integer("ideal_percentage_basis_points"),
    sortOrder: integer("sort_order").default(0).notNull(),
    isSystem: boolean("is_system").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    categoryGroupsUserIdIdx: index("category_groups_user_id_idx").on(table.userId),
    categoryGroupsUserKindIdx: index("category_groups_user_kind_idx").on(
      table.userId,
      table.kind,
    ),
    categoryGroupsUserSortIdx: index("category_groups_user_sort_idx").on(
      table.userId,
      table.sortOrder,
    ),
    categoryGroupsDeletedAtIdx: index("category_groups_deleted_at_idx").on(table.deletedAt),
    categoryGroupsUserDeletedIdx: index("category_groups_user_deleted_idx").on(
      table.userId,
      table.deletedAt,
    ),
  }),
);
