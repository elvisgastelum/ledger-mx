import type {
  TransactionRepository,
  AccountRepository,
} from "@ledger-mx/domain";
import type {
  GetSpendableBalanceInput,
  SpendableBalanceResult,
} from "../report.types";

/**
 * Use case for calculating spendable balance.
 *
 * Formula:
 * - accountBalance = sum of all account target line amounts from transactions
 * - envelopeAllocations = sum of positive envelope balances
 * - upcomingObligations = 0 (placeholder until MVP card 028)
 * - spendableBalance = accountBalance - envelopeAllocations - upcomingObligations
 */
export class GetSpendableBalanceUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly accountRepository: AccountRepository,
  ) {}

  async execute(
    input: GetSpendableBalanceInput,
  ): Promise<SpendableBalanceResult> {
    const { userId, startDate, endDate } = input;

    // Determine asOfDate for point-in-time calculation
    const asOfDate = endDate ?? startDate ?? undefined;

    // Get transactions up to asOfDate (no start date = from beginning)
    const transactions =
      await this.transactionRepository.findByUserIdAndDateRange(userId, {
        startDate: undefined, // From beginning of time
        endDate: asOfDate,
      });

    // Calculate accountBalance from account target lines
    let accountBalance = 0;
    const envelopeBalances = new Map<string, number>();

    for (const transaction of transactions) {
      for (const line of transaction.lines) {
        if (line.targetType === "account") {
          accountBalance += line.amountCents;
        } else if (line.targetType === "envelope") {
          const envelopeId = line.targetId as string;
          const currentBalance = envelopeBalances.get(envelopeId) ?? 0;
          envelopeBalances.set(envelopeId, currentBalance + line.amountCents);
        }
      }
    }

    // Calculate envelopeAllocations (sum of positive envelope balances)
    let envelopeAllocations = 0;
    for (const balance of Array.from(envelopeBalances.values())) {
      envelopeAllocations += Math.max(0, balance);
    }

    // upcomingObligations = 0 (placeholder until MVP card 028)
    const upcomingObligations = 0;

    // Calculate spendable balance
    const spendableBalance =
      accountBalance - envelopeAllocations - upcomingObligations;

    return {
      accountBalance,
      envelopeAllocations,
      upcomingObligations,
      spendableBalance,
      asOfDate: asOfDate?.toISOString() ?? null,
    };
  }
}
