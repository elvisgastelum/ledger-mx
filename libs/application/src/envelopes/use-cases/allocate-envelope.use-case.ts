import { Transaction, TransactionLine } from "@ledger-mx/domain";
import type {
  Envelope,
  EnvelopeRepository,
  AccountRepository,
  TransactionRepository,
  BalanceRepository,
  UserId,
  EnvelopeId,
  AccountId,
  TransactionId,
  TransactionLineId,
} from "@ledger-mx/domain";
import { EnvelopeNotFoundError, InsufficientAccountBalanceError } from "../envelope.errors";
import type { AllocateEnvelopeInput } from "../envelope.types";
import type { IdGenerator, Clock } from "@ledger-mx/application";

export class AllocateEnvelopeUseCase {
  constructor(
    private readonly envelopeRepository: EnvelopeRepository,
    private readonly accountRepository: AccountRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly balanceRepository: BalanceRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: AllocateEnvelopeInput): Promise<Envelope> {
    const userId = input.userId as UserId;
    const envelopeId = input.envelopeId as EnvelopeId;
    const accountId = input.accountId as AccountId;

    // Verify envelope exists
    const envelope = await this.envelopeRepository.findById(userId, envelopeId);
    if (!envelope) {
      throw new EnvelopeNotFoundError(input.envelopeId);
    }

    // Verify account exists
    const account = await this.accountRepository.findById(userId, accountId);
    if (!account) {
      throw new Error(`Account not found: ${input.accountId}`);
    }

    // Get account balance
    const accountBalance = await this.getAccountBalance(userId, accountId);

    // Validate sufficient balance
    if (accountBalance < input.amountCents) {
      throw new InsufficientAccountBalanceError(
        input.accountId,
        accountBalance,
        input.amountCents,
      );
    }

    // Create double-entry transaction (same as fund)
    const now = this.clock.now();
    const transactionId = this.idGenerator.uuid() as TransactionId;
    const line1Id = this.idGenerator.uuid() as TransactionLineId;
    const line2Id = this.idGenerator.uuid() as TransactionLineId;

    // Create transaction lines
    const line1 = new TransactionLine({
      id: line1Id,
      transactionId: transactionId,
      targetType: "account",
      targetId: accountId as unknown as import("@ledger-mx/domain").TransactionLineTargetId,
      amountCents: -input.amountCents,
    });

    const line2 = new TransactionLine({
      id: line2Id,
      transactionId: transactionId,
      targetType: "envelope",
      targetId: envelopeId as unknown as import("@ledger-mx/domain").TransactionLineTargetId,
      amountCents: input.amountCents,
    });

    // Create transaction
    const transaction = new Transaction({
      id: transactionId,
      userId,
      type: "envelope_allocation",
      occurredAt: now,
      description: `Allocate to envelope: ${envelope.name}`,
      lines: [line1, line2],
    });

    await this.transactionRepository.save(transaction);

    return envelope;
  }

  private async getAccountBalance(userId: UserId, accountId: AccountId): Promise<number> {
    const balance = await this.balanceRepository.getAccountBalance(userId, accountId);
    if (!balance) {
      throw new Error(`Account not found: ${accountId}`);
    }
    return balance.balanceCents;
  }
}
