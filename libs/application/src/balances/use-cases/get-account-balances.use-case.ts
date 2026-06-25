import type { BalanceRepository, AccountId, UserId } from "@ledger-mx/domain";
import type { GetAccountBalancesInput } from "../balance.types";

export class GetAccountBalancesUseCase {
  constructor(private readonly balanceRepository: BalanceRepository) {}

  async execute(input: GetAccountBalancesInput): Promise<
    Array<{
      accountId: string;
      balanceCents: number;
    }>
  > {
    const balances = await this.balanceRepository.getAccountBalances(
      input.userId as UserId,
      input.accountIds as AccountId[] | undefined,
    );

    // If specific accountIds were requested, ensure all are included (defaulting to 0)
    if (input.accountIds && input.accountIds.length > 0) {
      const balanceMap = new Map(
        balances.map((b) => [b.accountId as string, b.balanceCents]),
      );

      return input.accountIds.map((accountId) => ({
        accountId: accountId as string,
        balanceCents: balanceMap.get(accountId as string) ?? 0,
      }));
    }

    return balances.map((b) => ({
      accountId: b.accountId as string,
      balanceCents: b.balanceCents,
    }));
  }
}
