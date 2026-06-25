import { z } from "zod";
import { UuidSchema, SignedMoneySchema } from "../common.schemas";

/**
 * Account balance response schema
 */
export const AccountBalanceResponseSchema = z.object({
  accountId: UuidSchema,
  balanceCents: SignedMoneySchema.describe(
    "Account balance in cents (can be negative). Raw algebraic sum of signed transaction_lines.amount_cents; signs are NOT normalized by account type.",
  ),
});

export type AccountBalanceResponse = z.infer<
  typeof AccountBalanceResponseSchema
>;

/**
 * Balances by account type response schema
 */
export const BalanceByAccountTypeSchema = z.object({
  accountType: z.enum(["debit", "credit", "loan", "savings", "cash"]),
  balanceCents: SignedMoneySchema.describe(
    "Total balance for this account type in cents. Raw algebraic sum of signed transaction_lines.amount_cents across all accounts of this type; signs are NOT normalized by account type.",
  ),
  accountCount: z
    .number()
    .int()
    .min(0)
    .describe("Number of accounts of this type"),
});

export type BalanceByAccountType = z.infer<typeof BalanceByAccountTypeSchema>;

export const BalancesByAccountTypeResponseSchema = z.object({
  balances: z.array(BalanceByAccountTypeSchema),
});

export type BalancesByAccountTypeResponse = z.infer<
  typeof BalancesByAccountTypeResponseSchema
>;

/**
 * Liability account balance schema
 */
export const LiabilityAccountBalanceSchema = z.object({
  accountId: UuidSchema,
  accountName: z.string().min(1).max(100),
  accountType: z.enum(["credit", "loan"]),
  balanceCents: SignedMoneySchema.describe(
    "Liability balance in cents (typically negative for amounts owed). Raw algebraic sum of signed transaction_lines.amount_cents; signs are NOT normalized by account type.",
  ),
});

export type LiabilityAccountBalance = z.infer<
  typeof LiabilityAccountBalanceSchema
>;

export const LiabilityBalancesResponseSchema = z.object({
  liabilities: z.array(LiabilityAccountBalanceSchema),
});

export type LiabilityBalancesResponse = z.infer<
  typeof LiabilityBalancesResponseSchema
>;

/**
 * General balance response schema
 */
export const GeneralBalanceResponseSchema = z.object({
  assetsBalanceCents: SignedMoneySchema.describe(
    "Total assets balance in cents. Raw algebraic sum of signed transaction_lines.amount_cents; signs are NOT normalized by account type.",
  ),
  liabilitiesBalanceCents: SignedMoneySchema.describe(
    "Total liabilities balance in cents. Raw algebraic sum of signed transaction_lines.amount_cents; signs are NOT normalized by account type.",
  ),
  netWorthCents: SignedMoneySchema.describe(
    "Net worth in cents (assets + liabilities). Raw algebraic sum; signs are NOT normalized by account type.",
  ),
});

export type GeneralBalanceResponse = z.infer<
  typeof GeneralBalanceResponseSchema
>;
