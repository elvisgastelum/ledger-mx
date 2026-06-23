import type { AccountRepository, UserId, AccountId } from "@ledger-mx/domain";
import { AccountNotFoundError } from "../account.errors";

export class ArchiveAccountUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly clock: { now: () => Date },
  ) {}

  async execute(input: { userId: string; id: string }): Promise<void> {
    const account = await this.accountRepository.findById(
      input.userId as UserId,
      input.id as AccountId,
    );

    if (!account) {
      throw new AccountNotFoundError(input.id);
    }

    // Set isArchived to true and update timestamp
    account.isArchived = true;
    account.updatedAt = this.clock.now();

    await this.accountRepository.save(account);
  }
}
