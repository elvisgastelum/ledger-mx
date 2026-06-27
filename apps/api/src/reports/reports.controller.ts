import {
  Controller,
  UseGuards,
  Inject,
  InternalServerErrorException,
} from "@nestjs/common";
import { Req } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { userIdFromString } from "@ledger-mx/domain";
import {
  GetSpendableBalanceUseCase,
  GetExpensesByCategoryUseCase,
  GetDebtProgressUseCase,
} from "@ledger-mx/application";
import { contract } from "@ledger-mx/contracts";
import { TsRestHandler, tsRestHandler } from "@ts-rest/nest";

// Extend Express Request type to include user property added by JWT guard
interface RequestWithUser extends Request {
  user: {
    sub: string;
  };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    @Inject(GetSpendableBalanceUseCase)
    private readonly getSpendableBalanceUseCase: GetSpendableBalanceUseCase,
    @Inject(GetExpensesByCategoryUseCase)
    private readonly getExpensesByCategoryUseCase: GetExpensesByCategoryUseCase,
    @Inject(GetDebtProgressUseCase)
    private readonly getDebtProgressUseCase: GetDebtProgressUseCase,
  ) {}

  @TsRestHandler(contract.reports.getSpendableBalance)
  async getSpendableBalance(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(
      contract.reports.getSpendableBalance,
      async ({ query }) => {
        const user = req.user as { sub: string };
        const userId = userIdFromString(user.sub);

        try {
          const startDate = query?.startDate
            ? new Date(query.startDate)
            : undefined;
          const endDate = query?.endDate ? new Date(query.endDate) : undefined;

          const result = await this.getSpendableBalanceUseCase.execute({
            userId,
            startDate,
            endDate,
          });

          return {
            status: 200 as const,
            body: {
              accountBalance: result.accountBalance,
              envelopeAllocations: result.envelopeAllocations,
              upcomingObligations: result.upcomingObligations,
              spendableBalance: result.spendableBalance,
              asOfDate: result.asOfDate,
            },
          };
        } catch (error) {
          this.handleError(error);
        }
      },
    );
  }

  @TsRestHandler(contract.reports.getExpensesByCategory)
  async getExpensesByCategory(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(
      contract.reports.getExpensesByCategory,
      async ({ query }) => {
        const user = req.user as { sub: string };
        const userId = userIdFromString(user.sub);

        try {
          const startDate = query?.startDate
            ? new Date(query.startDate)
            : undefined;
          const endDate = query?.endDate ? new Date(query.endDate) : undefined;

          const result = await this.getExpensesByCategoryUseCase.execute({
            userId,
            startDate,
            endDate,
          });

          return {
            status: 200 as const,
            body: result.expenses.map((exp) => ({
              categoryGroupId: exp.categoryGroupId,
              categoryGroupName: exp.categoryGroupName,
              totalExpenses: exp.totalExpenses,
              percentageOfTotal: exp.percentageOfTotal,
            })),
          };
        } catch (error) {
          this.handleError(error);
        }
      },
    );
  }

  @TsRestHandler(contract.reports.getDebtProgress)
  async getDebtProgress(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(
      contract.reports.getDebtProgress,
      async ({ query }) => {
        const user = req.user as { sub: string };
        const userId = userIdFromString(user.sub);

        try {
          const startDate = query?.startDate
            ? new Date(query.startDate)
            : undefined;
          const endDate = query?.endDate ? new Date(query.endDate) : undefined;

          const result = await this.getDebtProgressUseCase.execute({
            userId,
            startDate,
            endDate,
          });

          return {
            status: 200 as const,
            body: {
              totalDebt: result.totalDebt,
              paidDebt: result.paidDebt,
              remainingDebt: result.remainingDebt,
              progressPercentage: result.progressPercentage,
              interest: result.interest,
              payoffDate: result.payoffDate,
              liabilityAccounts: result.liabilityAccounts.map((acc) => ({
                accountId: acc.accountId,
                accountName: acc.accountName,
                accountType: acc.accountType,
                currentBalance: acc.currentBalance,
              })),
            },
          };
        } catch (error) {
          this.handleError(error);
        }
      },
    );
  }

  private handleError(error: unknown): never {
    if (
      error instanceof InternalServerErrorException ||
      error instanceof Error
    ) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "An error occurred",
      );
    }

    throw new InternalServerErrorException("An error occurred");
  }
}
