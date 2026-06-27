import type { UserId } from "@ledger-mx/domain";

/**
 * Date range input for report queries
 */
export interface ReportDateRange {
  startDate?: Date;
  endDate?: Date;
}

/**
 * Input for GetSpendableBalanceUseCase
 */
export interface GetSpendableBalanceInput {
  userId: UserId;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Result from GetSpendableBalanceUseCase
 */
export interface SpendableBalanceResult {
  accountBalance: number;
  envelopeAllocations: number;
  upcomingObligations: number;
  spendableBalance: number;
  asOfDate: string | null;
}

/**
 * Input for GetExpensesByCategoryUseCase
 */
export interface GetExpensesByCategoryInput {
  userId: UserId;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Expense data grouped by category group
 */
export interface CategoryGroupExpense {
  categoryGroupId: string;
  categoryGroupName: string;
  totalExpenses: number;
  percentageOfTotal: number;
}

/**
 * Result from GetExpensesByCategoryUseCase
 */
export interface ExpensesByCategoryResult {
  expenses: CategoryGroupExpense[];
  totalExpenses: number;
}

/**
 * Liability account data for debt progress
 */
export interface LiabilityAccountData {
  accountId: string;
  accountName: string;
  accountType: "credit" | "loan";
  currentBalance: number;
}

/**
 * Input for GetDebtProgressUseCase
 */
export interface GetDebtProgressInput {
  userId: UserId;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Result from GetDebtProgressUseCase
 */
export interface DebtProgressResult {
  totalDebt: number;
  paidDebt: number;
  remainingDebt: number;
  progressPercentage: number;
  interest: number;
  payoffDate: string | null;
  liabilityAccounts: LiabilityAccountData[];
}
