import {
  pgTable,
  uuid,
  timestamp,
  text,
  index,
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
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    description: text("description"),
    externalId: text("external_id"),
    reversalOfTransactionId: uuid("reversal_of_transaction_id").references(
      (): AnyPgColumn => transactions.id,
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    transactionsUserIdIdx: index("transactions_user_id_idx").on(table.userId),
    transactionsUserIdOccurredAtIdx: index(
      "transactions_user_id_occurred_at_idx",
    ).on(table.userId, table.occurredAt),
    transactionsReversalOfTransactionIdIdx: index(
      "transactions_reversal_of_transaction_id_idx",
    ).on(table.reversalOfTransactionId),
  }),
);
