import type { Envelope } from "../ledger/envelope";
import type { UserId, EnvelopeId } from "../value-objects/uuid";

/**
 * Repository interface for persisting and retrieving Envelopes.
 * Framework-agnostic, no implementation details.
 */
export interface EnvelopeRepository {
  /** Saves an envelope (creates or updates). */
  save(envelope: Envelope): Promise<void>;

  /** Retrieves an envelope by user ID and envelope ID, returns null if not found. */
  findById(userId: UserId, envelopeId: EnvelopeId): Promise<Envelope | null>;

  /** Lists all non-archived envelopes for a user. */
  listByUserId(userId: UserId): Promise<Envelope[]>;

  /** Soft-archives an envelope by setting deletedAt to the current time. */
  archive(userId: UserId, envelopeId: EnvelopeId, deletedAt: Date): Promise<void>;

  /**
   * Gets the current balance for a specific envelope.
   * Balance is derived from transaction lines where targetType is 'envelope'.
   * Returns 0 if no transactions exist for the envelope.
   */
  getBalance(userId: UserId, envelopeId: EnvelopeId): Promise<number>;

  /**
   * Gets balances for multiple envelopes.
   * Returns a map of envelopeId to balanceCents.
   */
  getBalances(userId: UserId, envelopeIds: EnvelopeId[]): Promise<Map<string, number>>;

  /**
   * Finds default system envelopes for a user.
   * Used for idempotent onboarding.
   */
  findDefaultEnvelopes(userId: UserId): Promise<Envelope[]>;
}
