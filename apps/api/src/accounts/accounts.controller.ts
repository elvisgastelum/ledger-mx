import {
  Controller,
  UseGuards,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { Req } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { userIdFromString } from "@ledger-mx/domain";
import {
  CreateAccountUseCase,
  ListAccountsUseCase,
  UpdateAccountUseCase,
  ArchiveAccountUseCase,
  EnsureSystemAccountsUseCase,
  AccountNotFoundError,
  SystemAccountModificationError,
} from "@ledger-mx/application";
import type {
  CreateAccountInput,
  UpdateAccountInput,
} from "@ledger-mx/application";
import { GetAccountBalancesUseCase } from "@ledger-mx/application";
import { contract } from "@ledger-mx/contracts";
import type { AccountType } from "@ledger-mx/contracts";
import { TsRestHandler, tsRestHandler } from "@ts-rest/nest";

// Extend Express Request type to include user property added by JWT guard
interface RequestWithUser extends Request {
  user: {
    sub: string;
  };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(
    @Inject(CreateAccountUseCase)
    private readonly createAccountUseCase: CreateAccountUseCase,
    @Inject(ListAccountsUseCase)
    private readonly listAccountsUseCase: ListAccountsUseCase,
    @Inject(UpdateAccountUseCase)
    private readonly updateAccountUseCase: UpdateAccountUseCase,
    @Inject(ArchiveAccountUseCase)
    private readonly archiveAccountUseCase: ArchiveAccountUseCase,
    @Inject(EnsureSystemAccountsUseCase)
    private readonly ensureSystemAccountsUseCase: EnsureSystemAccountsUseCase,
    @Inject(GetAccountBalancesUseCase)
    private readonly getAccountBalancesUseCase: GetAccountBalancesUseCase,
  ) {}

  @TsRestHandler(contract.accounts.list)
  async listAccounts(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.accounts.list, async () => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      // Ensure system accounts exist before listing
      await this.ensureSystemAccountsUseCase.execute(userId);

      const result = await this.listAccountsUseCase.execute({
        userId,
      });

      // Get balances for all accounts in one batch
      const accountIds = result.accounts.map((account) => account.id);
      const balances = await this.getAccountBalancesUseCase.execute({
        userId,
        accountIds:
          accountIds as unknown as import("@ledger-mx/domain").AccountId[],
      });
      const balanceMap = new Map(
        balances.map((b) => [b.accountId, b.balanceCents]),
      );

      return {
        status: 200 as const,
        body: {
          accounts: result.accounts.map((account) => ({
            id: account.id,
            name: account.name,
            type: account.type as AccountType,
            balanceCents: balanceMap.get(account.id) ?? 0,
            currency: account.currencyCode,
            status: account.status,
            ownership: account.ownership,
            systemRole: account.systemRole ?? null,
            createdAt: account.createdAt.toISOString(),
            updatedAt: account.updatedAt.toISOString(),
          })),
        },
      };
    });
  }

  @TsRestHandler(contract.accounts.create)
  async createAccount(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.accounts.create, async ({ body }) => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        const result = await this.createAccountUseCase.execute({
          userId,
          name: body.name,
          type: body.type,
          currencyCode: body.currency,
        } as CreateAccountInput);

        // Get the balance for the new account (will be 0 for new accounts)
        const balances = await this.getAccountBalancesUseCase.execute({
          userId,
          accountIds: [
            result.id as unknown as import("@ledger-mx/domain").AccountId,
          ],
        });
        const balanceCents = balances[0]?.balanceCents ?? 0;

        return {
          status: 201 as const,
          body: {
            id: result.id,
            name: result.name,
            type: result.type as AccountType,
            balanceCents,
            currency: result.currencyCode,
            status: result.status,
            ownership: result.ownership,
            systemRole: result.systemRole ?? null,
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
          },
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  @TsRestHandler(contract.accounts.update)
  async updateAccount(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.accounts.update, async ({ body, params }) => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        const result = await this.updateAccountUseCase.execute({
          userId,
          id: params.id,
          name: body.name,
          type: body.type,
          currencyCode: body.currency,
          status: body.status,
        } as UpdateAccountInput);

        // Get the balance for the updated account
        const balances = await this.getAccountBalancesUseCase.execute({
          userId,
          accountIds: [
            result.id as unknown as import("@ledger-mx/domain").AccountId,
          ],
        });
        const balanceCents = balances[0]?.balanceCents ?? 0;

        return {
          status: 200 as const,
          body: {
            id: result.id,
            name: result.name,
            type: result.type as AccountType,
            balanceCents,
            currency: result.currencyCode,
            status: result.status,
            ownership: result.ownership,
            systemRole: result.systemRole ?? null,
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
          },
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  @TsRestHandler(contract.accounts.archive)
  async archiveAccount(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.accounts.archive, async ({ params }) => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        await this.archiveAccountUseCase.execute({
          userId,
          id: params.id,
        });

        return {
          status: 204 as const,
          body: undefined,
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  private handleError(error: unknown): never {
    if (error instanceof AccountNotFoundError) {
      throw new NotFoundException(error.message);
    }

    if (error instanceof SystemAccountModificationError) {
      throw new ForbiddenException(error.message);
    }

    if (
      error instanceof NotFoundException ||
      error instanceof ConflictException
    ) {
      throw error;
    }

    throw new BadRequestException(
      error instanceof Error ? error.message : "An error occurred",
    );
  }
}
