/**
 * Types for seed data modules.
 */

export interface SeedUser {
  id: string;
  email: string;
  passwordHash?: string;
  displayName?: string;
}

export interface SeedCategoryGroup {
  id: string;
  userId: string;
  name: string;
  kind: "income" | "expense" | "savings" | "general";
  idealPercentageBasisPoints?: number;
  sortOrder?: number;
  ownership?: "user" | "system";
}

export interface SeedCategory {
  id: string;
  userId: string;
  name: string;
  categoryGroupId: string;
  parentId?: string;
  ownership?: "user" | "system";
}

export interface SeedAccount {
  id: string;
  userId: string;
  name: string;
  type: "debit" | "credit" | "loan" | "savings" | "cash";
  currencyCode?: string;
  status?: "active" | "archived";
  ownership?: "user" | "system";
}

export interface SeedEnvelope {
  id: string;
  userId: string;
  name: string;
  targetAmountCents?: number;
  isProtected?: boolean;
  sortOrder?: number;
}

export interface SeedTransaction {
  id: string;
  userId: string;
  type:
    | "income"
    | "expense"
    | "transfer"
    | "adjustment"
    | "reversal"
    | "debt_payment";
  occurredAt: Date;
  description?: string;
  externalId?: string;
  reversalOfTransactionId?: string;
}

export interface SeedTransactionLine {
  id: string;
  userId: string;
  transactionId: string;
  targetType: "account" | "envelope" | "category";
  accountId?: string;
  envelopeId?: string;
  categoryId?: string;
  amountCents: number;
  memo?: string;
}

export interface SeedData {
  users: SeedUser[];
  categoryGroups: SeedCategoryGroup[];
  categories: SeedCategory[];
  accounts: SeedAccount[];
  envelopes: SeedEnvelope[];
  transactions: SeedTransaction[];
  transactionLines: SeedTransactionLine[];
}
