import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";

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

  const { register, handleSubmit, control, formState: { errors, isSubmitting }, watch, setError, clearErrors, reset } = useForm<TransactionFormValues>({
    defaultValues: {
      transactionDate: new Date().toISOString().split("T")[0],
      note: "",
      type: "expense",
      lines: [
        { id: crypto.randomUUID(), targetType: "account", accountId: "", categoryId: "", envelopeId: "", amountCents: 0, type: "expense" },
        { id: crypto.randomUUID(), targetType: "account", accountId: "", categoryId: "", envelopeId: "", amountCents: 0, type: "expense" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  // Load transactions
  const loadTransactions = async () => {
    setLoading(true);
    clearErrors();

    try {
      const response = await fetch("/api/v1/transactions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to load transactions: ${response.status}`);
      }

      const data = await response.json();
      setTransactions(data.transactions ?? []);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to load transactions");
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
      setError("lines", { type: "manual", message: "Transaction lines must sum to zero" });
      return;
    }

    try {
      const response = await fetch("/api/v1/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          transactionDate: new Date(data.transactionDate).toISOString(),
          note: data.note || null,
          type: data.type,
          lines: data.lines.map((line) => ({
            id: crypto.randomUUID(),
            targetType: line.targetType,
            accountId: line.targetType === "account" ? line.accountId : null,
            categoryId: line.targetType === "category" ? line.categoryId : null,
            envelopeId: line.targetType === "envelope" ? line.envelopeId : null,
            amountCents: line.amountCents,
            type: data.type,
          })),
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to create transaction: ${response.status}`);
      }

      setShowCreateForm(false);
      reset();
      loadTransactions();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create transaction");
    }
  };

  const addLine = () => {
    append({
      id: crypto.randomUUID(),
      targetType: "account",
      accountId: "",
      categoryId: "",
      envelopeId: "",
      amountCents: 0,
      type: watch("type"),
    });
  };

  if (loading) {
    return <div>Loading transactions...</div>;
  }

  return (
    <div className="transactions-page">
      <header>
        <h1>Transactions</h1>
        <button
          type="button"
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            reset();
          }}
        >
          {showCreateForm ? "Cancel" : "Create Transaction"}
        </button>
      </header>

      {submitError && (
        <div className="error-message" role="alert">
          {submitError}
        </div>
      )}

      {showCreateForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="transaction-form"
          aria-label="Create Transaction"
        >
          <h2>Create Transaction</h2>

          <div>
            <label htmlFor="transactionDate">Date:</label>
            <input
              type="date"
              id="transactionDate"
              disabled={isSubmitting}
              {...register("transactionDate", { required: true })}
            />
            {errors.transactionDate && <span className="error">Date is required</span>}
          </div>

          <div>
            <label htmlFor="note">Note (optional):</label>
            <input
              type="text"
              id="note"
              disabled={isSubmitting}
              {...register("note")}
            />
          </div>

          <div>
            <label htmlFor="type">Type:</label>
            <select
              id="type"
              disabled={isSubmitting}
              {...register("type", { required: true })}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
              <option value="adjustment">Adjustment</option>
              <option value="reversal">Reversal</option>
              <option value="debt_payment">Debt Payment</option>
            </select>
            {errors.type && <span className="error">Type is required</span>}
          </div>

          <h3>Lines (must sum to zero)</h3>
           <fieldset>
             <legend>Transaction Lines (must sum to zero, minimum 2 lines)</legend>
             {fields.map((field, index) => (
               <div key={field.id} className="transaction-line">
                 <div>
                   <label htmlFor={`lines.${index}.targetType`}>Target Type:</label>
                   <select
                     id={`lines.${index}.targetType`}
                     disabled={isSubmitting}
                     {...register(`lines.${index}.targetType` as const, { required: true })}
                   >
                     <option value="account">Account</option>
                     <option value="category">Category</option>
                     <option value="envelope">Envelope</option>
                   </select>
                 </div>

                 {watch(`lines.${index}.targetType`) === "account" && (
                   <div>
                     <label htmlFor={`lines.${index}.accountId`}>Account ID:</label>
                     <input
                       type="text"
                       id={`lines.${index}.accountId`}
                       disabled={isSubmitting}
                       {...register(`lines.${index}.accountId` as const, { required: true })}
                     />
                   </div>
                 )}

                 {watch(`lines.${index}.targetType`) === "category" && (
                   <div>
                     <label htmlFor={`lines.${index}.categoryId`}>Category ID:</label>
                     <input
                       type="text"
                       id={`lines.${index}.categoryId`}
                       disabled={isSubmitting}
                       {...register(`lines.${index}.categoryId` as const, { required: true })}
                     />
                   </div>
                 )}

                 {watch(`lines.${index}.targetType`) === "envelope" && (
                   <div>
                     <label htmlFor={`lines.${index}.envelopeId`}>Envelope ID:</label>
                     <input
                       type="text"
                       id={`lines.${index}.envelopeId`}
                       disabled={isSubmitting}
                       {...register(`lines.${index}.envelopeId` as const, { required: true })}
                     />
                   </div>
                 )}

                 <div>
                   <label htmlFor={`lines.${index}.amountCents`}>Amount (cents, integer):</label>
                   <input
                     type="number"
                     id={`lines.${index}.amountCents`}
                     disabled={isSubmitting}
                     {...register(`lines.${index}.amountCents` as const, {
                       required: true,
                       valueAsNumber: true,
                       validate: (value) => Number.isInteger(value) || "Amount must be an integer (no decimals)",
                     })}
                   />
                   {errors.lines?.[index]?.amountCents && (
                     <span className="error">{errors.lines[index]?.amountCents?.message}</span>
                   )}
                 </div>

                 <button type="button" onClick={() => remove(index)} disabled={isSubmitting || fields.length <= 2}>
                   Remove
                 </button>
               </div>
             ))}
           </fieldset>

          <button type="button" onClick={addLine} disabled={isSubmitting}>
            Add Line
          </button>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Transaction"}
          </button>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Note</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td>{new Date(tx.transactionDate).toLocaleDateString()}</td>
              <td>{tx.note}</td>
              <td>{tx.type}</td>
              <td>{(tx.totalAmountCents / 100).toFixed(2)}</td>
              <td>
                <button type="button">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {transactions.length === 0 && !loading && (
        <p>No transactions found. Create one to get started.</p>
      )}
    </div>
  );
}

export default TransactionsPage;
