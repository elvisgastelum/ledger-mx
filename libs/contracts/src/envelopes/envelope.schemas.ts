import { z } from "zod";
import { UuidSchema, MoneySchema, SignedMoneySchema } from "../common.schemas";

/**
 * Schema for Envelope response
 * Balance is runtime-derived from transaction lines, not stored.
 */
export const EnvelopeSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(100),
  targetAmountCents: MoneySchema.nullable().describe("Target funding amount in cents (null = no target)"),
  balanceCents: SignedMoneySchema.describe("Current balance derived from transactions"),
  isProtected: z.boolean().describe("Whether this envelope is protected from overspending"),
  sortOrder: z.number().int().describe("Sort order for display"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Envelope = z.infer<typeof EnvelopeSchema>;

/**
 * Schema for creating an envelope
 * Note: User ID is derived from session, not from request body
 */
export const CreateEnvelopeRequestSchema = z
  .object({
    name: z.string().min(1).max(100),
    targetAmountCents: MoneySchema.nullable().optional(),
    isProtected: z.boolean().optional().default(true),
  })
  .strict();

export type CreateEnvelopeRequest = z.infer<typeof CreateEnvelopeRequestSchema>;

/**
 * Schema for updating an envelope
 */
export const UpdateEnvelopeRequestSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    targetAmountCents: MoneySchema.nullable().optional(),
    isProtected: z.boolean().optional(),
  })
  .strict();

export type UpdateEnvelopeRequest = z.infer<typeof UpdateEnvelopeRequestSchema>;

/**
 * Schema for funding an envelope from an account
 */
export const FundEnvelopeRequestSchema = z
  .object({
    accountId: UuidSchema.describe("Source account ID to fund from"),
    amountCents: MoneySchema.describe("Amount to fund in cents (positive integer)"),
  })
  .strict();

export type FundEnvelopeRequest = z.infer<typeof FundEnvelopeRequestSchema>;

/**
 * Schema for allocating budget to an envelope
 * Allocation creates a transaction of type 'envelope_allocation'
 */
export const AllocateEnvelopeRequestSchema = z
  .object({
    accountId: UuidSchema.describe("Source account ID to allocate from"),
    amountCents: MoneySchema.describe("Amount to allocate in cents (positive integer)"),
  })
  .strict();

export type AllocateEnvelopeRequest = z.infer<typeof AllocateEnvelopeRequestSchema>;

/**
 * Schema for single envelope response
 */
export const EnvelopeResponseSchema = EnvelopeSchema;

export type EnvelopeResponse = z.infer<typeof EnvelopeResponseSchema>;

/**
 * Schema for list envelopes response
 */
export const ListEnvelopesResponseSchema = z.object({
  envelopes: z.array(EnvelopeSchema),
});

export type ListEnvelopesResponse = z.infer<typeof ListEnvelopesResponseSchema>;

/**
 * Schema for envelope balance response
 */
export const EnvelopeBalanceResponseSchema = z.object({
  envelopeId: UuidSchema,
  balanceCents: SignedMoneySchema,
});

export type EnvelopeBalanceResponse = z.infer<typeof EnvelopeBalanceResponseSchema>;

/**
 * Schema for envelope transactions response
 */
export const EnvelopeTransactionsResponseSchema = z.object({
  envelopeId: UuidSchema,
  transactions: z.array(z.object({
    id: UuidSchema,
    transactionDate: z.string().datetime(),
    note: z.string().max(500).nullable(),
    type: z.enum(["income", "expense", "transfer", "adjustment", "reversal", "debt_payment", "envelope_allocation"]),
    totalAmountCents: MoneySchema,
    reversalOfTransactionId: UuidSchema.nullable(),
    lines: z.array(z.object({
      id: UuidSchema,
      targetType: z.enum(["account", "envelope", "category"]),
      accountId: UuidSchema.nullable(),
      categoryId: UuidSchema.nullable(),
      envelopeId: UuidSchema.nullable(),
      amountCents: SignedMoneySchema,
      type: z.enum(["income", "expense", "transfer", "adjustment", "reversal", "debt_payment", "envelope_allocation"]),
    })),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })),
});

export type EnvelopeTransactionsResponse = z.infer<typeof EnvelopeTransactionsResponseSchema>;
