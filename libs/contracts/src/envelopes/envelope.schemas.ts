import { z } from "zod";
import { UuidSchema, MoneySchema } from "../common.schemas";

/**
 * Envelope status enum values
 */
export const ENVELOPE_STATUSES = ["active", "funded", "depleted"] as const;
export type EnvelopeStatus = (typeof ENVELOPE_STATUSES)[number];

/**
 * Schema for Envelope response
 */
export const EnvelopeSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1).max(100),
  targetAmountCents: MoneySchema.describe("Target funding amount in cents"),
  currentAmountCents: MoneySchema.describe("Current funded amount in cents"),
  status: z.enum(ENVELOPE_STATUSES),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .describe("YYYY-MM format for envelope month"),
  categoryGroupId: UuidSchema.nullable().describe(
    "Associated category group ID",
  ),
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
    targetAmountCents: MoneySchema,
    month: z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .describe("YYYY-MM format for envelope month"),
    categoryGroupId: UuidSchema.nullable().optional(),
  })
  .strict();

export type CreateEnvelopeRequest = z.infer<typeof CreateEnvelopeRequestSchema>;

/**
 * Schema for updating an envelope
 */
export const UpdateEnvelopeRequestSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    targetAmountCents: MoneySchema.optional(),
    month: z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .optional(),
    categoryGroupId: UuidSchema.nullable().optional(),
  })
  .strict();

export type UpdateEnvelopeRequest = z.infer<typeof UpdateEnvelopeRequestSchema>;

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
