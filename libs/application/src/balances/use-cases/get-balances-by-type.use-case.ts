import type { BalanceRepository, UserId } from "@ledger-mx/domain";
import type { GetBalancesByTypeInput } from "../balance.types";

export class GetBalancesByTypeUseCase {
  constructor(private readonly balanceRepository: BalanceRepository) {}

  async execute(input: GetBalancesByTypeInput): Promise<
    Array<{
      accountType: string;
      balanceCents: number;
      accountCount: number;
    }>
  > {
    const result = await this.balanceRepository.getBalancesByAccountType(
      input.userId as UserId,
    );

    return result.map((b) => ({
      accountType: b.accountType,
      balanceCents: b.balanceCents,
      accountCount: b.accountCount,
    }));
  }
}
