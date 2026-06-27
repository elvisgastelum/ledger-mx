import type {
  EnvelopeRepository,
  UserId,
  EnvelopeId,
} from "@ledger-mx/domain";
import { EnvelopeNotFoundError } from "../envelope.errors";
import type { GetEnvelopeBalanceInput } from "../envelope.types";

export class GetEnvelopeBalanceUseCase {
  constructor(
    private readonly envelopeRepository: EnvelopeRepository,
  ) {}

  async execute(input: GetEnvelopeBalanceInput): Promise<{ envelopeId: string; balanceCents: number }> {
    const userId = input.userId as UserId;
    const envelopeId = input.envelopeId as EnvelopeId;

    // Verify envelope exists
    const envelope = await this.envelopeRepository.findById(userId, envelopeId);
    if (!envelope) {
      throw new EnvelopeNotFoundError(input.envelopeId);
    }

    // Get balance from repository (derived from transaction lines)
    const balanceCents = await this.envelopeRepository.getBalance(userId, envelopeId);

    return {
      envelopeId: input.envelopeId,
      balanceCents,
    };
  }
}
