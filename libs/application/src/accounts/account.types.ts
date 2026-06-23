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
  isArchived?: boolean;
}

export interface ListAccountsInput {
  userId: string;
}
