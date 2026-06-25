import {
  Controller,
  UseGuards,
  Inject,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { Req } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { userIdFromString } from "@ledger-mx/domain";
import {
  GetAccountBalanceUseCase,
  GetAccountBalancesUseCase,
  GetBalancesByTypeUseCase,
  GetLiabilityBalancesUseCase,
  GetGeneralBalanceUseCase,
  AccountBalanceNotFoundError,
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
export class BalancesController {
  constructor(
    @Inject(GetAccountBalanceUseCase)
    private readonly getAccountBalanceUseCase: GetAccountBalanceUseCase,
    @Inject(GetAccountBalancesUseCase)
    private readonly getAccountBalancesUseCase: GetAccountBalancesUseCase,
    @Inject(GetBalancesByTypeUseCase)
    private readonly getBalancesByTypeUseCase: GetBalancesByTypeUseCase,
    @Inject(GetLiabilityBalancesUseCase)
    private readonly getLiabilityBalancesUseCase: GetLiabilityBalancesUseCase,
    @Inject(GetGeneralBalanceUseCase)
    private readonly getGeneralBalanceUseCase: GetGeneralBalanceUseCase,
  ) {}

  @TsRestHandler(contract.balances.general)
  async getGeneralBalance(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.balances.general, async () => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        const result = await this.getGeneralBalanceUseCase.execute(userId);

        return {
          status: 200 as const,
          body: {
            assetsBalanceCents: result.assetsBalanceCents,
            liabilitiesBalanceCents: result.liabilitiesBalanceCents,
            netWorthCents: result.netWorthCents,
          },
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  @TsRestHandler(contract.balances.getAccount)
  async getAccountBalance(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.balances.getAccount, async ({ params }) => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        const result = await this.getAccountBalanceUseCase.execute({
          userId,
          accountId:
            params.accountId as unknown as import("@ledger-mx/domain").AccountId,
        });

        return {
          status: 200 as const,
          body: {
            accountId: result.accountId as string,
            balanceCents: result.balanceCents,
          },
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  @TsRestHandler(contract.balances.byAccountType)
  async getBalancesByType(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.balances.byAccountType, async () => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        const result = await this.getBalancesByTypeUseCase.execute({
          userId,
        });

        return {
          status: 200 as const,
          body: {
            balances: result.map((b) => ({
              accountType: b.accountType as
                | "debit"
                | "credit"
                | "loan"
                | "savings"
                | "cash",
              balanceCents: b.balanceCents,
              accountCount: b.accountCount,
            })),
          },
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  @TsRestHandler(contract.balances.liabilities)
  async getLiabilityBalances(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.balances.liabilities, async () => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        const result = await this.getLiabilityBalancesUseCase.execute({
          userId,
        });

        return {
          status: 200 as const,
          body: {
            liabilities: result.map((b) => ({
              accountId: b.accountId as string,
              accountName: b.accountName,
              accountType: b.accountType as "credit" | "loan",
              balanceCents: b.balanceCents,
            })),
          },
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  private handleError(error: unknown): never {
    if (error instanceof AccountBalanceNotFoundError) {
      throw new NotFoundException(error.message);
    }

    if (
      error instanceof NotFoundException ||
      error instanceof BadRequestException
    ) {
      throw error;
    }

    throw new InternalServerErrorException(
      error instanceof Error ? error.message : "An error occurred",
    );
  }
}
