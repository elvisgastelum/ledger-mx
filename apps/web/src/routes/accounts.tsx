import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import type { AccountType } from "@ledger-mx/contracts";
import { useAuth } from "../lib/auth-context";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const { authFetch } = useAuth();
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm<AccountFormValues>();

  // Load accounts using authFetch
  const loadAccounts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch("/api/v1/accounts", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Failed to load accounts: ${response.status}`);
      }

      const data = await response.json();
      setAccounts(data.accounts ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const onCreateSubmit = async (data: AccountFormValues) => {
    try {
      const response = await authFetch("/api/v1/accounts", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to create account: ${response.status}`);
      }

      setShowCreateForm(false);
      reset();
      loadAccounts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    }
  };

  const onUpdateSubmit = async (data: AccountFormValues) => {
    if (!editingAccount) return;

    try {
      const response = await authFetch(`/api/v1/accounts/${editingAccount.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to update account: ${response.status}`);
      }

      setEditingAccount(null);
      reset();
      loadAccounts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update account");
    }
  };

  const onArchive = async (accountId: string) => {
    if (!confirm("Are you sure you want to archive this account?")) {
      return;
    }

    try {
      const response = await authFetch(`/api/v1/accounts/${accountId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to archive account: ${response.status}`);
      }

      loadAccounts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to archive account");
    }
  };

  const startEdit = (account: Account) => {
    setEditingAccount(account);
    reset({
      name: account.name,
      type: account.type,
      currency: account.currency,
    });
  };

  if (loading) {
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

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      {(showCreateForm || editingAccount) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingAccount ? "Edit Account" : "Create Account"}</CardTitle>
            <CardDescription>
              {editingAccount ? "Update account details" : "Add a new account to track your finances"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(editingAccount ? onUpdateSubmit : onCreateSubmit)}
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
                  <p className="text-sm text-destructive">Name is required (max 100 chars)</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger id="type" aria-invalid={!!errors.type} className={errors.type ? "border-destructive" : ""}>
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
                  {...register("currency", { required: true, minLength: 3, maxLength: 3 })}
                />
                {errors.currency && (
                  <p className="text-sm text-destructive">Currency must be 3 characters (e.g., MXN)</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Saving..." : editingAccount ? "Update" : "Create"}
                </Button>
                {editingAccount && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setEditingAccount(null); reset(); }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                )}
                {!editingAccount && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setShowCreateForm(false); reset(); }}
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
              <table className="w-full" aria-label="Accounts list" data-testid="accounts-table">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Currency</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Balance</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-b">
                      <td className="px-4 py-3">{account.name}</td>
                      <td className="px-4 py-3 capitalize">{account.type}</td>
                      <td className="px-4 py-3">{account.currency}</td>
                      <td className="px-4 py-3">{(account.balanceCents / 100).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          account.isActive 
                            ? "bg-success/20 text-success" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {account.isActive ? "Active" : "Archived"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(account)}
                          >
                            Edit
                          </Button>
                          {account.isActive && (
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
        !showCreateForm && !editingAccount && (
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
