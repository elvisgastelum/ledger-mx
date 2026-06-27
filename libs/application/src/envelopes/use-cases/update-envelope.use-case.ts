import type { Envelope, EnvelopeRepository, UserId, EnvelopeId } from "@ledger-mx/domain";
import type { Clock } from "@ledger-mx/application";
import { EnvelopeNotFoundError } from "../envelope.errors";
import type { UpdateEnvelopeInput } from "../envelope.types";

export class UpdateEnvelopeUseCase {
  constructor(
    private readonly envelopeRepository: EnvelopeRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: UpdateEnvelopeInput): Promise<Envelope> {
    const envelope = await this.envelopeRepository.findById(
      input.userId as UserId,
      input.id as EnvelopeId,
    );

    if (!envelope) {
      throw new EnvelopeNotFoundError(input.id);
    }

    const now = this.clock.now();

    // Update fields if provided
    const updatedEnvelope = {
      ...envelope,
      name: input.name ?? envelope.name,
      targetAmountCents: input.targetAmountCents ?? envelope.targetAmountCents,
      isProtected: input.isProtected ?? envelope.isProtected,
      updatedAt: now,
    };

    await this.envelopeRepository.save(updatedEnvelope);

    return updatedEnvelope;
  }
}
