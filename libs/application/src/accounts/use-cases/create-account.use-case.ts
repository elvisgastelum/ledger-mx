import { AccountBuilder, Account } from "@ledger-mx/domain";
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
    const now = this.clock.now();

    const account = new AccountBuilder()
      .withId(this.idGenerator.uuid() as AccountId)
      .withUserId(input.userId as UserId)
      .withName(input.name)
      .withType(input.type as Account["type"])
      .withCurrencyCode(input.currencyCode ?? "MXN")
      .withStatus("active" as AccountStatus)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .withDeletedAt(null)
      .withOwnership("user" as OwnershipType)
      .withSystemRole(null)
      .build();

    await this.accountRepository.save(account);

    return account;
  }
}
