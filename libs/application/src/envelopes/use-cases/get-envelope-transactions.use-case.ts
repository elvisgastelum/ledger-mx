import type {
  EnvelopeRepository,
  TransactionRepository,
  UserId,
  EnvelopeId,
} from "@ledger-mx/domain";
import type { Transaction } from "@ledger-mx/domain";
import { EnvelopeNotFoundError } from "../envelope.errors";
import type { GetEnvelopeTransactionsInput } from "../envelope.types";

export class GetEnvelopeTransactionsUseCase {
  constructor(
    private readonly envelopeRepository: EnvelopeRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(input: GetEnvelopeTransactionsInput): Promise<{ envelopeId: string; transactions: Transaction[] }> {
    const userId = input.userId as UserId;
    const envelopeId = input.envelopeId as EnvelopeId;

    // Verify envelope exists and belongs to user
    const envelope = await this.envelopeRepository.findById(userId, envelopeId);
    if (!envelope) {
      throw new EnvelopeNotFoundError(input.envelopeId);
    }

    // Get transactions for the envelope
    const transactions = await this.transactionRepository.findByEnvelopeId(userId, envelopeId);

    return {
      envelopeId: input.envelopeId,
      transactions,
    };
  }
}
