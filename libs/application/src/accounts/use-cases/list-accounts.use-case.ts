import type {
  AccountRepository,
  UserId,
  SystemRole,
  AccountStatus,
  OwnershipType,
} from "@ledger-mx/domain";
import type { ListAccountsInput } from "../account.types";

export class ListAccountsUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(input: ListAccountsInput): Promise<{
    accounts: Array<{
      id: string;
      name: string;
      type: string;
      currencyCode: string;
      status: AccountStatus;
      ownership: OwnershipType;
      systemRole: SystemRole;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }> {
    const accounts = await this.accountRepository.listByUserId(
      input.userId as UserId,
    );

    return {
      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        currencyCode: account.currencyCode,
        status: account.status,
        ownership: account.ownership,
        systemRole: account.systemRole ?? null,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      })),
    };
  }
}
