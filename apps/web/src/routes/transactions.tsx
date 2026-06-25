import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { tsr } from "../lib/ts-rest-client";
import type {
  AccountType,
  SystemRole,
  AccountStatus,
  OwnershipType,
} from "@ledger-mx/contracts";
import { dateInputToISOString, getTodayString } from "../lib/date-format";
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
import { DatePicker } from "../components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { WebCryptoIdGenerator } from "../lib/web-crypto-id-generator";

interface TransactionFormValues {
  transactionDate: string;
  note: string;
  type: "expense" | "income" | "transfer";
  amount: string;
  expenseAccountId: string;
  incomeDestinationAccountId: string;
  transferFromAccountId: string;
  transferToAccountId: string;
}

interface Transaction {
  id: string;
  transactionDate: string;
  note: string | null;
  type: string;
  totalAmountCents: number;
  lines: Array<{
    id: string;
    targetType: string;
    accountId: string | null;
    categoryId: string | null;
    envelopeId: string | null;
    amountCents: number;
    type: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Account {
  id: string;
  name: string;
  type: AccountType;
  balanceCents: number;
  currency: string;
  status: AccountStatus;
  ownership: OwnershipType;
  systemRole: SystemRole;
  createdAt: string;
  updatedAt: string;
}

function formatAccountTypeLabel(type: AccountType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatCentsForDisplay(balanceCents: number): string {
  const sign = balanceCents < 0 ? "-" : "";
  const absCents = Math.abs(balanceCents);
  const dollars = Math.trunc(absCents / 100);
  const cents = absCents % 100;
  const centsStr = cents.toString().padStart(2, "0");
  return `${sign}${dollars}.${centsStr}`;
}

function formatAccountLabel(account: Account): string {
  const balanceDisplay = formatCentsForDisplay(account.balanceCents);
  return `${account.name} (${formatAccountTypeLabel(account.type)}) - ${account.currency} ${balanceDisplay}`;
}

function parseMoneyAmountToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Accept only digits with optional single dot and 1-2 decimal digits
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;

  const [dollars, centsRaw] = trimmed.split(".");
  const dollarsNum = parseInt(dollars, 10);
  const centsPart = (centsRaw ?? "").padEnd(2, "0");
  const centsNum = parseInt(centsPart, 10);

  const totalCents = dollarsNum * 100 + centsNum;

  if (totalCents <= 0) return null;
  return totalCents;
}

export function TransactionsPage() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const idGenerator = useMemo(() => new WebCryptoIdGenerator(), []);

  // Use ts-rest query for loading transactions
  const {
    data: transactionsData,
    isLoading,
    error: queryError,
    refetch,
  } = tsr.transactions.list.useQuery({
    queryKey: ["transactions"],
    queryData: { query: {} },
  });

  const transactions = (transactionsData?.body?.transactions ??
    []) as Transaction[];

  // Fetch accounts for the account select dropdowns
  const {
    data: accountsData,
    isLoading: isAccountsLoading,
    error: accountsError,
  } = tsr.accounts.list.useQuery({
    queryKey: ["accounts"],
    queryData: { query: {} },
  });

  const allAccounts = (accountsData?.body?.accounts ?? []) as Account[];

  // Filter accounts: active non-system accounts for normal selects
  const activeUserAccounts = allAccounts.filter(
    (account) => account.status === "active" && account.ownership === "user",
  );

  // Filter system accounts by role
  const systemIncomeAccounts = allAccounts.filter(
    (account) =>
      account.ownership === "system" &&
      (account.systemRole === "income" || account.systemRole === "salary"),
  );

  const systemExpenseAccount = allAccounts.find(
    (account) =>
      account.ownership === "system" && account.systemRole === "expense",
  );

  // Get preferred income source (prefer Salary, then Income)
  const incomeSourceAccount =
    systemIncomeAccounts.find((a) => a.systemRole === "salary") ??
    systemIncomeAccounts[0] ??
    null;

  const hasActiveStatusAccountId = (accountId: string) =>
    activeUserAccounts.some((account) => account.id === accountId);

  // Use ts-rest mutation for creating transactions
  const createMutation = tsr.transactions.create.useMutation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
    setError,
    reset,
  } = useForm<TransactionFormValues>({
    defaultValues: {
      transactionDate: getTodayString(),
      note: "",
      type: "expense",
      amount: "",
      expenseAccountId: "",
      incomeDestinationAccountId: "",
      transferFromAccountId: "",
      transferToAccountId: "",
    },
  });

  const onSubmit = async (data: TransactionFormValues) => {
    setSubmitError(null);

    // Parse amount
    const amountCents = parseMoneyAmountToCents(data.amount);
    if (amountCents === null) {
      setError("amount", {
        type: "manual",
        message: "Enter a valid amount greater than zero",
      });
      return;
    }

    // Build exactly two lines based on type
    const lines: Array<{
      id: string;
      targetType: "account";
      accountId: string | null;
      categoryId: string | null;
      envelopeId: string | null;
      amountCents: number;
      type: "expense" | "income" | "transfer";
    }> = [];

    if (data.type === "expense") {
      // Validate account ID is an active user account
      if (!hasActiveStatusAccountId(data.expenseAccountId)) {
        setError("expenseAccountId", {
          type: "manual",
          message: "Select an active account",
        });
        return;
      }

      // Validate system expense account exists
      if (!systemExpenseAccount) {
        setSubmitError(
          "System Expense account not found. Please contact support.",
        );
        return;
      }

      // Expense: user account (negative) + system Expense account (positive)
      lines.push({
        id: idGenerator.uuid(),
        targetType: "account",
        accountId: data.expenseAccountId,
        categoryId: null,
        envelopeId: null,
        amountCents: -amountCents,
        type: "expense",
      });
      lines.push({
        id: idGenerator.uuid(),
        targetType: "account",
        accountId: systemExpenseAccount.id,
        categoryId: null,
        envelopeId: null,
        amountCents: amountCents,
        type: "expense",
      });
    } else if (data.type === "income") {
      // Validate destination account ID is an active user account
        if (!hasActiveStatusAccountId(data.incomeDestinationAccountId)) {
        setError("incomeDestinationAccountId", {
          type: "manual",
          message: "Select an active account",
        });
        return;
      }

      // Validate system income source account exists
      if (!incomeSourceAccount) {
        setSubmitError(
          "System income source account not found. Please contact support.",
        );
        return;
      }

      // Income: system income source (negative) + user account (positive)
      lines.push({
        id: idGenerator.uuid(),
        targetType: "account",
        accountId: incomeSourceAccount.id,
        categoryId: null,
        envelopeId: null,
        amountCents: -amountCents,
        type: "income",
      });
      lines.push({
        id: idGenerator.uuid(),
        targetType: "account",
        accountId: data.incomeDestinationAccountId,
        categoryId: null,
        envelopeId: null,
        amountCents: amountCents,
        type: "income",
      });
    } else {
      // Transfer
      // Validate account IDs are active user accounts
      if (!hasActiveStatusAccountId(data.transferFromAccountId)) {
        setError("transferFromAccountId", {
          type: "manual",
          message: "Select an active source account",
        });
        return;
      }
      if (!hasActiveStatusAccountId(data.transferToAccountId)) {
        setError("transferToAccountId", {
          type: "manual",
          message: "Select an active destination account",
        });
        return;
      }

      // Transfer: from account (negative) + to account (positive)
      if (data.transferFromAccountId === data.transferToAccountId) {
        setError("transferToAccountId", {
          type: "manual",
          message: "Choose a different destination account",
        });
        return;
      }

      lines.push({
        id: idGenerator.uuid(),
        targetType: "account",
        accountId: data.transferFromAccountId,
        categoryId: null,
        envelopeId: null,
        amountCents: -amountCents,
        type: "transfer",
      });
      lines.push({
        id: idGenerator.uuid(),
        targetType: "account",
        accountId: data.transferToAccountId,
        categoryId: null,
        envelopeId: null,
        amountCents: amountCents,
        type: "transfer",
      });
    }

    // Defensive sum check
    const sum = lines.reduce((acc, line) => acc + line.amountCents, 0);
    if (sum !== 0) {
      setError("amount", {
        type: "manual",
        message: "Transaction lines must sum to zero",
      });
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        body: {
          id: idGenerator.uuid(),
          transactionDate: dateInputToISOString(data.transactionDate),
          note: data.note || null,
          type: data.type,
          lines,
        },
      });

      if (result.status !== 201) {
        const body = result.body as { message?: string };
        throw new Error(
          body?.message || `Failed to create transaction: ${result.status}`,
        );
      }

      setShowCreateForm(false);
      reset();
      refetch();
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to create transaction",
      );
    }
  };

  if (isLoading) {
    return <LoadingState text="Loading transactions..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Manage your transactions"
        action={
          !showCreateForm
            ? {
                label: "Create Transaction",
                onClick: () => {
                  setShowCreateForm(true);
                  reset();
                },
              }
            : undefined
        }
      />

      {(submitError || queryError) && (
        <div
          className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
          role="alert"
        >
          {submitError || (queryError as Error)?.message || "An error occurred"}
        </div>
      )}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Transaction</CardTitle>
            <CardDescription>
              Enter one amount and the app creates the balancing lines.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              aria-label="Create Transaction"
            >
              <div className="space-y-2">
                <Label htmlFor="transactionDate">Date</Label>
                <Controller
                  name="transactionDate"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <DatePicker
                      id="transactionDate"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={isSubmitting}
                      aria-invalid={!!errors.transactionDate}
                    />
                  )}
                />
                {errors.transactionDate && (
                  <p className="text-sm text-destructive">Date is required</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note (optional)</Label>
                <Input
                  id="note"
                  type="text"
                  disabled={isSubmitting}
                  {...register("note")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger
                        id="type"
                        aria-invalid={!!errors.type}
                        className={errors.type ? "border-destructive" : ""}
                      >
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <p className="text-sm text-destructive">Type is required</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="123.45"
                  disabled={isSubmitting}
                  {...register("amount", {
                    required: "Amount is required",
                    validate: (value) => {
                      const cents = parseMoneyAmountToCents(value);
                      return (
                        cents !== null ||
                        "Enter a valid amount greater than zero"
                      );
                    },
                  })}
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              {watch("type") === "expense" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="expenseAccountId">Account</Label>
                    {accountsError ? (
                      <p className="text-sm text-destructive py-2">
                        Failed to load accounts. Please try again.
                      </p>
                    ) : isAccountsLoading ? (
                      <p className="text-sm text-muted-foreground py-2">
                        Loading accounts…
                      </p>
                    ) : activeUserAccounts.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">
                        No active accounts found. Create or activate an account
                        first.
                      </p>
                    ) : (
                      <Controller
                        control={control}
                        name="expenseAccountId"
                        rules={{ required: "Select an account" }}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isSubmitting || !!accountsError}
                          >
                            <SelectTrigger
                              id="expenseAccountId"
                              aria-invalid={!!errors.expenseAccountId}
                              className={
                                errors.expenseAccountId
                                  ? "border-destructive"
                                  : ""
                              }
                            >
                              <SelectValue placeholder="Choose an active account" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeUserAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {formatAccountLabel(account)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    )}
                    {errors.expenseAccountId && (
                      <p className="text-sm text-destructive">
                        {errors.expenseAccountId.message ||
                          "Account is required"}
                      </p>
                    )}
                  </div>
                </>
              )}

              {watch("type") === "income" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="incomeDestinationAccountId">
                      To Account
                    </Label>
                    {accountsError ? (
                      <p className="text-sm text-destructive py-2">
                        Failed to load accounts. Please try again.
                      </p>
                    ) : isAccountsLoading ? (
                      <p className="text-sm text-muted-foreground py-2">
                        Loading accounts…
                      </p>
                    ) : activeUserAccounts.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">
                        No active accounts found. Create or activate an account
                        first.
                      </p>
                    ) : (
                      <>
                        {incomeSourceAccount && (
                          <p className="text-xs text-muted-foreground mb-2">
                            From: {incomeSourceAccount.name} (System{" "}
                            {incomeSourceAccount.systemRole})
                          </p>
                        )}
                        <Controller
                          control={control}
                          name="incomeDestinationAccountId"
                          rules={{ required: "Select a destination account" }}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={isSubmitting || !!accountsError}
                            >
                              <SelectTrigger
                                id="incomeDestinationAccountId"
                                aria-invalid={
                                  !!errors.incomeDestinationAccountId
                                }
                                className={
                                  errors.incomeDestinationAccountId
                                    ? "border-destructive"
                                    : ""
                                }
                              >
                                <SelectValue placeholder="Choose destination account" />
                              </SelectTrigger>
                              <SelectContent>
                                {activeUserAccounts.map((account) => (
                                  <SelectItem
                                    key={account.id}
                                    value={account.id}
                                  >
                                    {formatAccountLabel(account)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </>
                    )}
                    {errors.incomeDestinationAccountId && (
                      <p className="text-sm text-destructive">
                        {errors.incomeDestinationAccountId.message ||
                          "Destination account is required"}
                      </p>
                    )}
                  </div>
                </>
              )}

              {watch("type") === "transfer" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="transferFromAccountId">From account</Label>
                    {accountsError ? (
                      <p className="text-sm text-destructive py-2">
                        Failed to load accounts. Please try again.
                      </p>
                    ) : isAccountsLoading ? (
                      <p className="text-sm text-muted-foreground py-2">
                        Loading accounts…
                      </p>
                    ) : activeUserAccounts.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">
                        No active accounts found. Create or activate an account
                        first.
                      </p>
                    ) : (
                      <Controller
                        control={control}
                        name="transferFromAccountId"
                        rules={{ required: "Select a source account" }}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isSubmitting || !!accountsError}
                          >
                            <SelectTrigger
                              id="transferFromAccountId"
                              aria-invalid={!!errors.transferFromAccountId}
                              className={
                                errors.transferFromAccountId
                                  ? "border-destructive"
                                  : ""
                              }
                            >
                              <SelectValue placeholder="Choose source account" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeUserAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {formatAccountLabel(account)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    )}
                    {errors.transferFromAccountId && (
                      <p className="text-sm text-destructive">
                        {errors.transferFromAccountId.message ||
                          "Source account is required"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transferToAccountId">To account</Label>
                    {accountsError ? (
                      <p className="text-sm text-destructive py-2">
                        Failed to load accounts. Please try again.
                      </p>
                    ) : isAccountsLoading ? (
                      <p className="text-sm text-muted-foreground py-2">
                        Loading accounts…
                      </p>
                    ) : activeUserAccounts.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">
                        No active accounts found. Create or activate an account
                        first.
                      </p>
                    ) : (
                      <Controller
                        control={control}
                        name="transferToAccountId"
                        rules={{
                          required: "Select a destination account",
                          validate: (value) =>
                            value !== watch("transferFromAccountId") ||
                            "Choose a different destination account",
                        }}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isSubmitting || !!accountsError}
                          >
                            <SelectTrigger
                              id="transferToAccountId"
                              aria-invalid={!!errors.transferToAccountId}
                              className={
                                errors.transferToAccountId
                                  ? "border-destructive"
                                  : ""
                              }
                            >
                              <SelectValue placeholder="Choose destination account" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeUserAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {formatAccountLabel(account)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    )}
                    {errors.transferToAccountId && (
                      <p className="text-sm text-destructive">
                        {errors.transferToAccountId.message ||
                          "Destination account is required"}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    reset();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Creating..." : "Create Transaction"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {transactions.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table
                className="w-full"
                aria-label="Transactions list"
                data-testid="transactions-table"
              >
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Note
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: Transaction) => (
                    <tr key={tx.id} className="border-b">
                      <td className="px-4 py-3">
                        {new Date(tx.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{tx.note}</td>
                      <td className="px-4 py-3 capitalize">{tx.type}</td>
                      <td className="px-4 py-3">
                        {(tx.totalAmountCents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Button type="button" variant="ghost" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        !showCreateForm && (
          <EmptyState
            title="No transactions found"
            description="Create a transaction to get started with tracking your finances."
            action={{
              label: "Create Transaction",
              onClick: () => {
                setShowCreateForm(true);
                reset();
              },
            }}
          />
        )
      )}
    </div>
  );
}

export default TransactionsPage;
