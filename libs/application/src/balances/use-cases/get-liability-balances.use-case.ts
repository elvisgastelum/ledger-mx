import type { BalanceRepository, UserId } from "@ledger-mx/domain";
import type { GetLiabilityBalancesInput } from "../balance.types";

export class GetLiabilityBalancesUseCase {
  constructor(private readonly balanceRepository: BalanceRepository) {}

  async execute(input: GetLiabilityBalancesInput): Promise<
    Array<{
      accountId: string;
      accountName: string;
      accountType: string;
      balanceCents: number;
    }>
  > {
    const result = await this.balanceRepository.getLiabilityBalances(
      input.userId as UserId,
    );

    return result.map((b) => ({
      accountId: b.accountId,
      accountName: b.accountName,
      accountType: b.accountType,
      balanceCents: b.balanceCents,
    }));
  }
}
