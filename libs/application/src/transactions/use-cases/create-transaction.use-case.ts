import { Transaction, TransactionLine } from "@ledger-mx/domain";
import type {
  TransactionRepository,
  CategoryRepository,
  AccountRepository,
  EnvelopeRepository,
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
import type {
  CreateTransactionInput,
  CreateTransactionOutput,
} from "../transaction.types";
import { TransactionTargetNotFoundError } from "../transaction.errors";
import { ProtectedEnvelopeOverspendError } from "../../envelopes/envelope.errors";

export class CreateTransactionUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly accountRepository: AccountRepository,
    private readonly envelopeRepository: EnvelopeRepository,
  ) {}

  async execute(
    input: CreateTransactionInput,
  ): Promise<CreateTransactionOutput> {
    const userId = input.userId as UserId;
    const transactionId = input.id as TransactionId;

    // Validate line targets belong to the user
    for (const line of input.lines) {
      if (line.targetType === "account" && line.accountId) {
        const account = await this.accountRepository.findById(
          userId,
          line.accountId as AccountId,
        );
        if (!account) {
          throw new TransactionTargetNotFoundError("Account", line.accountId);
        }
      } else if (line.targetType === "category" && line.categoryId) {
        const category = await this.categoryRepository.findById(
          userId,
          line.categoryId as CategoryId,
        );
        if (!category || category.deletedAt) {
          throw new TransactionTargetNotFoundError("Category", line.categoryId);
        }
      } else if (line.targetType === "envelope" && line.envelopeId) {
        const envelope = await this.envelopeRepository.findById(
          userId,
          line.envelopeId as EnvelopeId,
        );
        if (!envelope || envelope.deletedAt) {
          throw new TransactionTargetNotFoundError("Envelope", line.envelopeId);
        }
      }
    }

    // Map contract lines to domain TransactionLine objects
    const lines = input.lines.map((line) => {
      // Determine targetId based on targetType
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
        transactionId: transactionId,
        targetType: line.targetType as "account" | "envelope" | "category",
        targetId: targetId,
        amountCents: line.amountCents,
      });
    });

    // Check for protected envelope overspend
    for (const line of lines) {
      if (line.targetType === "envelope" && line.amountCents < 0) {
        // This is spending from an envelope (negative amount)
        const envelopeId = line.targetId as EnvelopeId;
        
        // Get envelope to check if protected
        const envelope = await this.envelopeRepository.findById(userId, envelopeId);
        if (!envelope) {
          throw new TransactionTargetNotFoundError("Envelope", envelopeId as string);
        }

        // Skip check if envelope is not protected
        if (!envelope.isProtected) {
          continue;
        }

        // Get current envelope balance
        const currentBalance = await this.envelopeRepository.getBalance(userId, envelopeId);

        // Calculate resulting balance
        const resultingBalance = currentBalance + line.amountCents; // amountCents is negative

        // Reject if resulting balance would be negative
        if (resultingBalance < 0) {
          throw new ProtectedEnvelopeOverspendError(
            envelopeId as string,
            currentBalance,
            Math.abs(line.amountCents),
          );
        }
      }
    }

    // Create Transaction (validates invariants: 2+ lines, sum to zero)
    const transaction = new Transaction({
      id: transactionId,
      userId: userId,
      type: input.type as
        | "income"
        | "expense"
        | "transfer"
        | "adjustment"
        | "reversal"
        | "debt_payment",
      occurredAt: new Date(input.transactionDate),
      description: input.note ?? undefined,
      lines: lines,
    });

    // Save transaction (repository handles saving lines too)
    await this.transactionRepository.save(transaction);

    // Return contract-shaped response
    const totalAmountCents = Math.abs(
      lines.reduce(
        (sum, line) => sum + (line.amountCents > 0 ? line.amountCents : 0),
        0,
      ),
    );

    return {
      id: transaction.id,
      transactionDate: transaction.occurredAt,
      note: input.note ?? null,
      type: transaction.type as TransactionType,
      totalAmountCents: totalAmountCents,
      reversalOfTransactionId: transaction.reversalOfTransactionId ?? null,
      lines: input.lines.map((line) => ({
        id: line.id,
        targetType: line.targetType as TransactionLineTargetType,
        accountId: line.accountId,
        categoryId: line.categoryId,
        envelopeId: line.envelopeId,
        amountCents: line.amountCents,
        type: line.type as TransactionType,
      })),
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
