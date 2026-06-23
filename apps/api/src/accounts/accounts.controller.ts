import {
  Controller,
  UseGuards,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
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
  AccountNotFoundError,
} from "@ledger-mx/application";
import type { CreateAccountInput, UpdateAccountInput } from "@ledger-mx/application";
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
  ) {}

  @TsRestHandler(contract.accounts.list)
  async listAccounts(@Req() req: RequestWithUser) {
    return tsRestHandler(contract.accounts.list, async () => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      const result = await this.listAccountsUseCase.execute({
        userId,
      });

      return {
        status: 200 as const,
        body: {
          accounts: result.accounts.map((account) => ({
            id: account.id,
            name: account.name,
            type: account.type as AccountType,
            balanceCents: 0, // TODO: compute from transaction lines
            currency: account.currencyCode,
            isActive: !account.isArchived,
            createdAt: account.createdAt.toISOString(),
            updatedAt: account.updatedAt.toISOString(),
          })),
        },
      };
    });
  }

  @TsRestHandler(contract.accounts.create)
  async createAccount(@Req() req: RequestWithUser) {
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

          return {
            status: 201 as const,
            body: {
              id: result.id,
              name: result.name,
              type: result.type as AccountType,
              balanceCents: 0, // TODO: compute from transaction lines
              currency: result.currencyCode,
              isActive: !result.isArchived,
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
  async updateAccount(@Req() req: RequestWithUser) {
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
          isArchived: body.isActive === false ? true : undefined,
        } as UpdateAccountInput);

          return {
            status: 200 as const,
            body: {
              id: result.id,
              name: result.name,
              type: result.type as AccountType,
              balanceCents: 0, // TODO: compute from transaction lines
              currency: result.currencyCode,
              isActive: !result.isArchived,
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
  async archiveAccount(@Req() req: RequestWithUser) {
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

    if (error instanceof NotFoundException || error instanceof ConflictException) {
      throw error;
    }

    throw new BadRequestException(
      error instanceof Error ? error.message : "An error occurred",
    );
  }
}
