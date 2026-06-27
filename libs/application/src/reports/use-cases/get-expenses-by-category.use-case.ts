import type {
  TransactionRepository,
  CategoryRepository,
  CategoryGroupRepository,
} from "@ledger-mx/domain";
import type {
  GetExpensesByCategoryInput,
  ExpensesByCategoryResult,
  CategoryGroupExpense,
} from "../report.types";

interface CategoryToGroupMap {
  [categoryId: string]: {
    categoryGroupId: string;
    categoryGroupName: string;
  };
}

/**
 * Use case for getting expenses grouped by category.
 *
 * Calculates expenses by:
 * 1. Finding transactions of type "expense" within the date range
 * 2. Summing negative category target line amounts (absolute value)
 * 3. Grouping by category group
 */
export class GetExpensesByCategoryUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly categoryGroupRepository: CategoryGroupRepository,
  ) {}

  async execute(
    input: GetExpensesByCategoryInput,
  ): Promise<ExpensesByCategoryResult> {
    const { userId, startDate, endDate } = input;

    // Get transactions within date range
    const transactions =
      await this.transactionRepository.findByUserIdAndDateRange(userId, {
        startDate,
        endDate,
      });

    // Build category to category group mapping (avoid N+1 queries)
    const categories = await this.categoryRepository.listByUserId(userId);
    const categoryGroups =
      await this.categoryGroupRepository.listByUserId(userId);

    const categoryToGroupMap: CategoryToGroupMap = {};
    for (const category of categories) {
      const group = categoryGroups.find(
        (g) => g.id === category.categoryGroupId,
      );
      if (group) {
        categoryToGroupMap[category.id as string] = {
          categoryGroupId: group.id as string,
          categoryGroupName: group.name,
        };
      }
    }

    // Calculate expenses by category group
    const groupExpenses = new Map<
      string,
      { name: string; totalExpenses: number }
    >();

    for (const transaction of transactions) {
      // Only consider expense transactions
      if (transaction.type !== "expense") {
        continue;
      }

      // Find category target lines with negative amounts (expense)
      for (const line of transaction.lines) {
        if (line.targetType === "category" && line.amountCents < 0) {
          const categoryId = line.targetId as string;
          const groupInfo = categoryToGroupMap[categoryId];

          if (groupInfo) {
            const groupId = groupInfo.categoryGroupId;
            const current = groupExpenses.get(groupId) ?? {
              name: groupInfo.categoryGroupName,
              totalExpenses: 0,
            };
            current.totalExpenses += Math.abs(line.amountCents);
            groupExpenses.set(groupId, current);
          }
        }
      }
    }

    // Calculate total expenses
    let totalExpenses = 0;
    for (const groupData of Array.from(groupExpenses.values())) {
      totalExpenses += groupData.totalExpenses;
    }

    // Build result with percentages
    const expenses: CategoryGroupExpense[] = [];
    for (const [groupId, groupData] of Array.from(groupExpenses.entries())) {
      const percentageOfTotal =
        totalExpenses > 0 ? (groupData.totalExpenses / totalExpenses) * 100 : 0;

      expenses.push({
        categoryGroupId: groupId,
        categoryGroupName: groupData.name,
        totalExpenses: groupData.totalExpenses,
        percentageOfTotal,
      });
    }

    // Sort by totalExpenses descending
    expenses.sort((a, b) => b.totalExpenses - a.totalExpenses);

    return {
      expenses,
      totalExpenses,
    };
  }
}
