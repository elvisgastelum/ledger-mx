import type { Envelope, EnvelopeRepository, UserId } from "@ledger-mx/domain";
import type { ListEnvelopesInput } from "../envelope.types";

export class ListEnvelopesUseCase {
  constructor(
    private readonly envelopeRepository: EnvelopeRepository,
  ) {}

  async execute(input: ListEnvelopesInput): Promise<{ envelopes: Envelope[] }> {
    const envelopes = await this.envelopeRepository.listByUserId(input.userId as UserId);

    return { envelopes };
  }
}
