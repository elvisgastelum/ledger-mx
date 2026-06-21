import { InvalidMoneyAmountError } from "../ledger/ledger-errors";

/**
 * Immutable Money value object representing integer minor units (cents).
 * Never uses floats for monetary values.
 */
export class Money {
  private constructor(public readonly amountCents: number) {}

  /**
   * Creates a Money instance from integer cents.
   * @throws {InvalidMoneyAmountError} If amountCents is not a finite integer.
   */
  static fromCents(amountCents: number): Money {
    if (
      typeof amountCents !== "number" ||
      !Number.isFinite(amountCents) ||
      !Number.isInteger(amountCents)
    ) {
      throw new InvalidMoneyAmountError(
        `Invalid money amount: ${amountCents}. Must be a finite integer.`,
      );
    }
    return new Money(amountCents);
  }

  /** Returns a Money instance with 0 cents. */
  static zero(): Money {
    return Money.fromCents(0);
  }

  /** Returns a new Money instance with the sum of this and another Money. */
  add(other: Money): Money {
    return Money.fromCents(this.amountCents + other.amountCents);
  }

  /** Returns a new Money instance with the difference of this and another Money. */
  subtract(other: Money): Money {
    return Money.fromCents(this.amountCents - other.amountCents);
  }

  /** Returns a new Money instance with the negated amount. */
  negate(): Money {
    if (this.amountCents === 0) {
      return Money.zero();
    }
    return Money.fromCents(-this.amountCents);
  }

  /** Checks if this Money equals another Money by amount. */
  equals(other: Money): boolean {
    return this.amountCents === other.amountCents;
  }
}
