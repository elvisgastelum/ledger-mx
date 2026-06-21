import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { transactions } from "./transactions";
import { accounts } from "./accounts";
import { envelopes } from "./envelopes";
import { categories } from "./categories";
import { transactionLineTargetTypeEnum } from "./enums";

export const transactionLines = pgTable(
  "transaction_lines",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    transactionId: uuid("transaction_id")
      .references(() => transactions.id)
      .notNull(),
    targetType: transactionLineTargetTypeEnum("target_type").notNull(),
    accountId: uuid("account_id").references(() => accounts.id),
    envelopeId: uuid("envelope_id").references(() => envelopes.id),
    categoryId: uuid("category_id").references(() => categories.id),
    amountCents: integer("amount_cents").notNull(),
    memo: text("memo"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    transactionLinesUserIdIdx: index("transaction_lines_user_id_idx").on(
      table.userId,
    ),
    transactionLinesTransactionIdIdx: index(
      "transaction_lines_transaction_id_idx",
    ).on(table.transactionId),
    transactionLinesAccountIdIdx: index("transaction_lines_account_id_idx").on(
      table.accountId,
    ),
    transactionLinesEnvelopeIdIdx: index(
      "transaction_lines_envelope_id_idx",
    ).on(table.envelopeId),
    transactionLinesCategoryIdIdx: index(
      "transaction_lines_category_id_idx",
    ).on(table.categoryId),
    transactionLinesAmountNonZeroCheck: check(
      "transaction_lines_amount_non_zero_check",
      sql`${table.amountCents} <> 0`,
    ),
    transactionLinesTargetConsistencyCheck: check(
      "transaction_lines_target_consistency_check",
      sql`((${table.targetType} = 'account' AND ${table.accountId} IS NOT NULL AND ${table.envelopeId} IS NULL AND ${table.categoryId} IS NULL) OR (${table.targetType} = 'envelope' AND ${table.envelopeId} IS NOT NULL AND ${table.accountId} IS NULL AND ${table.categoryId} IS NULL) OR (${table.targetType} = 'category' AND ${table.categoryId} IS NOT NULL AND ${table.accountId} IS NULL AND ${table.envelopeId} IS NULL))`,
    ),
  }),
);
