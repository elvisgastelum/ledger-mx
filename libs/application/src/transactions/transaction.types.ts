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
  reversalOfTransactionId: string | null;
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
    reversalOfTransactionId: string | null;
    lines: TransactionLineOutput[];
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export interface CreateReversalInput {
  userId: string;
  originalTransactionId: string;
  id: string;
  lineIds: string[];
  transactionDate?: string;
  note?: string | null;
}

export interface CreateReversalOutput {
  id: string;
  transactionDate: Date;
  note: string | null;
  type: string;
  totalAmountCents: number;
  reversalOfTransactionId: string;
  lines: TransactionLineOutput[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCorrectionInput {
  userId: string;
  originalTransactionId: string;
  reversal: {
    id: string;
    lineIds: string[];
    transactionDate?: string;
    note?: string | null;
  };
  correctedTransaction: {
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
  };
}

export interface CreateCorrectionOutput {
  reversal: CreateReversalOutput;
  correctedTransaction: CreateTransactionOutput;
}
