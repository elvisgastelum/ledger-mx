import { relations } from "drizzle-orm";
import { users } from "./users";
import { accounts } from "./accounts";
import { envelopes } from "./envelopes";
import { categoryGroups } from "./category-groups";
import { categories } from "./categories";
import { transactions } from "./transactions";
import { transactionLines } from "./transaction-lines";
import { sessions } from "./sessions";
import { authAuditLogs } from "./auth-audit-logs";

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  envelopes: many(envelopes),
  categoryGroups: many(categoryGroups),
  categories: many(categories),
  transactions: many(transactions),
  transactionLines: many(transactionLines),
  sessions: many(sessions),
  authAuditLogs: many(authAuditLogs),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
  transactionLines: many(transactionLines),
}));

export const envelopesRelations = relations(envelopes, ({ one, many }) => ({
  user: one(users, { fields: [envelopes.userId], references: [users.id] }),
  transactionLines: many(transactionLines),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  categoryGroup: one(categoryGroups, {
    fields: [categories.categoryGroupId],
    references: [categoryGroups.id],
  }),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories, { relationName: "parent" }),
  transactionLines: many(transactionLines),
}));

export const categoryGroupsRelations = relations(
  categoryGroups,
  ({ one, many }) => ({
    user: one(users, {
      fields: [categoryGroups.userId],
      references: [users.id],
    }),
    categories: many(categories),
  }),
);

export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
    user: one(users, { fields: [transactions.userId], references: [users.id] }),
    reversalOf: one(transactions, {
      fields: [transactions.reversalOfTransactionId],
      references: [transactions.id],
      relationName: "reversal",
    }),
    reversedBy: many(transactions, { relationName: "reversal" }),
    transactionLines: many(transactionLines),
  }),
);

export const transactionLinesRelations = relations(
  transactionLines,
  ({ one }) => ({
    user: one(users, {
      fields: [transactionLines.userId],
      references: [users.id],
    }),
    transaction: one(transactions, {
      fields: [transactionLines.transactionId],
      references: [transactions.id],
    }),
    account: one(accounts, {
      fields: [transactionLines.accountId],
      references: [accounts.id],
    }),
    envelope: one(envelopes, {
      fields: [transactionLines.envelopeId],
      references: [envelopes.id],
    }),
    category: one(categories, {
      fields: [transactionLines.categoryId],
      references: [categories.id],
    }),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const authAuditLogsRelations = relations(authAuditLogs, ({ one }) => ({
  user: one(users, {
    fields: [authAuditLogs.userId],
    references: [users.id],
  }),
}));
