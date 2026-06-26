import { expect, test, describe } from "vitest";
import { TestAccountBuilder } from "./test-account-builder";
import { testAccountId, testUserId } from "./test-ids";

describe("TestAccountBuilder", () => {
  test("builds a valid account with safe defaults", () => {
    const account = new TestAccountBuilder().build();

    expect(account.id).toBeDefined();
    expect(account.userId).toBeDefined();
    expect(account.name).toBe("Test Checking Account");
    expect(account.type).toBe("debit");
    expect(account.currencyCode).toBe("MXN");
    expect(account.status).toBe("active");
    expect(account.ownership).toBe("user");
    expect(account.systemRole).toBeNull();
  });

  test("withName overrides the default name", () => {
    const account = new TestAccountBuilder()
      .withName("Savings Account")
      .build();

    expect(account.name).toBe("Savings Account");
  });

  test("withType overrides the default type", () => {
    const account = new TestAccountBuilder()
      .withType("savings")
      .build();

    expect(account.type).toBe("savings");
  });

  test("withSystemRole overrides the default (null)", () => {
    const account = new TestAccountBuilder()
      .withSystemRole("expense")
      .build();

    expect(account.systemRole).toBe("expense");
  });

  test("withId overrides the default id", () => {
    const customId = testAccountId();
    const account = new TestAccountBuilder()
      .withId(customId)
      .build();

    expect(account.id).toBe(customId);
  });

  test("withUserId overrides the default userId", () => {
    const customUserId = testUserId();
    const account = new TestAccountBuilder()
      .withUserId(customUserId)
      .build();

    expect(account.userId).toBe(customUserId);
  });
});
