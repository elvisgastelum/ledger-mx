import { Account } from "@ledger-mx/domain";
import type {
  AccountRepository,
  AccountId,
  UserId,
  AccountStatus,
  OwnershipType,
} from "@ledger-mx/domain";
import type { IdGenerator } from "@ledger-mx/application";
import type { CreateAccountInput } from "../account.types";

export class CreateAccountUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: { now: () => Date },
  ) {}

  async execute(input: CreateAccountInput): Promise<Account> {
    const account: Account = {
      id: this.idGenerator.uuid() as AccountId,
      userId: input.userId as UserId,
      name: input.name,
      type: input.type as Account["type"],
      currencyCode: input.currencyCode ?? "MXN",
      status: "active" as AccountStatus,
      createdAt: this.clock.now(),
      updatedAt: this.clock.now(),
      deletedAt: null,
      ownership: "user" as OwnershipType,
      systemRole: null,
    };

    await this.accountRepository.save(account);

    return account;
  }
}
