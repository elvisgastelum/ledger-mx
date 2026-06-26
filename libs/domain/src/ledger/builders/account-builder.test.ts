import { expect, test, describe } from "vitest";
import { AccountBuilder } from "./account-builder";
import {
  accountIdFromString,
  userIdFromString,
} from "../../value-objects/uuid";
import type { AccountType, AccountStatus, OwnershipType, SystemRole } from "../../index";

// Valid UUID v4 strings for testing
const ACCOUNT_ID = "9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a";
const USER_ID = "8a3b2c1d-5678-4f9e-8a1b-2c3d4e5f6a7b";

const accountId = accountIdFromString(ACCOUNT_ID);
const userId = userIdFromString(USER_ID);

describe("AccountBuilder", () => {
  test("builds a valid account", () => {
    const account = new AccountBuilder()
      .withId(accountId)
      .withUserId(userId)
      .withName("Chase Checking")
      .withType("debit" as AccountType)
      .withCurrencyCode("MXN")
      .withStatus("active" as AccountStatus)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user" as OwnershipType)
      .withSystemRole(null as SystemRole)
      .build();

    expect(account.id).toBe(ACCOUNT_ID);
    expect(account.userId).toBe(USER_ID);
    expect(account.name).toBe("Chase Checking");
    expect(account.type).toBe("debit");
    expect(account.currencyCode).toBe("MXN");
    expect(account.status).toBe("active");
    expect(account.ownership).toBe("user");
    expect(account.systemRole).toBeNull();
  });

  test("systemRole can be null", () => {
    const account = new AccountBuilder()
      .withId(accountId)
      .withUserId(userId)
      .withName("Test Account")
      .withType("debit" as AccountType)
      .withCurrencyCode("MXN")
      .withStatus("active" as AccountStatus)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user" as OwnershipType)
      .withSystemRole(null as SystemRole)
      .build();

    expect(account.systemRole).toBeNull();
  });

  test("systemRole can be set to a valid value", () => {
    const account = new AccountBuilder()
      .withId(accountId)
      .withUserId(userId)
      .withName("Expense Account")
      .withType("debit" as AccountType)
      .withCurrencyCode("MXN")
      .withStatus("active" as AccountStatus)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("system" as OwnershipType)
      .withSystemRole("expense" as SystemRole)
      .build();

    expect(account.systemRole).toBe("expense");
  });

  test("throws if id is missing when building", () => {
    const builder = new AccountBuilder()
      .withUserId(userId)
      .withName("Test Account")
      .withType("debit" as AccountType)
      .withCurrencyCode("MXN")
      .withStatus("active" as AccountStatus)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user" as OwnershipType)
      .withSystemRole(null as SystemRole);

    expect(() => builder.build()).toThrow("AccountBuilder: id is required");
  });

  test("throws if systemRole is not set", () => {
    const builder = new AccountBuilder()
      .withId(accountId)
      .withUserId(userId)
      .withName("Test Account")
      .withType("debit" as AccountType)
      .withCurrencyCode("MXN")
      .withStatus("active" as AccountStatus)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user" as OwnershipType);
    // Intentionally not calling withSystemRole()

    expect(() => builder.build()).toThrow("AccountBuilder: systemRole is required");
  });

  test("omits deletedAt when not set", () => {
    const account = new AccountBuilder()
      .withId(accountId)
      .withUserId(userId)
      .withName("Test Account")
      .withType("debit" as AccountType)
      .withCurrencyCode("MXN")
      .withStatus("active" as AccountStatus)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user" as OwnershipType)
      .withSystemRole(null as SystemRole)
      .build();

    expect(account.deletedAt).toBeUndefined();
  });

  test("includes deletedAt when set", () => {
    const deletedAt = new Date("2024-06-01");
    const account = new AccountBuilder()
      .withId(accountId)
      .withUserId(userId)
      .withName("Test Account")
      .withType("debit" as AccountType)
      .withCurrencyCode("MXN")
      .withStatus("archived" as AccountStatus)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-06-01"))
      .withOwnership("user" as OwnershipType)
      .withSystemRole(null as SystemRole)
      .withDeletedAt(deletedAt)
      .build();

    expect(account.deletedAt).toBe(deletedAt);
  });
});
