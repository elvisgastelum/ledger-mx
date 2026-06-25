import type {
  AccountRepository,
  UserId,
  AccountId,
  SystemRole,
} from "@ledger-mx/domain";
import type { IdGenerator } from "../../auth/ports/id-generator.port";
import type { Clock } from "../../auth/ports/clock.port";
import type { Account } from "@ledger-mx/domain";

/**
 * System account definitions for MVP.
 * These are auto-created for each user and used for transaction balancing.
 */
interface SystemAccountDefinition {
  name: string;
  role: SystemRole;
}

const SYSTEM_ACCOUNTS: SystemAccountDefinition[] = [
  { name: "Expense", role: "expense" },
  { name: "Income", role: "income" },
  { name: "Salary", role: "salary" },
];

/**
 * Use case to ensure system accounts exist for a user.
 * Idempotent: safe to call multiple times.
 * Per-user unique by system role.
 */
export class EnsureSystemAccountsUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(userId: UserId): Promise<Account[]> {
    const existingSystemAccounts =
      await this.accountRepository.findSystemAccounts(userId);

    const existingRoles = new Set(
      existingSystemAccounts
        .map((a) => a.systemRole)
        .filter((role): role is SystemRole => role !== null),
    );

    const accountsToCreate = SYSTEM_ACCOUNTS.filter(
      (def) => !existingRoles.has(def.role),
    );

    const createdAccounts: Account[] = [];

    for (const def of accountsToCreate) {
      const account: Account = {
        id: this.idGenerator.uuid() as AccountId,
        userId: userId,
        name: def.name,
        type: "cash",
        currencyCode: "USD",
        status: "active",
        createdAt: this.clock.now(),
        updatedAt: this.clock.now(),
        deletedAt: null,
        ownership: "system",
        systemRole: def.role,
      };

      await this.accountRepository.save(account);
      createdAccounts.push(account);
    }

    return [...existingSystemAccounts, ...createdAccounts];
  }
}
