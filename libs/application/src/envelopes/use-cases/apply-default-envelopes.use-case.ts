import type { UserId, EnvelopeId } from "@ledger-mx/domain";
import type { Envelope, EnvelopeRepository } from "@ledger-mx/domain";
import type { IdGenerator, Clock } from "@ledger-mx/application";
import { EnvelopeBuilder } from "@ledger-mx/domain";
import { EnvelopeOnboardingConflictError } from "../envelope.errors";
import type {
  ApplyDefaultEnvelopesInput,
  ApplyDefaultEnvelopesResult,
} from "../envelope.types";

/**
 * Default envelope definitions for onboarding.
 */
const DEFAULT_ENVELOPES = [
  { name: "Groceries", targetAmountCents: null as number | null, isProtected: true, sortOrder: 0 },
  { name: "Dining Out", targetAmountCents: null as number | null, isProtected: true, sortOrder: 1 },
  { name: "Transportation", targetAmountCents: null as number | null, isProtected: true, sortOrder: 2 },
  { name: "Utilities", targetAmountCents: null as number | null, isProtected: true, sortOrder: 3 },
  { name: "Emergency Fund", targetAmountCents: null as number | null, isProtected: true, sortOrder: 4 },
  { name: "Goals", targetAmountCents: null as number | null, isProtected: false, sortOrder: 5 },
];

export class ApplyDefaultEnvelopesUseCase {
  constructor(
    private readonly envelopeRepository: EnvelopeRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(
    input: ApplyDefaultEnvelopesInput,
  ): Promise<ApplyDefaultEnvelopesResult> {
    const userId = input.userId;

    // Get existing active envelopes for the user
    const existingEnvelopes = await this.envelopeRepository.listByUserId(userId);

    // If no existing envelopes, create all default envelopes
    if (existingEnvelopes.length === 0) {
      return this.createDefaultEnvelopes(userId);
    }

    // Check if existing envelopes match the default layout exactly
    const matchingEnvelopes = this.findMatchingEnvelopes(existingEnvelopes);

    // Idempotency check: all default envelopes exist and match
    if (matchingEnvelopes.length === DEFAULT_ENVELOPES.length) {
      return {
        envelopes: matchingEnvelopes.map((envelope) => ({
          id: envelope.id,
          name: envelope.name,
          targetAmountCents: envelope.targetAmountCents,
          isProtected: envelope.isProtected,
          sortOrder: envelope.sortOrder,
          createdAt: envelope.createdAt,
          updatedAt: envelope.updatedAt,
        })),
        created: false,
      };
    }

    // Existing envelopes don't match the defaults - conflict
    const existingEnvelopeNames = existingEnvelopes.map((e) => e.name);
    throw new EnvelopeOnboardingConflictError(existingEnvelopeNames);
  }

  private findMatchingEnvelopes(
    existingEnvelopes: Envelope[],
  ): Envelope[] {
    const matches: Envelope[] = [];

    for (const def of DEFAULT_ENVELOPES) {
      const match = existingEnvelopes.find(
        (envelope) =>
          envelope.name === def.name &&
          envelope.isProtected === def.isProtected,
      );

      if (match) {
        matches.push(match);
      }
    }

    return matches;
  }

  private async createDefaultEnvelopes(
    userId: UserId,
  ): Promise<ApplyDefaultEnvelopesResult> {
    const now = this.clock.now();
    const createdEnvelopes: Array<{
      id: string;
      name: string;
      targetAmountCents: number | null;
      isProtected: boolean;
      sortOrder: number;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    for (const def of DEFAULT_ENVELOPES) {
      const envelopeId = this.idGenerator.uuid() as EnvelopeId;

      const envelope = new EnvelopeBuilder()
        .withId(envelopeId)
        .withUserId(userId)
        .withName(def.name)
        .withTargetAmountCents(def.targetAmountCents)
        .withIsProtected(def.isProtected)
        .withSortOrder(def.sortOrder)
        .withCreatedAt(now)
        .withUpdatedAt(now)
        .withDeletedAt(null)
        .build();

      await this.envelopeRepository.save(envelope);

      createdEnvelopes.push({
        id: envelope.id,
        name: envelope.name,
        targetAmountCents: envelope.targetAmountCents,
        isProtected: envelope.isProtected,
        sortOrder: envelope.sortOrder,
        createdAt: envelope.createdAt,
        updatedAt: envelope.updatedAt,
      });
    }

    return {
      envelopes: createdEnvelopes,
      created: true,
    };
  }
}
