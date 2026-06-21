export * from "./enums";
export * from "./users";
export * from "./accounts";
export * from "./envelopes";
export * from "./category-groups";
export * from "./categories";
export * from "./transactions";
export * from "./transaction-lines";
export * from "./sessions";
export * from "./auth-audit-logs";
export * from "./relations";

import { users } from "./users";
import { accounts } from "./accounts";
import { envelopes } from "./envelopes";
import { categoryGroups } from "./category-groups";
import { categories } from "./categories";
import { transactions } from "./transactions";
import { transactionLines } from "./transaction-lines";
import { sessions } from "./sessions";
import { authAuditLogs } from "./auth-audit-logs";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Envelope = typeof envelopes.$inferSelect;
export type NewEnvelope = typeof envelopes.$inferInsert;

export type CategoryGroup = typeof categoryGroups.$inferSelect;
export type NewCategoryGroup = typeof categoryGroups.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type TransactionLine = typeof transactionLines.$inferSelect;
export type NewTransactionLine = typeof transactionLines.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type AuthAuditLog = typeof authAuditLogs.$inferSelect;
export type NewAuthAuditLog = typeof authAuditLogs.$inferInsert;
