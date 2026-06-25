import type { AccountId, UserId } from "@ledger-mx/domain";

/**
 * Input type for getting a single account balance
 */
export interface GetAccountBalanceInput {
  userId: UserId;
  accountId: AccountId;
}

/**
 * Input type for getting multiple account balances
 */
export interface GetAccountBalancesInput {
  userId: UserId;
  accountIds?: AccountId[];
}

/**
 * Input type for getting balances by account type
 */
export interface GetBalancesByTypeInput {
  userId: UserId;
}

/**
 * Input type for getting liability balances
 */
export interface GetLiabilityBalancesInput {
  userId: UserId;
}

/**
 * Result type for general balance summary
 */
export interface GeneralBalanceResult {
  assetsBalanceCents: number;
  liabilitiesBalanceCents: number;
  netWorthCents: number;
}
