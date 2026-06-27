import type {
  EnvelopeRepository,
  UserId,
  EnvelopeId,
} from "@ledger-mx/domain";

/**
 * Input for getting multiple envelope balances.
 */
export interface GetEnvelopeBalancesInput {
  userId: string;
  envelopeIds: string[];
}

/**
 * Result for envelope balances batch operation.
 */
export interface GetEnvelopeBalancesResult {
  balances: Map<string, number>;
}

/**
 * Use case for getting balances for multiple envelopes efficiently.
 * Uses batch repository method to minimize database queries.
 */
export class GetEnvelopeBalancesUseCase {
  constructor(
    private readonly envelopeRepository: EnvelopeRepository,
  ) {}

  async execute(input: GetEnvelopeBalancesInput): Promise<GetEnvelopeBalancesResult> {
    const userId = input.userId as UserId;
    const envelopeIds = input.envelopeIds as EnvelopeId[];

    // Use batch repository method for efficiency
    const balances = await this.envelopeRepository.getBalances(userId, envelopeIds);

    return {
      balances,
    };
  }
}
