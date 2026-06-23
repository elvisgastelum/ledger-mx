import type { TransactionRepository, UserId } from "@ledger-mx/domain";
import type { ListTransactionsInput, ListTransactionsOutput } from "../transaction.types";

export class ListTransactionsUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(input: ListTransactionsInput): Promise<ListTransactionsOutput> {
    const transactions = await this.transactionRepository.listByUserId(input.userId as UserId);

    return {
      transactions: transactions.map((tx) => {
        // Compute totalAmountCents as the sum of positive lines
        const totalAmountCents = Math.abs(
          tx.lines.reduce((sum, line) => sum + (line.amountCents > 0 ? line.amountCents : 0),0)
        );

        return {
          id: tx.id,
          transactionDate: tx.occurredAt,
          note: tx.description ?? null,
          type: tx.type,
          totalAmountCents: totalAmountCents,
          lines: tx.lines.map((line) => {
            // Map targetType and targetId to contract shape
            let accountId: string | null = null;
            let categoryId: string | null = null;
            let envelopeId: string | null = null;

            if (line.targetType === "account") {
              accountId = line.targetId as string;
            } else if (line.targetType === "category") {
              categoryId = line.targetId as string;
            } else if (line.targetType === "envelope") {
              envelopeId = line.targetId as string;
            }

            return {
              id: line.id,
              targetType: line.targetType,
              accountId: accountId,
              categoryId: categoryId,
              envelopeId: envelopeId,
              amountCents: line.amountCents,
              type: tx.type,
            };
          }),
          createdAt: tx.createdAt,
          updatedAt: tx.updatedAt,
        };
      }),
    };
  }
}
