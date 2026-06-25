import {
  pgTable,
  uuid,
  timestamp,
  text,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { transactionTypeEnum } from "./enums";

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    type: transactionTypeEnum("type").notNull(),
    occurredAt: timestamp("occurred_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    description: text("description"),
    externalId: text("external_id"),
    reversalOfTransactionId: uuid("reversal_of_transaction_id").references(
      (): AnyPgColumn => transactions.id,
    ),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
  },
  (table) => ({
    transactionsUserIdIdx: index("transactions_user_id_idx").on(table.userId),
    transactionsUserIdOccurredAtIdx: index(
      "transactions_user_id_occurred_at_idx",
    ).on(table.userId, table.occurredAt),
    // Unique index on reversalOfTransactionId ensures only one reversal can point to an original transaction
    // PostgreSQL allows multiple NULLs in unique indexes, so non-reversal transactions won't conflict
    transactionsReversalOfTransactionIdUniqueIdx: uniqueIndex(
      "transactions_reversal_of_transaction_id_unique_idx",
    ).on(table.reversalOfTransactionId),
  }),
);
