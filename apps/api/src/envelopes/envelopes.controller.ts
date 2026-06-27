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
  CreateEnvelopeUseCase,
  ListEnvelopesUseCase,
  GetEnvelopeUseCase,
  UpdateEnvelopeUseCase,
  ArchiveEnvelopeUseCase,
  FundEnvelopeUseCase,
  AllocateEnvelopeUseCase,
  GetEnvelopeBalanceUseCase,
  GetEnvelopeBalancesUseCase,
  GetEnvelopeTransactionsUseCase,
  EnvelopeNotFoundError,
  InsufficientAccountBalanceError,
  ProtectedEnvelopeOverspendError,
} from "@ledger-mx/application";
import type {
  CreateEnvelopeInput,
  UpdateEnvelopeInput,
  FundEnvelopeInput,
  AllocateEnvelopeInput,
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
export class EnvelopesController {
  constructor(
    @Inject(CreateEnvelopeUseCase)
    private readonly createEnvelopeUseCase: CreateEnvelopeUseCase,
    @Inject(ListEnvelopesUseCase)
    private readonly listEnvelopesUseCase: ListEnvelopesUseCase,
    @Inject(GetEnvelopeUseCase)
    private readonly getEnvelopeUseCase: GetEnvelopeUseCase,
    @Inject(UpdateEnvelopeUseCase)
    private readonly updateEnvelopeUseCase: UpdateEnvelopeUseCase,
    @Inject(ArchiveEnvelopeUseCase)
    private readonly archiveEnvelopeUseCase: ArchiveEnvelopeUseCase,
    @Inject(FundEnvelopeUseCase)
    private readonly fundEnvelopeUseCase: FundEnvelopeUseCase,
    @Inject(AllocateEnvelopeUseCase)
    private readonly allocateEnvelopeUseCase: AllocateEnvelopeUseCase,
    @Inject(GetEnvelopeBalanceUseCase)
    private readonly getEnvelopeBalanceUseCase: GetEnvelopeBalanceUseCase,
    @Inject(GetEnvelopeBalancesUseCase)
    private readonly getEnvelopeBalancesUseCase: GetEnvelopeBalancesUseCase,
    @Inject(GetEnvelopeTransactionsUseCase)
    private readonly getEnvelopeTransactionsUseCase: GetEnvelopeTransactionsUseCase,
  ) {}

  @TsRestHandler(contract.envelopes.list)
  async listEnvelopes(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.envelopes.list, async () => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      const result = await this.listEnvelopesUseCase.execute({
        userId,
      });

      // Use batch balance retrieval for efficiency (avoids N+1 queries)
      const envelopeIds = result.envelopes.map((e) => e.id);
      const balancesResult = await this.getEnvelopeBalancesUseCase.execute({
        userId,
        envelopeIds,
      });

      const envelopesWithBalances = result.envelopes.map((envelope) => {
        const balanceCents = balancesResult.balances.get(envelope.id) ?? 0;
        return {
          id: envelope.id,
          name: envelope.name,
          targetAmountCents: envelope.targetAmountCents,
          balanceCents,
          isProtected: envelope.isProtected,
          sortOrder: envelope.sortOrder,
          createdAt: envelope.createdAt.toISOString(),
          updatedAt: envelope.updatedAt.toISOString(),
        };
      });

      return {
        status: 200 as const,
        body: {
          envelopes: envelopesWithBalances,
        },
      };
    });
  }

  @TsRestHandler(contract.envelopes.create)
  async createEnvelope(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.envelopes.create, async ({ body }) => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        const result = await this.createEnvelopeUseCase.execute({
          userId,
          name: body.name,
          targetAmountCents: body.targetAmountCents,
          isProtected: body.isProtected,
        } as CreateEnvelopeInput);

        return {
          status: 201 as const,
          body: {
            id: result.id,
            name: result.name,
            targetAmountCents: result.targetAmountCents,
            balanceCents: 0, // New envelope has zero balance
            isProtected: result.isProtected,
            sortOrder: result.sortOrder,
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
          },
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  @TsRestHandler(contract.envelopes.get)
  async getEnvelope(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.envelopes.get, async ({ params }) => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        const result = await this.getEnvelopeUseCase.execute({
          userId,
          id: params.id,
        });

        // Get actual balance
        const balanceResult = await this.getEnvelopeBalanceUseCase.execute({
          userId,
          envelopeId: params.id,
        });

        return {
          status: 200 as const,
          body: {
            id: result.id,
            name: result.name,
            targetAmountCents: result.targetAmountCents,
            balanceCents: balanceResult.balanceCents,
            isProtected: result.isProtected,
            sortOrder: result.sortOrder,
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
          },
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  @TsRestHandler(contract.envelopes.update)
  async updateEnvelope(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.envelopes.update, async ({ body, params }) => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        const result = await this.updateEnvelopeUseCase.execute({
          userId,
          id: params.id,
          name: body.name,
          targetAmountCents: body.targetAmountCents,
          isProtected: body.isProtected,
        } as UpdateEnvelopeInput);

        // Get actual balance
        const balanceResult = await this.getEnvelopeBalanceUseCase.execute({
          userId,
          envelopeId: params.id,
        });

        return {
          status: 200 as const,
          body: {
            id: result.id,
            name: result.name,
            targetAmountCents: result.targetAmountCents,
            balanceCents: balanceResult.balanceCents,
            isProtected: result.isProtected,
            sortOrder: result.sortOrder,
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
          },
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  @TsRestHandler(contract.envelopes.archive)
  async archiveEnvelope(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.envelopes.archive, async ({ params }) => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        await this.archiveEnvelopeUseCase.execute({
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

  @TsRestHandler(contract.envelopes.fund)
  async fundEnvelope(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.envelopes.fund, async ({ body, params }) => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        const result = await this.fundEnvelopeUseCase.execute({
          userId,
          envelopeId: params.id,
          accountId: body.accountId,
          amountCents: body.amountCents,
        } as FundEnvelopeInput);

        // Get actual balance after funding
        const balanceResult = await this.getEnvelopeBalanceUseCase.execute({
          userId,
          envelopeId: params.id,
        });

        return {
          status: 200 as const,
          body: {
            id: result.id,
            name: result.name,
            targetAmountCents: result.targetAmountCents,
            balanceCents: balanceResult.balanceCents,
            isProtected: result.isProtected,
            sortOrder: result.sortOrder,
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
          },
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  @TsRestHandler(contract.envelopes.allocate)
  async allocateEnvelope(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.envelopes.allocate, async ({ body, params }) => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        const result = await this.allocateEnvelopeUseCase.execute({
          userId,
          envelopeId: params.id,
          accountId: body.accountId,
          amountCents: body.amountCents,
        } as AllocateEnvelopeInput);

        // Get actual balance after allocation
        const balanceResult = await this.getEnvelopeBalanceUseCase.execute({
          userId,
          envelopeId: params.id,
        });

        return {
          status: 200 as const,
          body: {
            id: result.id,
            name: result.name,
            targetAmountCents: result.targetAmountCents,
            balanceCents: balanceResult.balanceCents,
            isProtected: result.isProtected,
            sortOrder: result.sortOrder,
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
          },
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  private handleError(error: unknown): never {
    if (error instanceof EnvelopeNotFoundError) {
      throw new NotFoundException(error.message);
    }

    if (error instanceof InsufficientAccountBalanceError) {
      throw new BadRequestException(error.message);
    }

    if (error instanceof ProtectedEnvelopeOverspendError) {
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

  @TsRestHandler(contract.envelopes.getTransactions)
  async getEnvelopeTransactions(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.envelopes.getTransactions, async ({ params }) => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        const result = await this.getEnvelopeTransactionsUseCase.execute({
          userId,
          envelopeId: params.id,
        });

        const transactions = result.transactions.map((tx) => {
          // Find the envelope line to get the amount for this envelope
          const envelopeLine = tx.lines.find(
            (line) => line.targetType === "envelope" && line.targetId === params.id,
          );
          const totalAmountCents = envelopeLine ? Math.abs(envelopeLine.amountCents) : 0;

          return {
            id: tx.id,
            transactionDate: tx.occurredAt.toISOString(),
            note: tx.description ?? null,
            type: tx.type,
            totalAmountCents,
            reversalOfTransactionId: tx.reversalOfTransactionId ?? null,
            lines: tx.lines.map((line) => ({
              id: line.id,
              targetType: line.targetType,
              accountId: line.targetType === "account" ? line.targetId : null,
              categoryId: line.targetType === "category" ? line.targetId : null,
              envelopeId: line.targetType === "envelope" ? line.targetId : null,
              amountCents: line.amountCents,
              type: tx.type,
            })),
            createdAt: tx.createdAt.toISOString(),
            updatedAt: tx.updatedAt.toISOString(),
          };
        });

        return {
          status: 200 as const,
          body: {
            envelopeId: result.envelopeId,
            transactions,
          },
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }
}
