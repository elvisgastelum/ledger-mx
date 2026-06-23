import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useAuth } from "../lib/auth-context";
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

interface TransactionLineFormValues {
  id: string;
  targetType: "account" | "envelope" | "category";
  accountId: string;
  categoryId: string;
  envelopeId: string;
  amountCents: number;
  type: string;
}

interface TransactionFormValues {
  transactionDate: string;
  note: string;
  type: string;
  lines: TransactionLineFormValues[];
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

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { authFetch } = useAuth();
  const idGenerator = useMemo(() => new WebCryptoIdGenerator(), []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
    setError,
    clearErrors,
    reset,
  } = useForm<TransactionFormValues>({
    defaultValues: {
      transactionDate: getTodayString(),
      note: "",
      type: "expense",
      lines: [
        {
          id: idGenerator.uuid(),
          targetType: "account",
          accountId: "",
          categoryId: "",
          envelopeId: "",
          amountCents: 0,
          type: "expense",
        },
        {
          id: idGenerator.uuid(),
          targetType: "account",
          accountId: "",
          categoryId: "",
          envelopeId: "",
          amountCents: 0,
          type: "expense",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  // Load transactions using authFetch
  const loadTransactions = async () => {
    setLoading(true);
    clearErrors();

    try {
      const response = await authFetch("/api/v1/transactions", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Failed to load transactions: ${response.status}`);
      }

      const data = await response.json();
      setTransactions(data.transactions ?? []);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to load transactions",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const onSubmit = async (data: TransactionFormValues) => {
    // Validate lines sum to zero
    const sum = data.lines.reduce((acc, line) => acc + line.amountCents, 0);
    if (sum !== 0) {
      setError("lines", {
        type: "manual",
        message: "Transaction lines must sum to zero",
      });
      return;
    }

    try {
      const response = await authFetch("/api/v1/transactions", {
        method: "POST",
        body: JSON.stringify({
          id: idGenerator.uuid(),
          transactionDate: dateInputToISOString(data.transactionDate),
          note: data.note || null,
          type: data.type,
          lines: data.lines.map((line) => ({
            id: idGenerator.uuid(),
            targetType: line.targetType,
            accountId: line.targetType === "account" ? line.accountId : null,
            categoryId: line.targetType === "category" ? line.categoryId : null,
            envelopeId: line.targetType === "envelope" ? line.envelopeId : null,
            amountCents: line.amountCents,
            type: data.type,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            `Failed to create transaction: ${response.status}`,
        );
      }

      setShowCreateForm(false);
      reset();
      loadTransactions();
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to create transaction",
      );
    }
  };

  const addLine = () => {
    append({
      id: idGenerator.uuid(),
      targetType: "account",
      accountId: "",
      categoryId: "",
      envelopeId: "",
      amountCents: 0,
      type: watch("type"),
    });
  };

  if (loading) {
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

      {submitError && (
        <div
          className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
          role="alert"
        >
          {submitError}
        </div>
      )}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Transaction</CardTitle>
            <CardDescription>
              Add a new transaction with multiple lines
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
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="adjustment">Adjustment</SelectItem>
                        <SelectItem value="reversal">Reversal</SelectItem>
                        <SelectItem value="debt_payment">
                          Debt Payment
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <p className="text-sm text-destructive">Type is required</p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">
                  Lines (must sum to zero)
                </h3>
                <fieldset className="space-y-4">
                  <legend className="sr-only">
                    Transaction Lines (must sum to zero, minimum 2 lines)
                  </legend>
                  {fields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <CardContent className="space-y-4 p-0">
                        <div className="space-y-2">
                          <Label htmlFor={`lines.${index}.targetType`}>
                            Target Type
                          </Label>
                          <Controller
                            name={`lines.${index}.targetType`}
                            control={control}
                            rules={{ required: true }}
                            render={({ field: targetField }) => (
                              <Select
                                onValueChange={targetField.onChange}
                                value={targetField.value}
                              >
                                <SelectTrigger
                                  id={`lines.${index}.targetType`}
                                  aria-invalid={
                                    !!errors.lines?.[index]?.targetType
                                  }
                                >
                                  <SelectValue placeholder="Select target type..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="account">
                                    Account
                                  </SelectItem>
                                  <SelectItem value="category">
                                    Category
                                  </SelectItem>
                                  <SelectItem value="envelope">
                                    Envelope
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        {watch(`lines.${index}.targetType`) === "account" && (
                          <div className="space-y-2">
                            <Label htmlFor={`lines.${index}.accountId`}>
                              Account ID
                            </Label>
                            <Input
                              id={`lines.${index}.accountId`}
                              type="text"
                              disabled={isSubmitting}
                              error={!!errors.lines?.[index]?.accountId}
                              {...register(
                                `lines.${index}.accountId` as const,
                                {
                                  required: true,
                                },
                              )}
                            />
                          </div>
                        )}

                        {watch(`lines.${index}.targetType`) === "category" && (
                          <div className="space-y-2">
                            <Label htmlFor={`lines.${index}.categoryId`}>
                              Category ID
                            </Label>
                            <Input
                              id={`lines.${index}.categoryId`}
                              type="text"
                              disabled={isSubmitting}
                              error={!!errors.lines?.[index]?.categoryId}
                              {...register(
                                `lines.${index}.categoryId` as const,
                                {
                                  required: true,
                                },
                              )}
                            />
                          </div>
                        )}

                        {watch(`lines.${index}.targetType`) === "envelope" && (
                          <div className="space-y-2">
                            <Label htmlFor={`lines.${index}.envelopeId`}>
                              Envelope ID
                            </Label>
                            <Input
                              id={`lines.${index}.envelopeId`}
                              type="text"
                              disabled={isSubmitting}
                              error={!!errors.lines?.[index]?.envelopeId}
                              {...register(
                                `lines.${index}.envelopeId` as const,
                                {
                                  required: true,
                                },
                              )}
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor={`lines.${index}.amountCents`}>
                            Amount (cents, integer)
                          </Label>
                          <Input
                            id={`lines.${index}.amountCents`}
                            type="number"
                            disabled={isSubmitting}
                            error={!!errors.lines?.[index]?.amountCents}
                            {...register(
                              `lines.${index}.amountCents` as const,
                              {
                                required: true,
                                valueAsNumber: true,
                                validate: (value) =>
                                  Number.isInteger(value) ||
                                  "Amount must be an integer (no decimals)",
                              },
                            )}
                          />
                          {errors.lines?.[index]?.amountCents && (
                            <p className="text-sm text-destructive">
                              {errors.lines?.[index]?.amountCents?.message}
                            </p>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => remove(index)}
                          disabled={isSubmitting || fields.length <= 2}
                          className="w-full"
                        >
                          Remove Line
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </fieldset>

                <Button
                  type="button"
                  variant="outline"
                  onClick={addLine}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  Add Line
                </Button>

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
                  {transactions.map((tx) => (
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
