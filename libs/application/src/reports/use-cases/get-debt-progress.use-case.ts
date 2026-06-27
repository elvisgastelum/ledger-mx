import type {
  TransactionRepository,
  AccountRepository,
} from "@ledger-mx/domain";
import type {
  GetDebtProgressInput,
  DebtProgressResult,
  LiabilityAccountData,
} from "../report.types";

/**
 * Use case for getting debt payoff progress.
 *
 * Calculates debt progress by:
 * 1. Finding liability accounts (credit and loan types)
 * 2. Calculating current balances from transaction lines up to asOfDate
 * 3. Using placeholder values for paid debt, interest, and payoff date
 */
export class GetDebtProgressUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly accountRepository: AccountRepository,
  ) {}

  async execute(input: GetDebtProgressInput): Promise<DebtProgressResult> {
    const { userId, startDate, endDate } = input;

    // Determine asOfDate for point-in-time calculation
    const asOfDate = endDate ?? startDate ?? undefined;

    // Get liability accounts
    const accounts = await this.accountRepository.listByUserId(userId);
    const liabilityAccounts = accounts.filter(
      (account) => account.type === "credit" || account.type === "loan",
    );

    // Get transactions up to asOfDate to calculate liability balances
    const transactions =
      await this.transactionRepository.findByUserIdAndDateRange(userId, {
        startDate: undefined, // From beginning of time
        endDate: asOfDate,
      });

    // Calculate balances for liability accounts
    const liabilityAccountData: LiabilityAccountData[] = [];
    let totalDebt = 0;

    for (const account of liabilityAccounts) {
      // Calculate account balance from transaction lines
      let balance = 0;
      for (const transaction of transactions) {
        for (const line of transaction.lines) {
          if (line.targetType === "account" && line.targetId === account.id) {
            balance += line.amountCents;
          }
        }
      }

      // For liabilities, negative balance means outstanding debt
      const outstandingDebt = Math.abs(Math.min(0, balance));

      liabilityAccountData.push({
        accountId: account.id as string,
        accountName: account.name,
        accountType: account.type as "credit" | "loan",
        currentBalance: balance, // Signed balance (negative for debt)
      });

      totalDebt += outstandingDebt;
    }

    // Placeholder values (MVP card 028 not yet implemented)
    const paidDebt = 0;
    const progressPercentage = 0;
    const interest = 0;
    const payoffDate = null;

    return {
      totalDebt,
      paidDebt,
      remainingDebt: totalDebt, // Same as totalDebt since paidDebt = 0
      progressPercentage,
      interest,
      payoffDate,
      liabilityAccounts: liabilityAccountData,
    };
  }
}
