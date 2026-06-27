import type { UserId } from "@ledger-mx/domain";

export interface CreateEnvelopeInput {
  userId: string;
  name: string;
  targetAmountCents?: number | null;
  isProtected?: boolean;
}

export interface UpdateEnvelopeInput {
  userId: string;
  id: string;
  name?: string;
  targetAmountCents?: number | null;
  isProtected?: boolean;
}

export interface ListEnvelopesInput {
  userId: string;
}

export interface GetEnvelopeInput {
  userId: string;
  id: string;
}

export interface ArchiveEnvelopeInput {
  userId: string;
  id: string;
}

export interface FundEnvelopeInput {
  userId: string;
  envelopeId: string;
  accountId: string;
  amountCents: number;
}

export interface AllocateEnvelopeInput {
  userId: string;
  envelopeId: string;
  accountId: string;
  amountCents: number;
}

export interface GetEnvelopeBalanceInput {
  userId: string;
  envelopeId: string;
}

export interface GetEnvelopeTransactionsInput {
  userId: string;
  envelopeId: string;
}

export type ApplyDefaultEnvelopesInput = {
  userId: UserId;
};

export type ApplyDefaultEnvelopesResult = {
  envelopes: Array<{
    id: string;
    name: string;
    targetAmountCents: number | null;
    isProtected: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  created: boolean;
};
