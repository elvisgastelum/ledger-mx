import { z } from "zod";
import { UuidSchema, MoneySchema, SignedMoneySchema } from "../common.schemas";

/**
 * Transaction type enum values
 */
export const TRANSACTION_TYPES = ["expense", "income", "transfer", "debt_payment", "envelope_allocation"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

/**
 * Schema for a transaction line (double-entry)
 * Lines must sum to zero for a valid transaction
 */
export const TransactionLineSchema = z.object({
  id: UuidSchema,
  accountId: UuidSchema.nullable().describe("Account ID (null for category lines)"),
  categoryId: UuidSchema.nullable().describe("Category ID (null for account lines)"),
  envelopeId: UuidSchema.nullable().describe("Envelope ID (for envelope allocations)"),
  amountCents: SignedMoneySchema,
  type: z.enum(TRANSACTION_TYPES),
}).strict();

export type TransactionLine = z.infer<typeof TransactionLineSchema>;

/**
 * Schema for Transaction response (includes lines for double-entry)
 */
export const TransactionSchema = z.object({
  id: UuidSchema,
  transactionDate: z.string().datetime().describe("Transaction date in UTC"),
  note: z.string().max(500).nullable(),
  type: z.enum(TRANSACTION_TYPES),
  totalAmountCents: MoneySchema.describe("Total transaction amount in cents (absolute value)"),
  lines: z.array(TransactionLineSchema).min(2).describe("Double-entry transaction lines"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

/**
 * Schema for creating a transaction
 * Note: User ID is derived from session, not from request body
 * Client must generate UUID v4 for id and line IDs
 */
export const CreateTransactionRequestSchema = z.object({
  id: UuidSchema.describe("Client-generated UUID v4 for transaction"),
  transactionDate: z.string().datetime().describe("Transaction date in UTC"),
  note: z.string().max(500).nullable().optional(),
  type: z.enum(TRANSACTION_TYPES),
  lines: z.array(TransactionLineSchema).min(2).refine(
    (lines) => lines.reduce((sum, line) => sum + line.amountCents, 0) === 0,
    { message: "Transaction lines must sum to zero (double-entry invariant)" }
  ),
}).strict();

export type CreateTransactionRequest = z.infer<typeof CreateTransactionRequestSchema>;

/**
 * Schema for updating a transaction
 */
export const UpdateTransactionRequestSchema = z.object({
  transactionDate: z.string().datetime().optional(),
  note: z.string().max(500).nullable().optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
  lines: z.array(TransactionLineSchema).min(2).refine(
    (lines) => lines.reduce((sum, line) => sum + line.amountCents, 0) === 0,
    { message: "Transaction lines must sum to zero (double-entry invariant)" }
  ).optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one updatable field must be provided" }
);

export type UpdateTransactionRequest = z.infer<typeof UpdateTransactionRequestSchema>;

/**
 * Schema for single transaction response
 */
export const TransactionResponseSchema = TransactionSchema;

export type TransactionResponse = z.infer<typeof TransactionResponseSchema>;

/**
 * Schema for list transactions response
 */
export const ListTransactionsResponseSchema = z.object({
  transactions: z.array(TransactionSchema),
});

export type ListTransactionsResponse = z.infer<typeof ListTransactionsResponseSchema>;
