import type { UserId, EnvelopeId } from "../value-objects/uuid";

/**
 * Envelope entity representing a budgeting envelope.
 * Envelopes are used to allocate funds for specific spending categories.
 * Balances are runtime-derived from transaction lines, not stored.
 */
export interface Envelope {
  /** Unique envelope identifier */
  id: EnvelopeId;
  /** User who owns this envelope */
  userId: UserId;
  /** Display name (e.g., "Groceries", "Dining Out") */
  name: string;
  /** Optional target funding amount in cents (null means no target) */
  targetAmountCents: number | null;
  /** Whether this envelope is protected from overspending */
  isProtected: boolean;
  /** Sort order for display (lower values appear first) */
  sortOrder: number;
  /** When the envelope was created */
  createdAt: Date;
  /** When the envelope was last updated */
  updatedAt: Date;
  /** Soft delete timestamp (null if active) */
  deletedAt?: Date | null;
}
