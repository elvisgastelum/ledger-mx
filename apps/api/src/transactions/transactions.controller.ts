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
  CreateTransactionUseCase,
  ListTransactionsUseCase,
  CreateReversalUseCase,
} from "@ledger-mx/application";
import {
  DuplicateReversalError,
  TransactionNotFoundError,
} from "@ledger-mx/application";
import { FinancialRecordModificationError } from "@ledger-mx/domain";
import type {
  CreateTransactionInput,
  ListTransactionsInput,
  CreateReversalInput,
} from "@ledger-mx/application";
import { contract } from "@ledger-mx/contracts";
import { TsRestHandler, tsRestHandler } from "@ts-rest/nest";
import type {
  TransactionType,
  TransactionLineTargetType,
} from "@ledger-mx/contracts";

// Extend Express Request type to include user property added by JWT guard
interface RequestWithUser extends Request {
  user: {
    sub: string;
  };
}

const toIsoString = (value: string | Date): string =>
  value instanceof Date ? value.toISOString() : value;

@Controller()
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(
    @Inject(CreateTransactionUseCase)
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    @Inject(ListTransactionsUseCase)
    private readonly listTransactionsUseCase: ListTransactionsUseCase,
    @Inject(CreateReversalUseCase)
    private readonly createReversalUseCase: CreateReversalUseCase,
  ) {}

  @TsRestHandler(contract.transactions.list)
  async listTransactions(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.transactions.list, async () => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      const result = await this.listTransactionsUseCase.execute({
        userId,
      } as ListTransactionsInput);

      return {
        status: 200 as const,
        body: {
          transactions: result.transactions.map((tx) => ({
            id: tx.id,
            transactionDate: toIsoString(tx.transactionDate),
            note: tx.note,
            type: tx.type as TransactionType,
            totalAmountCents: tx.totalAmountCents,
            reversalOfTransactionId: tx.reversalOfTransactionId,
            lines: tx.lines.map((line) => ({
              id: line.id,
              targetType: line.targetType as TransactionLineTargetType,
              accountId: line.accountId,
              categoryId: line.categoryId,
              envelopeId: line.envelopeId,
              amountCents: line.amountCents,
              type: line.type as TransactionType,
            })),
            createdAt: toIsoString(tx.createdAt),
            updatedAt: toIsoString(tx.updatedAt),
          })),
        },
      };
    });
  }

  @TsRestHandler(contract.transactions.create)
  async createTransaction(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.transactions.create, async ({ body }) => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        const result = await this.createTransactionUseCase.execute({
          userId,
          id: body.id,
          transactionDate: body.transactionDate,
          note: body.note,
          type: body.type,
          lines: body.lines,
        } as CreateTransactionInput);

        return {
          status: 201 as const,
          body: {
            id: result.id,
            transactionDate: toIsoString(result.transactionDate),
            note: result.note,
            type: result.type as TransactionType,
            totalAmountCents: result.totalAmountCents,
            reversalOfTransactionId: result.reversalOfTransactionId,
            lines: result.lines.map((line) => ({
              id: line.id,
              targetType: line.targetType as TransactionLineTargetType,
              accountId: line.accountId,
              categoryId: line.categoryId,
              envelopeId: line.envelopeId,
              amountCents: line.amountCents,
              type: line.type as TransactionType,
            })),
            createdAt: toIsoString(result.createdAt),
            updatedAt: toIsoString(result.updatedAt),
          },
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  @TsRestHandler(contract.transactions.reverse)
  async reverseTransaction(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(
      contract.transactions.reverse,
      async ({ params, body }) => {
        const user = req.user as { sub: string };
        const userId = userIdFromString(user.sub);
        const originalTransactionId = params.id;

        try {
          const result = await this.createReversalUseCase.execute({
            userId,
            originalTransactionId,
            id: body.id,
            lineIds: body.lineIds,
            transactionDate: body.transactionDate,
            note: body.note,
          } as CreateReversalInput);

          return {
            status: 201 as const,
            body: {
              id: result.id,
              transactionDate: toIsoString(result.transactionDate),
              note: result.note,
              type: result.type as TransactionType,
              totalAmountCents: result.totalAmountCents,
              reversalOfTransactionId: result.reversalOfTransactionId,
              lines: result.lines.map((line) => ({
                id: line.id,
                targetType: line.targetType as TransactionLineTargetType,
                accountId: line.accountId,
                categoryId: line.categoryId,
                envelopeId: line.envelopeId,
                amountCents: line.amountCents,
                type: line.type as TransactionType,
              })),
              createdAt: toIsoString(result.createdAt),
              updatedAt: toIsoString(result.updatedAt),
            },
          };
        } catch (error) {
          if (error instanceof DuplicateReversalError) {
            throw new ConflictException(error.message);
          }
          this.handleError(error);
        }
      },
    );
  }

  private handleError(error: unknown): never {
    if (
      error instanceof NotFoundException ||
      error instanceof ConflictException
    ) {
      throw error;
    }

    if (error instanceof FinancialRecordModificationError) {
      throw new ConflictException(error.message);
    }

    if (error instanceof TransactionNotFoundError) {
      throw new NotFoundException(error.message);
    }

    throw new BadRequestException(
      error instanceof Error ? error.message : "An error occurred",
    );
  }
}
