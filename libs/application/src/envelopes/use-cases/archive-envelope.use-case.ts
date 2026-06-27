import type { EnvelopeRepository, UserId, EnvelopeId } from "@ledger-mx/domain";
import type { Clock } from "@ledger-mx/application";
import { EnvelopeNotFoundError } from "../envelope.errors";
import type { ArchiveEnvelopeInput } from "../envelope.types";

export class ArchiveEnvelopeUseCase {
  constructor(
    private readonly envelopeRepository: EnvelopeRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ArchiveEnvelopeInput): Promise<void> {
    const envelope = await this.envelopeRepository.findById(
      input.userId as UserId,
      input.id as EnvelopeId,
    );

    if (!envelope) {
      throw new EnvelopeNotFoundError(input.id);
    }

    const now = this.clock.now();

    await this.envelopeRepository.archive(
      input.userId as UserId,
      input.id as EnvelopeId,
      now,
    );
  }
}
