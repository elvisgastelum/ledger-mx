import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import type { AccountType } from "@ledger-mx/contracts";
import { useAuth } from "../lib/auth-context";
import { LogoutButton } from "../components/logout-button";

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
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<AccountFormValues>();

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
    return <div>Loading accounts...</div>;
  }

  return (
    <div className="accounts-page">
      <header>
        <h1>Accounts</h1>
        <div>
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setEditingAccount(null);
              reset();
            }}
          >
            {showCreateForm ? "Cancel" : "Create Account"}
          </button>
          <LogoutButton />
        </div>
      </header>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {(showCreateForm || editingAccount) && (
        <form
          onSubmit={handleSubmit(editingAccount ? onUpdateSubmit : onCreateSubmit)}
          className="account-form"
          aria-label={editingAccount ? "Edit Account" : "Create Account"}
        >
          <h2>{editingAccount ? "Edit Account" : "Create Account"}</h2>

          <div>
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              disabled={isSubmitting}
              {...register("name", { required: true, maxLength: 100 })}
            />
            {errors.name && <span className="error">Name is required (max 100 chars)</span>}
          </div>

          <div>
            <label htmlFor="type">Type:</label>
            <select
              id="type"
              disabled={isSubmitting}
              {...register("type", { required: true })}
            >
              <option value="">Select type...</option>
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
              <option value="loan">Loan</option>
              <option value="savings">Savings</option>
              <option value="cash">Cash</option>
            </select>
            {errors.type && <span className="error">Type is required</span>}
          </div>

          <div>
            <label htmlFor="currency">Currency:</label>
            <input
              type="text"
              id="currency"
              disabled={isSubmitting}
              {...register("currency", { required: true, minLength: 3, maxLength: 3 })}
            />
            {errors.currency && <span className="error">Currency must be 3 characters (e.g., MXN)</span>}
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : editingAccount ? "Update" : "Create"}
          </button>
          {editingAccount && (
            <button type="button" onClick={() => { setEditingAccount(null); reset(); }}>
              Cancel
            </button>
          )}
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Currency</th>
            <th>Balance</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id}>
              <td>{account.name}</td>
              <td>{account.type}</td>
              <td>{account.currency}</td>
              <td>{(account.balanceCents / 100).toFixed(2)}</td>
              <td>{account.isActive ? "Active" : "Archived"}</td>
              <td>
                <button type="button" onClick={() => startEdit(account)}>
                  Edit
                </button>
                {account.isActive && (
                  <button type="button" onClick={() => onArchive(account.id)}>
                    Archive
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {accounts.length === 0 && !loading && (
        <p>No accounts found. Create one to get started.</p>
      )}
    </div>
  );
}

export default AccountsPage;
