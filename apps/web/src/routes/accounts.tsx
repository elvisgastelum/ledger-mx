import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import type {
  AccountType,
  SystemRole,
  AccountStatus,
  OwnershipType,
} from "@ledger-mx/contracts";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface AccountFormValues {
  name: string;
  type: AccountType;
  currency: string;
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

export function AccountsPage() {
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Use ts-rest query for loading accounts
  const {
    data: accountsData,
    isLoading,
    error: queryError,
    refetch,
  } = tsr.accounts.list.useQuery({
    queryKey: ["accounts"],
    queryData: { query: {} },
  });

  const accounts = (accountsData?.body?.accounts ?? []) as Account[];

  // Use ts-rest mutations
  const createMutation = tsr.accounts.create.useMutation();
  const updateMutation = tsr.accounts.update.useMutation();
  const archiveMutation = tsr.accounts.archive.useMutation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<AccountFormValues>();

  const onCreateSubmit = async (data: AccountFormValues) => {
    try {
      const result = await createMutation.mutateAsync({
        body: data,
      });

      if (result.status !== 201) {
        const body = result.body as { message?: string };
        throw new Error(
          body?.message || `Failed to create account: ${result.status}`,
        );
      }

      setShowCreateForm(false);
      reset();
      refetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    }
  };

  const onUpdateSubmit = async (data: AccountFormValues) => {
    if (!editingAccount) return;

    try {
      const result = await updateMutation.mutateAsync({
        params: { id: editingAccount.id },
        body: data,
      });

      if (result.status !== 200) {
        const body = result.body as { message?: string };
        throw new Error(
          body?.message || `Failed to update account: ${result.status}`,
        );
      }

      setEditingAccount(null);
      reset();
      refetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update account");
    }
  };

  const onArchive = async (accountId: string) => {
    if (!confirm("Are you sure you want to archive this account?")) {
      return;
    }

    try {
      const result = await archiveMutation.mutateAsync({
        params: { id: accountId },
      });

      if (result.status !== 204) {
        const body = (result.body ?? {}) as { message?: string };
        throw new Error(
          body?.message || `Failed to archive account: ${result.status}`,
        );
      }

      refetch();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to archive account",
      );
    }
  };

  const startEdit = (account: Account) => {
    // Don't allow editing system accounts
    if (account.ownership === "system") return;
    setEditingAccount(account);
    setValue("name", account.name);
    setValue("type", account.type);
    setValue("currency", account.currency);
  };

  if (isLoading) {
    return <LoadingState text="Loading accounts..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        description="Manage your accounts"
        action={
          !showCreateForm && !editingAccount
            ? {
                label: "Create Account",
                onClick: () => {
                  setShowCreateForm(true);
                  setEditingAccount(null);
                  reset();
                },
              }
            : undefined
        }
      />

      {(error || queryError) && (
        <div
          className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
          role="alert"
        >
          {error || (queryError as Error)?.message || "An error occurred"}
        </div>
      )}

      {(showCreateForm || editingAccount) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingAccount ? "Edit Account" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {editingAccount
                ? "Update account details"
                : "Add a new account to track your finances"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(
                editingAccount ? onUpdateSubmit : onCreateSubmit,
              )}
              className="space-y-4"
              aria-label={editingAccount ? "Edit Account" : "Create Account"}
            >
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  disabled={isSubmitting}
                  error={!!errors.name}
                  {...register("name", { required: true, maxLength: 100 })}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    Name is required (max 100 chars)
                  </p>
                )}
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
                        <SelectItem value="debit">Debit</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                        <SelectItem value="loan">Loan</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <p className="text-sm text-destructive">Type is required</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  disabled={isSubmitting}
                  error={!!errors.currency}
                  {...register("currency", {
                    required: true,
                    minLength: 3,
                    maxLength: 3,
                  })}
                />
                {errors.currency && (
                  <p className="text-sm text-destructive">
                    Currency must be 3 characters (e.g., MXN)
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingAccount
                      ? "Update"
                      : "Create"}
                </Button>
                {editingAccount && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingAccount(null);
                      reset();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                )}
                {!editingAccount && (
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
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {accounts.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table
                className="w-full"
                aria-label="Accounts list"
                data-testid="accounts-table"
              >
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Currency
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Balance
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account: Account) => (
                    <tr key={account.id} className="border-b">
                      <td className="px-4 py-3">
                        {account.name}
                        {account.ownership === "system" && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (System - {account.systemRole})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 capitalize">{account.type}</td>
                      <td className="px-4 py-3">{account.currency}</td>
                      <td className="px-4 py-3">
                        {(account.balanceCents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            account.status === "active"
                              ? "bg-success/20 text-success"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {account.status === "active" ? "Active" : "Archived"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(account)}
                            disabled={account.ownership === "system"}
                          >
                            {account.ownership === "system" ? "System" : "Edit"}
                          </Button>
                          {account.status === "active" &&
                            account.ownership !== "system" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onArchive(account.id)}
                              >
                                Archive
                              </Button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        !showCreateForm &&
        !editingAccount && (
          <EmptyState
            title="No accounts found"
            description="Create an account to get started with tracking your finances."
            action={{
              label: "Create Account",
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

export default AccountsPage;
