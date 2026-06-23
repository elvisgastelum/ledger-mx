import { eq, and, isNull } from "drizzle-orm";
import { Transaction, TransactionLine } from "@ledger-mx/domain";
import type { TransactionRepository, UserId, TransactionId, TransactionLineId, TransactionLineTargetId } from "@ledger-mx/domain";
import type { Database } from "../connection";
import { transactions, transactionLines } from "../schema";

/**
 * Drizzle ORM implementation of TransactionRepository.
 */
export class DrizzleTransactionRepository implements TransactionRepository {
  constructor(private readonly db: Database) {}

  async save(transaction: Transaction): Promise<void> {
    // Save transaction
    const transactionData = {
      id: transaction.id,
      userId: transaction.userId,
      type: transaction.type,
      occurredAt: transaction.occurredAt,
      description: transaction.description ?? null,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      deletedAt: null,
    };

    await this.db
      .insert(transactions)
      .values(transactionData)
      .onConflictDoUpdate({
        target: transactions.id,
        set: {
          type: transactionData.type,
          occurredAt: transactionData.occurredAt,
          description: transactionData.description,
          updatedAt: new Date(),
        },
        where: eq(transactions.userId, transaction.userId),
      });

    // Delete existing lines for this transaction
    await this.db
      .delete(transactionLines)
      .where(
        and(
          eq(transactionLines.transactionId, transaction.id),
          eq(transactionLines.userId, transaction.userId),
        ),
      );

    // Save new lines
    for (const line of transaction.lines) {
      // Determine which ID field to set based on targetType
      let accountId: string | null = null;
      let envelopeId: string | null = null;
      let categoryId: string | null = null;

      if (line.targetType === "account") {
        accountId = line.targetId as string;
      } else if (line.targetType === "envelope") {
        envelopeId = line.targetId as string;
      } else if (line.targetType === "category") {
        categoryId = line.targetId as string;
      }

      await this.db
        .insert(transactionLines)
        .values({
          id: line.id,
          userId: transaction.userId,
          transactionId: line.transactionId,
          targetType: line.targetType,
          accountId: accountId,
          envelopeId: envelopeId,
          categoryId: categoryId,
          amountCents: line.amountCents,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
          deletedAt: null,
        });
    }
  }

  async findById(userId: UserId, transactionId: TransactionId): Promise<Transaction | null> {
    const txRows = await this.db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.userId, userId),
          isNull(transactions.deletedAt),
        ),
      )
      .limit(1);

    if (txRows.length === 0) {
      return null;
    }

    const txRow = txRows[0];

    // Get lines for this transaction
    const lineRows = await this.db
      .select()
      .from(transactionLines)
      .where(
        and(
          eq(transactionLines.transactionId, transactionId),
          eq(transactionLines.userId, userId),
          isNull(transactionLines.deletedAt),
        ),
      );

    // Map lines to domain objects
    const lines = lineRows.map(
      (row) =>
        new TransactionLine({
          id: row.id as TransactionLineId,
          transactionId: row.transactionId as TransactionId,
          targetType: row.targetType as "account" | "envelope" | "category",
          targetId: this.getTargetId(row) as TransactionLineTargetId,
          amountCents: row.amountCents,
        }),
    );

    // Create Transaction domain object
    return new Transaction({
      id: txRow.id as TransactionId,
      userId: txRow.userId as UserId,
      type: txRow.type as Transaction["type"],
      occurredAt: txRow.occurredAt,
      description: txRow.description ?? undefined,
      lines: lines,
      createdAt: txRow.createdAt,
      updatedAt: txRow.updatedAt,
    });
  }

  async listByUserId(userId: UserId): Promise<Transaction[]> {
    // Get all transactions for user
    const txRows = await this.db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          isNull(transactions.deletedAt),
        ),
      )
      .orderBy(transactions.occurredAt);

    // Get all lines for user's transactions
    const allLineRows = await this.db
      .select()
      .from(transactionLines)
      .where(
        and(
          eq(transactionLines.userId, userId),
          isNull(transactionLines.deletedAt),
        ),
      );

    // Group lines by transactionId
    const linesByTxId = new Map<string, typeof allLineRows>();
    for (const lineRow of allLineRows) {
      const txId = lineRow.transactionId;
      if (!linesByTxId.has(txId)) {
        linesByTxId.set(txId, []);
      }
      linesByTxId.get(txId)!.push(lineRow);
    }

    // Build Transaction objects
    const result: Transaction[] = [];
    for (const txRow of txRows) {
      const lineRows = linesByTxId.get(txRow.id) ?? [];

      const lines = lineRows.map(
        (row) =>
          new TransactionLine({
            id: row.id as TransactionLineId,
            transactionId: row.transactionId as TransactionId,
            targetType: row.targetType as "account" | "envelope" | "category",
            targetId: this.getTargetId(row) as TransactionLineTargetId,
            amountCents: row.amountCents,
          }),
      );

      const tx = new Transaction({
        id: txRow.id as TransactionId,
        userId: txRow.userId as UserId,
        type: txRow.type as Transaction["type"],
        occurredAt: txRow.occurredAt,
        description: txRow.description ?? undefined,
        lines: lines,
        createdAt: txRow.createdAt,
        updatedAt: txRow.updatedAt,
      });

      result.push(tx);
    }

    return result;
  }

  private getTargetId(row: { targetType: string; accountId: string | null; envelopeId: string | null; categoryId: string | null }): string {
    if (row.targetType === "account") {
      return row.accountId!;
    } else if (row.targetType === "envelope") {
      return row.envelopeId!;
    } else if (row.targetType === "category") {
      return row.categoryId!;
    }
    throw new Error(`Unknown targetType: ${row.targetType}`);
  }
}
