import { useForm } from "react-hook-form";
import { tsr } from "../lib/ts-rest-client";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { PageHeader } from "../components/ui/page-header";
import { EmptyState } from "../components/ui/empty-state";
import { LoadingState } from "../components/ui/loading-state";

interface DateFilterValues {
  startDate: string;
  endDate: string;
}

/**
 * Format cents to Mexican Peso currency string
 */
function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "MXN",
  }).format(cents / 100);
}

/**
 * Get first and last day of current month in YYYY-MM-DD format
 */
function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return {
    start: firstDay.toISOString().split("T")[0],
    end: lastDay.toISOString().split("T")[0],
  };
}

/**
 * Convert date string (YYYY-MM-DD) to ISO datetime string
 */
function toIsoDateTime(dateStr: string, endOfDay = false): string {
  if (!dateStr) return "";
  if (endOfDay) {
    return new Date(`${dateStr}T23:59:59.999Z`).toISOString();
  }
  return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
}

/**
 * Download data as a file in the browser
 */
function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape a value for CSV format.
 * Wraps in quotes and doubles internal quotes if value contains commas, quotes, CR, or LF.
 */
function escapeCsvValue(value: unknown): string {
  const str = String(value ?? "");
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\r") ||
    str.includes("\n")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function ReportsPage() {
  const { start, end } = getCurrentMonthRange();

  const { register, handleSubmit, watch } = useForm<DateFilterValues>({
    defaultValues: {
      startDate: start,
      endDate: end,
    },
  });

  const formData = watch();

  const startDateIso = formData.startDate
    ? toIsoDateTime(formData.startDate, false)
    : undefined;
  const endDateIso = formData.endDate
    ? toIsoDateTime(formData.endDate, true)
    : undefined;

  const queryParams = {
    query: {
      ...(startDateIso ? { startDate: startDateIso } : {}),
      ...(endDateIso ? { endDate: endDateIso } : {}),
    },
  };

  const spendableQuery = tsr.reports.getSpendableBalance.useQuery({
    queryKey: ["reports", "spendable", startDateIso, endDateIso],
    queryData: queryParams,
  });

  const expensesQuery = tsr.reports.getExpensesByCategory.useQuery({
    queryKey: ["reports", "expenses", startDateIso, endDateIso],
    queryData: queryParams,
  });

  const debtQuery = tsr.reports.getDebtProgress.useQuery({
    queryKey: ["reports", "debt", startDateIso, endDateIso],
    queryData: queryParams,
  });

  const spendableData =
    spendableQuery.data?.status === 200 ? spendableQuery.data.body : undefined;
  const expensesData =
    expensesQuery.data?.status === 200 ? expensesQuery.data.body : undefined;
  const debtData =
    debtQuery.data?.status === 200 ? debtQuery.data.body : undefined;

  const isLoading =
    spendableQuery.isLoading || expensesQuery.isLoading || debtQuery.isLoading;
  const hasError =
    spendableQuery.error || expensesQuery.error || debtQuery.error;

  const onApplyFilters = handleSubmit(() => {
    // React Hook Form already updates form state via watch()
    // The queries will automatically refetch due to queryKey changes
  });

  const handleExportJson = () => {
    const exportData = {
      dateRange: {
        startDate: startDateIso,
        endDate: endDateIso,
      },
      spendableBalance: spendableData ?? null,
      expensesByCategory: expensesData ?? null,
      debtProgress: debtData ?? null,
    };
    const json = JSON.stringify(exportData, null, 2);
    downloadFile(json, "reports.json", "application/json");
  };

  const handleExportCsv = () => {
    const lines: string[] = [];

    // Spendable Balance section
    lines.push("Spendable Balance");
    lines.push(
      "Account Balance,Envelope Allocations,Upcoming Obligations,Spendable Balance",
    );
    if (spendableData) {
      lines.push(
        [
          escapeCsvValue(spendableData.accountBalance),
          escapeCsvValue(spendableData.envelopeAllocations),
          escapeCsvValue(spendableData.upcomingObligations),
          escapeCsvValue(spendableData.spendableBalance),
        ].join(","),
      );
    }
    lines.push("");

    // Expenses by Category section
    lines.push("Expenses by Category");
    lines.push("Category Group,Total Expenses,Percentage of Total");
    if (expensesData) {
      expensesData.forEach((item) => {
        lines.push(
          [
            escapeCsvValue(item.categoryGroupName),
            escapeCsvValue(item.totalExpenses),
            escapeCsvValue(item.percentageOfTotal),
          ].join(","),
        );
      });
    }
    lines.push("");

    // Debt Progress section
    lines.push("Debt Progress");
    lines.push(
      "Total Debt,Paid Debt,Remaining Debt,Progress Percentage,Interest,Payoff Date",
    );
    if (debtData) {
      lines.push(
        [
          escapeCsvValue(debtData.totalDebt),
          escapeCsvValue(debtData.paidDebt),
          escapeCsvValue(debtData.remainingDebt),
          escapeCsvValue(debtData.progressPercentage),
          escapeCsvValue(debtData.interest),
          escapeCsvValue(debtData.payoffDate ?? ""),
        ].join(","),
      );
    }

    downloadFile(lines.join("\n"), "reports.csv", "text/csv");
  };

  if (isLoading && !spendableData && !expensesData && !debtData) {
    return <LoadingState text="Loading reports..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="View your financial reports and insights"
      />

      {hasError && (
        <div
          className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
          role="alert"
        >
          <ul className="space-y-1">
            {spendableQuery.error && (
              <li>Failed to load spendable balance report.</li>
            )}
            {expensesQuery.error && (
              <li>Failed to load expenses by category report.</li>
            )}
            {debtQuery.error && <li>Failed to load debt progress report.</li>}
          </ul>
        </div>
      )}

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range Filter</CardTitle>
          <CardDescription>
            Filter reports by date range. Leave empty for all-time data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={onApplyFilters}
            className="flex flex-wrap items-end gap-4"
          >
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" {...register("startDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" {...register("endDate")} />
            </div>
            <Button type="submit" disabled={isLoading}>
              Apply Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleExportJson}
          disabled={!spendableData && !expensesData && !debtData}
        >
          Export JSON
        </Button>
        <Button
          variant="outline"
          onClick={handleExportCsv}
          disabled={!spendableData && !expensesData && !debtData}
        >
          Export CSV
        </Button>
      </div>

      {/* Spendable Balance Report */}
      <Card>
        <CardHeader>
          <CardTitle>Spendable Balance</CardTitle>
          <CardDescription>
            Available balance after envelope allocations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {spendableData ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Account Balance
                  </p>
                  <p className="text-2xl font-semibold">
                    {formatMoney(spendableData.accountBalance)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Envelope Allocations
                  </p>
                  <p className="text-2xl font-semibold">
                    {formatMoney(spendableData.envelopeAllocations)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Upcoming Obligations
                  </p>
                  <p className="text-2xl font-semibold">
                    {formatMoney(spendableData.upcomingObligations)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Spendable Balance
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      spendableData.spendableBalance < 0
                        ? "text-destructive"
                        : "text-success",
                    )}
                  >
                    {formatMoney(spendableData.spendableBalance)}
                  </p>
                </div>
              </div>
              {spendableData.asOfDate && (
                <p className="text-xs text-muted-foreground">
                  As of: {new Date(spendableData.asOfDate).toLocaleDateString()}
                </p>
              )}
              <p className="text-xs text-muted-foreground italic">
                Positive balances are assets; negative balances are liabilities.
              </p>
            </div>
          ) : (
            <EmptyState
              title="No data available"
              description="Spendable balance data could not be loaded."
            />
          )}
        </CardContent>
      </Card>

      {/* Expenses by Category Report */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
          <CardDescription>
            Breakdown of expenses grouped by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expensesData && expensesData.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table
                  className="w-full"
                  aria-label="Expenses by category"
                  data-testid="expenses-table"
                >
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Category Group
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Total Expenses
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Percentage
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Distribution
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expensesData.map((item) => (
                      <tr key={item.categoryGroupId} className="border-b">
                        <td className="px-4 py-3">{item.categoryGroupName}</td>
                        <td className="px-4 py-3">
                          {formatMoney(item.totalExpenses)}
                        </td>
                        <td className="px-4 py-3">
                          {item.percentageOfTotal.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="h-4 w-full max-w-[200px] rounded-full bg-muted"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.min(
                              Math.max(item.percentageOfTotal, 0),
                              100,
                            )}
                            aria-label={`${item.categoryGroupName} expenses: ${item.percentageOfTotal.toFixed(1)}% of total`}
                          >
                            <div
                              className="h-4 rounded-full bg-primary"
                              style={{
                                width: `${Math.min(item.percentageOfTotal, 100)}%`,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No expenses found"
              description="No expense data available for the selected date range."
            />
          )}
        </CardContent>
      </Card>

      {/* Debt Progress Report */}
      <Card>
        <CardHeader>
          <CardTitle>Debt Progress</CardTitle>
          <CardDescription>Track your debt payoff progress</CardDescription>
        </CardHeader>
        <CardContent>
          {debtData ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Debt</p>
                  <p className="text-2xl font-semibold text-destructive">
                    {formatMoney(debtData.totalDebt)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Paid Debt</p>
                  <p className="text-2xl font-semibold">
                    {formatMoney(debtData.paidDebt)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Remaining Debt
                  </p>
                  <p className="text-2xl font-semibold">
                    {formatMoney(debtData.remainingDebt)}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{debtData.progressPercentage.toFixed(1)}%</span>
                </div>
                <div
                  className="h-4 w-full rounded-full bg-muted"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(
                    Math.max(debtData.progressPercentage, 0),
                    100,
                  )}
                  aria-label={`Debt payoff progress: ${debtData.progressPercentage.toFixed(1)}% complete`}
                >
                  <div
                    className="h-4 rounded-full bg-success transition-all"
                    style={{
                      width: `${Math.min(debtData.progressPercentage, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                {debtData.interest !== 0 && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Interest</p>
                    <p className="text-lg font-medium">
                      {formatMoney(debtData.interest)}
                    </p>
                  </div>
                )}
                {debtData.payoffDate && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Estimated Payoff Date
                    </p>
                    <p className="text-lg font-medium">
                      {new Date(debtData.payoffDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Liability Accounts Table */}
              {debtData.liabilityAccounts &&
                debtData.liabilityAccounts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Liability Accounts</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full" aria-label="Liability accounts">
                        <thead>
                          <tr className="border-b">
                            <th className="px-4 py-3 text-left text-sm font-medium">
                              Account
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium">
                              Type
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium">
                              Balance
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {debtData.liabilityAccounts.map((account) => (
                            <tr key={account.accountId} className="border-b">
                              <td className="px-4 py-3">
                                {account.accountName}
                              </td>
                              <td className="px-4 py-3 capitalize">
                                {account.accountType}
                              </td>
                              <td className="px-4 py-3 text-destructive">
                                {formatMoney(Math.abs(account.currentBalance))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <EmptyState
              title="No debt data available"
              description="Debt progress data could not be loaded."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ReportsPage;
