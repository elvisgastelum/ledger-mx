import type { UserId } from "@ledger-mx/domain";
import type { TransactionExportRepository } from "../ports/transaction-export.repository.port";
import { escapeCsvValue } from "../csv-utils";

/**
 * Result of CSV export operation.
 */
export interface ExportTransactionsCsvResult {
  csv: string;
}

/**
 * Use case for exporting transactions as CSV.
 */
export class ExportTransactionsCsvUseCase {
  constructor(
    private readonly exportRepository: TransactionExportRepository,
  ) {}

  async execute(params: {
    userId: UserId;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ExportTransactionsCsvResult> {
    const { userId, startDate, endDate } = params;

    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      throw new Error("startDate must be before or equal to endDate");
    }

    // Fetch data from repository
    const rows = await this.exportRepository.fetchForExport(
      userId,
      startDate,
      endDate,
    );

    // Generate CSV
    const csv = this.generateCsv(rows);

    return { csv };
  }

  private generateCsv(rows: { date: Date; amount: number; category: string | null; note: string | null; account: string }[]): string {
    // CSV header
    const header = ["date", "amount", "category", "note", "account"];
    const lines: string[] = [];

    // Add header
    lines.push(header.join(","));

    // Add data rows
    for (const row of rows) {
      const csvRow = [
        escapeCsvValue(this.formatDate(row.date)),
        escapeCsvValue(this.formatAmount(row.amount)),
        escapeCsvValue(row.category),
        escapeCsvValue(row.note),
        escapeCsvValue(row.account),
      ];
      lines.push(csvRow.join(","));
    }

    return lines.join("\n");
  }

  private formatDate(date: Date): string {
    // Format as YYYY-MM-DD
    return date.toISOString().split("T")[0] ?? "";
  }

  private formatAmount(amountCents: number): string {
    // Convert cents to decimal string
    const dollars = Math.abs(amountCents) / 100;
    const sign = amountCents < 0 ? "-" : "";
    return `${sign}${dollars.toFixed(2)}`;
  }
}
