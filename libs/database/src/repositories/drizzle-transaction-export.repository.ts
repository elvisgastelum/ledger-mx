import { eq, and, isNull, gte, lte } from "drizzle-orm";
import type { Database } from "../connection";
import {
  transactions,
  transactionLines,
  accounts,
  categories,
} from "../schema";
import type {
  TransactionExportRepository,
  TransactionExportRow,
} from "@ledger-mx/application";
import type { UserId } from "@ledger-mx/domain";

/**
 * Repository for exporting transaction data to CSV.
 * Implements TransactionExportRepository port.
 */
export class DrizzleTransactionExportRepository implements TransactionExportRepository {
  constructor(private readonly db: Database) {}

  /**
   * Fetches transactions with joined data for CSV export.
   * Returns one row per transaction line (split transactions become multiple rows).
   * Only returns data for the specified user.
   */
  async fetchForExport(
    userId: UserId,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TransactionExportRow[]> {
    // Build the where conditions
    const conditions = [
      eq(transactions.userId, userId as unknown as string),
      isNull(transactions.deletedAt),
      isNull(transactionLines.deletedAt),
    ];

    if (startDate) {
      conditions.push(gte(transactions.occurredAt, startDate));
    }

    if (endDate) {
      // Add 1 day to endDate to make it inclusive (end of day)
      const inclusiveEndDate = new Date(endDate);
      inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
      conditions.push(lte(transactions.occurredAt, inclusiveEndDate));
    }

    // Fetch transaction lines with joined data
    const results = await this.db
      .select({
        date: transactions.occurredAt,
        amount: transactionLines.amountCents,
        category: categories.name,
        note: transactionLines.memo,
        account: accounts.name,
      })
      .from(transactions)
      .innerJoin(
        transactionLines,
        eq(transactionLines.transactionId, transactions.id),
      )
      .innerJoin(accounts, eq(accounts.id, transactionLines.accountId))
      .leftJoin(categories, eq(categories.id, transactionLines.categoryId))
      .where(and(...conditions))
      .orderBy(transactions.occurredAt, transactions.id);

    return results as TransactionExportRow[];
  }
}
