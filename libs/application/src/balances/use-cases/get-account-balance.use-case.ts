import type { BalanceRepository, AccountId, UserId } from "@ledger-mx/domain";
import type { GetAccountBalanceInput } from "../balance.types";
import { AccountBalanceNotFoundError } from "../balance.errors";

export class GetAccountBalanceUseCase {
  constructor(private readonly balanceRepository: BalanceRepository) {}

  async execute(input: GetAccountBalanceInput): Promise<{
    accountId: string;
    balanceCents: number;
  }> {
    const result = await this.balanceRepository.getAccountBalance(
      input.userId as UserId,
      input.accountId as AccountId,
    );

    if (result === null) {
      throw new AccountBalanceNotFoundError(input.accountId as string);
    }

    return {
      accountId: result.accountId,
      balanceCents: result.balanceCents,
    };
  }
}
