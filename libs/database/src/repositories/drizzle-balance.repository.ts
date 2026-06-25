import { eq, and, isNull, sql, inArray } from "drizzle-orm";
import type {
  BalanceRepository,
  AccountBalance,
  BalanceByAccountType,
  LiabilityAccountBalance,
  UserId,
  AccountId,
  AccountType,
} from "@ledger-mx/domain";
import type { Database } from "../connection";
import { accounts, transactions, transactionLines } from "../schema";

/**
 * Drizzle ORM implementation of BalanceRepository.
 * Calculates balances at runtime from transaction lines.
 */
export class DrizzleBalanceRepository implements BalanceRepository {
  constructor(private readonly db: Database) {}

  async getAccountBalance(
    userId: UserId,
    accountId: AccountId,
  ): Promise<AccountBalance | null> {
    // First verify account exists and belongs to user
    const accountResult = await this.db
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(
          eq(accounts.id, accountId as string),
          eq(accounts.userId, userId as string),
          isNull(accounts.deletedAt),
        ),
      )
      .limit(1);

    if (accountResult.length === 0) {
      return null;
    }

    // Calculate balance from transaction lines
    const balanceResult = await this.db
      .select({
        balanceCents: sql<number>`coalesce(sum(${transactionLines.amountCents}), 0)`,
      })
      .from(transactionLines)
      .innerJoin(
        transactions,
        and(
          eq(transactions.id, transactionLines.transactionId),
          eq(transactions.userId, userId as string),
          isNull(transactions.deletedAt),
        ),
      )
      .where(
        and(
          eq(transactionLines.userId, userId as string),
          eq(transactionLines.accountId, accountId as string),
          eq(transactionLines.targetType, "account"),
          isNull(transactionLines.deletedAt),
        ),
      );

    const balanceCents = Number(balanceResult[0]?.balanceCents ?? 0);

    return {
      accountId: accountResult[0].id as AccountId,
      balanceCents,
    };
  }

  async getAccountBalances(
    userId: UserId,
    accountIds?: AccountId[],
  ): Promise<AccountBalance[]> {
    // Build base query for accounts
    const whereConditions = [
      eq(accounts.userId, userId as string),
      isNull(accounts.deletedAt),
    ];

    if (accountIds && accountIds.length > 0) {
      whereConditions.push(
        inArray(
          accounts.id,
          accountIds.map((id) => id as string),
        ),
      );
    }

    const userAccounts = await this.db
      .select({
        id: accounts.id,
        type: accounts.type,
      })
      .from(accounts)
      .where(and(...whereConditions));

    if (userAccounts.length === 0) {
      return [];
    }

    // Get all account IDs
    const accountIdsForQuery = userAccounts.map((a) => a.id);

    // Calculate balances for all accounts in one query
    const balanceResults = await this.db
      .select({
        accountId: transactionLines.accountId,
        balanceCents: sql<number>`coalesce(sum(${transactionLines.amountCents}), 0)`,
      })
      .from(transactionLines)
      .innerJoin(
        transactions,
        and(
          eq(transactions.id, transactionLines.transactionId),
          eq(transactions.userId, userId as string),
          isNull(transactions.deletedAt),
        ),
      )
      .where(
        and(
          eq(transactionLines.userId, userId as string),
          inArray(transactionLines.accountId, accountIdsForQuery),
          eq(transactionLines.targetType, "account"),
          isNull(transactionLines.deletedAt),
        ),
      )
      .groupBy(transactionLines.accountId);

    // Build map of account ID to balance
    const balanceMap = new Map<string, number>();
    for (const row of balanceResults) {
      if (row.accountId) {
        balanceMap.set(row.accountId, Number(row.balanceCents ?? 0));
      }
    }

    // Return balances for all accounts (defaulting to 0 if no lines)
    return userAccounts.map((account) => ({
      accountId: account.id as AccountId,
      balanceCents: balanceMap.get(account.id) ?? 0,
    }));
  }

  async getBalancesByAccountType(
    userId: UserId,
  ): Promise<BalanceByAccountType[]> {
    // Get all non-deleted accounts for user with their balances
    const accountsWithBalances = await this.getAccountBalances(
      userId as UserId,
    );

    // Get account types for mapping
    const userAccounts = await this.db
      .select({
        id: accounts.id,
        type: accounts.type,
      })
      .from(accounts)
      .where(
        and(eq(accounts.userId, userId as string), isNull(accounts.deletedAt)),
      );

    const accountTypeMap = new Map<string, string>();
    for (const account of userAccounts) {
      accountTypeMap.set(account.id, account.type);
    }

    // Group by account type
    const typeMap = new Map<
      string,
      { balanceCents: number; accountCount: number }
    >();

    for (const balance of accountsWithBalances) {
      const accountType = accountTypeMap.get(balance.accountId as string);
      if (!accountType) continue;

      const existing = typeMap.get(accountType) ?? {
        balanceCents: 0,
        accountCount: 0,
      };
      typeMap.set(accountType, {
        balanceCents: existing.balanceCents + balance.balanceCents,
        accountCount: existing.accountCount + 1,
      });
    }

    return Array.from(typeMap.entries()).map(([accountType, data]) => ({
      accountType: accountType as AccountType,
      balanceCents: data.balanceCents,
      accountCount: data.accountCount,
    }));
  }

  async getLiabilityBalances(
    userId: UserId,
  ): Promise<LiabilityAccountBalance[]> {
    // Get liability accounts (credit and loan)
    const liabilityAccounts = await this.db
      .select({
        id: accounts.id,
        name: accounts.name,
        type: accounts.type,
      })
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, userId as string),
          isNull(accounts.deletedAt),
          inArray(accounts.type, ["credit", "loan"]),
        ),
      );

    if (liabilityAccounts.length === 0) {
      return [];
    }

    const liabilityAccountIds = liabilityAccounts.map((a) => a.id);
    const accountInfoMap = new Map<string, { name: string; type: string }>();
    for (const account of liabilityAccounts) {
      accountInfoMap.set(account.id, {
        name: account.name,
        type: account.type,
      });
    }

    // Calculate balances
    const balanceResults = await this.db
      .select({
        accountId: transactionLines.accountId,
        balanceCents: sql<number>`coalesce(sum(${transactionLines.amountCents}), 0)`,
      })
      .from(transactionLines)
      .innerJoin(
        transactions,
        and(
          eq(transactions.id, transactionLines.transactionId),
          eq(transactions.userId, userId as string),
          isNull(transactions.deletedAt),
        ),
      )
      .where(
        and(
          eq(transactionLines.userId, userId as string),
          inArray(transactionLines.accountId, liabilityAccountIds),
          eq(transactionLines.targetType, "account"),
          isNull(transactionLines.deletedAt),
        ),
      )
      .groupBy(transactionLines.accountId);

    const balanceMap = new Map<string, number>();
    for (const row of balanceResults) {
      if (row.accountId) {
        balanceMap.set(row.accountId, Number(row.balanceCents ?? 0));
      }
    }

    return liabilityAccounts.map((account) => {
      const info = accountInfoMap.get(account.id)!;
      return {
        accountId: account.id as AccountId,
        accountName: info.name,
        accountType: info.type as AccountType,
        balanceCents: balanceMap.get(account.id) ?? 0,
      };
    });
  }
}
