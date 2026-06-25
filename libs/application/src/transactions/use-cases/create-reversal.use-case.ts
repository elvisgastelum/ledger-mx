import type {
  TransactionRepository,
  UserId,
  TransactionId,
  TransactionLineId,
  TransactionType,
  TransactionLineTargetType,
} from "@ledger-mx/domain";
import {
  TransactionNotFoundError,
  DuplicateReversalError,
} from "../transaction.errors";
import { FinancialRecordModificationError } from "@ledger-mx/domain";
import type {
  CreateReversalInput,
  CreateReversalOutput,
} from "../transaction.types";

export class CreateReversalUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(input: CreateReversalInput): Promise<CreateReversalOutput> {
    const userId = input.userId as UserId;
    const originalTransactionId = input.originalTransactionId as TransactionId;

    // Find original transaction
    const originalTransaction = await this.transactionRepository.findById(
      userId,
      originalTransactionId,
    );

    if (!originalTransaction) {
      throw new TransactionNotFoundError(input.originalTransactionId);
    }

    // Check if reversal already exists
    const existingReversal =
      await this.transactionRepository.findReversalByOriginalId(
        userId,
        originalTransactionId,
      );

    if (existingReversal) {
      throw new DuplicateReversalError(input.originalTransactionId);
    }

    // Create reversal transaction using domain method
    const reversalLineIds = input.lineIds.map((id) => id as TransactionLineId);

    const reversalTransaction = originalTransaction.createReversal({
      reversalTransactionId: input.id as TransactionId,
      reversalLineIds: reversalLineIds,
      occurredAt: input.transactionDate
        ? new Date(input.transactionDate)
        : undefined,
      description: input.note ?? undefined,
    });

    // Save reversal transaction
    await this.transactionRepository.save(reversalTransaction);

    // Build output - reversalOfTransactionId is guaranteed to be set for reversals
    const totalAmountCents = Math.abs(
      reversalTransaction.lines.reduce(
        (sum, line) => sum + (line.amountCents > 0 ? line.amountCents : 0),
        0,
      ),
    );

    const reversalOfTransactionId = reversalTransaction.reversalOfTransactionId;
    if (!reversalOfTransactionId) {
      throw new FinancialRecordModificationError(
        "Reversal transaction missing reversalOfTransactionId",
      );
    }

    return {
      id: reversalTransaction.id,
      transactionDate: reversalTransaction.occurredAt,
      note: reversalTransaction.description ?? null,
      type: reversalTransaction.type as TransactionType,
      totalAmountCents: totalAmountCents,
      reversalOfTransactionId: reversalOfTransactionId as string,
      lines: reversalTransaction.lines.map((line) => ({
        id: line.id,
        targetType: line.targetType as TransactionLineTargetType,
        accountId:
          line.targetType === "account" ? (line.targetId as string) : null,
        categoryId:
          line.targetType === "category" ? (line.targetId as string) : null,
        envelopeId:
          line.targetType === "envelope" ? (line.targetId as string) : null,
        amountCents: line.amountCents,
        type: line.targetType as TransactionType,
      })),
      createdAt: reversalTransaction.createdAt,
      updatedAt: reversalTransaction.updatedAt,
    };
  }
}
