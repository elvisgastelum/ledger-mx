/**
 * Base error class for envelope application errors.
 */
export abstract class EnvelopeApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Thrown when an envelope is not found.
 */
export class EnvelopeNotFoundError extends EnvelopeApplicationError {
  constructor(id: string) {
    super(`Envelope not found: ${id}`);
  }
}

/**
 * Thrown when attempting to overspend a protected envelope.
 */
export class ProtectedEnvelopeOverspendError extends EnvelopeApplicationError {
  constructor(id: string, balanceCents: number, attemptedSpendCents: number) {
    super(
      `Cannot overspend protected envelope ${id}. ` +
        `Current balance: ${balanceCents} cents, ` +
        `attempted spend: ${attemptedSpendCents} cents`,
    );
  }
}

/**
 * Thrown when attempting to fund/allocate with insufficient account balance.
 */
export class InsufficientAccountBalanceError extends EnvelopeApplicationError {
  constructor(accountId: string, balanceCents: number, requestedCents: number) {
    super(
      `Insufficient balance in account ${accountId}. ` +
        `Current balance: ${balanceCents} cents, ` +
        `requested: ${requestedCents} cents`,
    );
  }
}

/**
 * Thrown when a default envelope conflict occurs during onboarding.
 */
export class EnvelopeOnboardingConflictError extends EnvelopeApplicationError {
  constructor(existingEnvelopeNames: string[]) {
    super(
      `Cannot apply default envelopes: user already has existing envelopes that don't match the defaults. ` +
        `Existing envelopes: ${existingEnvelopeNames.join(", ")}. ` +
        `Delete or reassign existing envelopes first.`,
    );
  }
}
