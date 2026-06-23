export interface CreateTransactionInput {
  userId: string;
  id: string;
  transactionDate: string;
  note?: string | null;
  type: string;
  lines: Array<{
    id: string;
    targetType: string;
    accountId: string | null;
    categoryId: string | null;
    envelopeId: string | null;
    amountCents: number;
    type: string;
  }>;
}

export interface ListTransactionsInput {
  userId: string;
}

export interface TransactionLineOutput {
  id: string;
  targetType: string;
  accountId: string | null;
  categoryId: string | null;
  envelopeId: string | null;
  amountCents: number;
  type: string;
}

export interface CreateTransactionOutput {
  id: string;
  transactionDate: Date;
  note: string | null;
  type: string;
  totalAmountCents: number;
  lines: TransactionLineOutput[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ListTransactionsOutput {
  transactions: Array<{
    id: string;
    transactionDate: Date;
    note: string | null;
    type: string;
    totalAmountCents: number;
    lines: TransactionLineOutput[];
    createdAt: Date;
    updatedAt: Date;
  }>;
}
