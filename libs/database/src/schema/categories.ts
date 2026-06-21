import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { categoryGroups } from "./category-groups";

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    name: text("name").notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id),
    categoryGroupId: uuid("category_group_id")
      .references(() => categoryGroups.id)
      .notNull(),
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
    categoriesUserIdIdx: index("categories_user_id_idx").on(table.userId),
    categoriesParentIdIdx: index("categories_parent_id_idx").on(table.parentId),
    categoriesGroupIdIdx: index("categories_group_id_idx").on(table.categoryGroupId),
  }),
);
