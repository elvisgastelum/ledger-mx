import type { Envelope, EnvelopeRepository, UserId, EnvelopeId } from "@ledger-mx/domain";
import { EnvelopeNotFoundError } from "../envelope.errors";
import type { GetEnvelopeInput } from "../envelope.types";

export class GetEnvelopeUseCase {
  constructor(
    private readonly envelopeRepository: EnvelopeRepository,
  ) {}

  async execute(input: GetEnvelopeInput): Promise<Envelope> {
    const envelope = await this.envelopeRepository.findById(
      input.userId as UserId,
      input.id as EnvelopeId,
    );

    if (!envelope) {
      throw new EnvelopeNotFoundError(input.id);
    }

    return envelope;
  }
}
