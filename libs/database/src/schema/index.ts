export * from "./enums";
export * from "./users";
export * from "./accounts";
export * from "./envelopes";
export * from "./categories";
export * from "./transactions";
export * from "./transaction-lines";
export * from "./relations";

import { users } from "./users";
import { accounts } from "./accounts";
import { envelopes } from "./envelopes";
import { categories } from "./categories";
import { transactions } from "./transactions";
import { transactionLines } from "./transaction-lines";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Envelope = typeof envelopes.$inferSelect;
export type NewEnvelope = typeof envelopes.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type TransactionLine = typeof transactionLines.$inferSelect;
export type NewTransactionLine = typeof transactionLines.$inferInsert;
