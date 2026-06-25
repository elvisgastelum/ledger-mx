import type { AccountStatus } from "@ledger-mx/domain";

export interface CreateAccountInput {
  userId: string;
  name: string;
  type: string;
  currencyCode?: string;
}

export interface UpdateAccountInput {
  userId: string;
  id: string;
  name?: string;
  type?: string;
  currencyCode?: string;
  status?: AccountStatus;
}

export interface ListAccountsInput {
  userId: string;
}
