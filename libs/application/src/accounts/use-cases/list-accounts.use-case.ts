import type { AccountRepository, UserId } from "@ledger-mx/domain";
import type { ListAccountsInput } from "../account.types";

export class ListAccountsUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
  ) {}

  async execute(input: ListAccountsInput): Promise<{ accounts: Array<{
    id: string;
    name: string;
    type: string;
    currencyCode: string;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> }> {
    const accounts = await this.accountRepository.listByUserId(input.userId as UserId);

    return {
      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        currencyCode: account.currencyCode,
        isArchived: account.isArchived,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      })),
    };
  }
}
