import type { UserId } from "@ledger-mx/domain";

/**
 * CSV export row with joined transaction data.
 */
export interface TransactionExportRow {
  date: Date;
  amount: number; // in cents
  category: string | null;
  note: string | null;
  account: string;
}

/**
 * Repository port for exporting transaction data.
 * Implementations should be provided by the infrastructure layer.
 */
export interface TransactionExportRepository {
  /**
   * Fetches transactions with joined data for CSV export.
   * Returns one row per transaction line (split transactions become multiple rows).
   * Only returns data for the specified user.
   */
  fetchForExport(
    userId: UserId,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TransactionExportRow[]>;
}
