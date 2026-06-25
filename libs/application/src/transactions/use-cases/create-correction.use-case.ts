import { Transaction, TransactionLine } from "@ledger-mx/domain";
import type {
  TransactionRepository,
  UserId,
  TransactionId,
  TransactionLineId,
  AccountId,
  CategoryId,
  EnvelopeId,
  TransactionLineTargetId,
  TransactionType,
  TransactionLineTargetType,
} from "@ledger-mx/domain";
import {
  TransactionNotFoundError,
  DuplicateReversalError,
} from "../transaction.errors";
import type {
  CreateCorrectionInput,
  CreateCorrectionOutput,
} from "../transaction.types";

// TODO: Correction use case is application-level foundation (MVP).
// A future correction endpoint/UX can be added after MVP validation
// to expose this functionality via the API (e.g., POST /transactions/:id/correct).

export class CreateCorrectionUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(input: CreateCorrectionInput): Promise<CreateCorrectionOutput> {
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

    // Create reversal transaction
    const reversalLineIds = input.reversal.lineIds.map(
      (id) => id as TransactionLineId,
    );

    const reversalTransaction = originalTransaction.createReversal({
      reversalTransactionId: input.reversal.id as TransactionId,
      reversalLineIds: reversalLineIds,
      occurredAt: input.reversal.transactionDate
        ? new Date(input.reversal.transactionDate)
        : undefined,
      description: input.reversal.note ?? undefined,
    });

    // Create corrected transaction
    const correctedInput = input.correctedTransaction;
    const correctedTransactionId = correctedInput.id as TransactionId;

    const correctedLines = correctedInput.lines.map((line) => {
      let targetId: TransactionLineTargetId;
      if (line.targetType === "account") {
        if (!line.accountId) {
          throw new Error("accountId is required when targetType is 'account'");
        }
        targetId = line.accountId as AccountId as TransactionLineTargetId;
      } else if (line.targetType === "category") {
        if (!line.categoryId) {
          throw new Error(
            "categoryId is required when targetType is 'category'",
          );
        }
        targetId = line.categoryId as CategoryId as TransactionLineTargetId;
      } else if (line.targetType === "envelope") {
        if (!line.envelopeId) {
          throw new Error(
            "envelopeId is required when targetType is 'envelope'",
          );
        }
        targetId = line.envelopeId as EnvelopeId as TransactionLineTargetId;
      } else {
        throw new Error(`Invalid targetType: ${line.targetType}`);
      }

      return new TransactionLine({
        id: line.id as TransactionLineId,
        transactionId: correctedTransactionId,
        targetType: line.targetType as "account" | "envelope" | "category",
        targetId: targetId,
        amountCents: line.amountCents,
      });
    });

    // Domain constructor validates double-entry invariants (sum to zero)
    const correctedTransaction = new Transaction({
      id: correctedTransactionId,
      userId: userId,
      type: correctedInput.type as TransactionType,
      occurredAt: new Date(correctedInput.transactionDate),
      description: correctedInput.note ?? undefined,
      lines: correctedLines,
    });

    // Save both transactions
    await this.transactionRepository.save(reversalTransaction);
    await this.transactionRepository.save(correctedTransaction);

    // Build reversal output - reversalOfTransactionId is guaranteed to be set for reversals
    const reversalTotalAmountCents = Math.abs(
      reversalTransaction.lines.reduce(
        (sum, line) => sum + (line.amountCents > 0 ? line.amountCents : 0),
        0,
      ),
    );

    const reversalOfTransactionId = reversalTransaction.reversalOfTransactionId;
    if (!reversalOfTransactionId) {
      throw new Error("Reversal transaction missing reversalOfTransactionId");
    }

    const reversalOutput = {
      id: reversalTransaction.id,
      transactionDate: reversalTransaction.occurredAt,
      note: reversalTransaction.description ?? null,
      type: reversalTransaction.type as TransactionType,
      totalAmountCents: reversalTotalAmountCents,
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

    // Build corrected transaction output
    const correctedTotalAmountCents = Math.abs(
      correctedTransaction.lines.reduce(
        (sum, line) => sum + (line.amountCents > 0 ? line.amountCents : 0),
        0,
      ),
    );

    const correctedOutput = {
      id: correctedTransaction.id,
      transactionDate: correctedTransaction.occurredAt,
      note: correctedTransaction.description ?? null,
      type: correctedTransaction.type as TransactionType,
      totalAmountCents: correctedTotalAmountCents,
      reversalOfTransactionId:
        correctedTransaction.reversalOfTransactionId ?? null,
      lines: correctedTransaction.lines.map((line) => ({
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
      createdAt: correctedTransaction.createdAt,
      updatedAt: correctedTransaction.updatedAt,
    };

    return {
      reversal: reversalOutput,
      correctedTransaction: correctedOutput,
    };
  }
}
