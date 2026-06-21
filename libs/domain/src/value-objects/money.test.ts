import { expect, test, describe } from "vitest";
import { Money } from "./money";
import { InvalidMoneyAmountError } from "../ledger/ledger-errors";

describe("Money", () => {
  test("fromCents creates instance with valid integer cents", () => {
    const money = Money.fromCents(100);
    expect(money.amountCents).toBe(100);
  });

  test("fromCents rejects non-integer values", () => {
    expect(() => Money.fromCents(100.5)).toThrow(InvalidMoneyAmountError);
    expect(() => Money.fromCents(1.999)).toThrow(InvalidMoneyAmountError);
  });

  test("fromCents rejects non-finite values", () => {
    expect(() => Money.fromCents(NaN)).toThrow(InvalidMoneyAmountError);
    expect(() => Money.fromCents(Infinity)).toThrow(InvalidMoneyAmountError);
    expect(() => Money.fromCents(-Infinity)).toThrow(InvalidMoneyAmountError);
  });

  test("zero returns Money with 0 cents", () => {
    const zero = Money.zero();
    expect(zero.amountCents).toBe(0);
    expect(zero).toBeInstanceOf(Money);
  });

  test("add returns sum of two Moneys as new Money", () => {
    const a = Money.fromCents(100);
    const b = Money.fromCents(200);
    const sum = a.add(b);
    expect(sum.amountCents).toBe(300);
    expect(sum).toBeInstanceOf(Money);
  });

  test("subtract returns difference of two Moneys as new Money", () => {
    const a = Money.fromCents(200);
    const b = Money.fromCents(100);
    const diff = a.subtract(b);
    expect(diff.amountCents).toBe(100);
    expect(diff).toBeInstanceOf(Money);
  });

  test("negate returns Money with inverted amount", () => {
    const a = Money.fromCents(100);
    expect(a.negate().amountCents).toBe(-100);
    expect(Money.zero().negate().amountCents).toBe(0);
  });

  test("equals returns true for same amount, false otherwise", () => {
    const a = Money.fromCents(100);
    const b = Money.fromCents(100);
    const c = Money.fromCents(200);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
