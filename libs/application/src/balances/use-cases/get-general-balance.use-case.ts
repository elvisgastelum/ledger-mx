import type { BalanceRepository, UserId, AccountType } from "@ledger-mx/domain";
import type { GeneralBalanceResult } from "../balance.types";

/**
 * Asset account types (positive balance = money you have)
 */
const ASSET_TYPES: AccountType[] = ["cash", "debit", "savings"];

/**
 * Liability account types (positive balance = money you owe)
 */
const LIABILITY_TYPES: AccountType[] = ["credit", "loan"];

export class GetGeneralBalanceUseCase {
  constructor(private readonly balanceRepository: BalanceRepository) {}

  async execute(userId: UserId): Promise<GeneralBalanceResult> {
    const balancesByType =
      await this.balanceRepository.getBalancesByAccountType(userId as UserId);

    let assetsBalanceCents = 0;
    let liabilitiesBalanceCents = 0;

    for (const balance of balancesByType) {
      if (ASSET_TYPES.includes(balance.accountType as AccountType)) {
        assetsBalanceCents += balance.balanceCents;
      } else if (LIABILITY_TYPES.includes(balance.accountType as AccountType)) {
        liabilitiesBalanceCents += balance.balanceCents;
      }
    }

    // Net worth = assets + liabilities (liabilities are typically negative,
    // but we use raw algebraic sums as specified)
    const netWorthCents = assetsBalanceCents + liabilitiesBalanceCents;

    return {
      assetsBalanceCents,
      liabilitiesBalanceCents,
      netWorthCents,
    };
  }
}
