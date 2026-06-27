import { EnvelopeBuilder } from "@ledger-mx/domain";
import type { Envelope, EnvelopeRepository, UserId, EnvelopeId } from "@ledger-mx/domain";
import type { IdGenerator, Clock } from "@ledger-mx/application";
import type { CreateEnvelopeInput } from "../envelope.types";

/**
 * Default sort order for user-created envelopes.
 * Values < 100 are reserved for system default envelopes.
 */
const DEFAULT_USER_ENVELOPE_SORT_ORDER = 100;

export class CreateEnvelopeUseCase {
  constructor(
    private readonly envelopeRepository: EnvelopeRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateEnvelopeInput): Promise<Envelope> {
    const now = this.clock.now();

    const envelope = new EnvelopeBuilder()
      .withId(this.idGenerator.uuid() as EnvelopeId)
      .withUserId(input.userId as UserId)
      .withName(input.name)
      .withTargetAmountCents(input.targetAmountCents ?? null)
      .withIsProtected(input.isProtected ?? true)
      .withSortOrder(DEFAULT_USER_ENVELOPE_SORT_ORDER)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .withDeletedAt(null)
      .build();

    await this.envelopeRepository.save(envelope);

    return envelope;
  }
}
