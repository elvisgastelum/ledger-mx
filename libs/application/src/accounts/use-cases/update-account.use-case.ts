import type {
  AccountRepository,
  UserId,
  AccountId,
  Account,
  AccountType,
  AccountStatus,
  SystemRole,
  OwnershipType,
} from "@ledger-mx/domain";
import type { UpdateAccountInput } from "../account.types";
import {
  AccountNotFoundError,
  SystemAccountModificationError,
} from "../account.errors";

export class UpdateAccountUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly clock: { now: () => Date },
  ) {}

  async execute(input: UpdateAccountInput): Promise<{
    id: string;
    name: string;
    type: AccountType;
    currencyCode: string;
    status: AccountStatus;
    ownership: OwnershipType;
    systemRole: SystemRole;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const account = await this.accountRepository.findById(
      input.userId as UserId,
      input.id as AccountId,
    );

    if (!account) {
      throw new AccountNotFoundError(input.id);
    }

    // Prevent modification of system accounts
    if (account.ownership === "system") {
      throw new SystemAccountModificationError(input.id);
    }

    // Update only provided fields
    if (input.name !== undefined) {
      account.name = input.name;
    }
    if (input.type !== undefined) {
      account.type = input.type as Account["type"];
    }
    if (input.currencyCode !== undefined) {
      account.currencyCode = input.currencyCode;
    }
    if (input.status !== undefined) {
      account.status = input.status;
    }
    account.updatedAt = this.clock.now();

    await this.accountRepository.save(account);

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      currencyCode: account.currencyCode,
      status: account.status,
      ownership: account.ownership,
      systemRole: account.systemRole ?? null,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
