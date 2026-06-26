import {
  AccountBuilder as DomainAccountBuilder,
  Account,
  AccountId,
  UserId,
  AccountType,
  AccountStatus,
  OwnershipType,
} from "@ledger-mx/domain";
import {
  testUserId,
  testAccountId,
} from "./test-ids";

/**
 * Test-only AccountBuilder with safe defaults.
 */
export class TestAccountBuilder {
  private builder = new DomainAccountBuilder();

  constructor() {
    // Set sensible defaults
    this.builder
      .withId(testAccountId())
      .withUserId(testUserId())
      .withName("Test Checking Account")
      .withType("debit")
      .withCurrencyCode("MXN")
      .withStatus("active")
      .withCreatedAt(new Date("2024-01-15T00:00:00.000Z"))
      .withUpdatedAt(new Date("2024-01-15T00:00:00.000Z"))
      .withOwnership("user")
      .withSystemRole(null);
  }

  withId(id: AccountId): this {
    this.builder.withId(id);
    return this;
  }

  withUserId(userId: UserId): this {
    this.builder.withUserId(userId);
    return this;
  }

  withName(name: string): this {
    this.builder.withName(name);
    return this;
  }

  withType(type: AccountType): this {
    this.builder.withType(type);
    return this;
  }

  withCurrencyCode(currencyCode: string): this {
    this.builder.withCurrencyCode(currencyCode);
    return this;
  }

  withStatus(status: AccountStatus): this {
    this.builder.withStatus(status);
    return this;
  }

  withCreatedAt(createdAt: Date): this {
    this.builder.withCreatedAt(createdAt);
    return this;
  }

  withUpdatedAt(updatedAt: Date): this {
    this.builder.withUpdatedAt(updatedAt);
    return this;
  }

  withDeletedAt(deletedAt: Date | null): this {
    this.builder.withDeletedAt(deletedAt);
    return this;
  }

  withOwnership(ownership: OwnershipType): this {
    this.builder.withOwnership(ownership);
    return this;
  }

  withSystemRole(systemRole: "expense" | "income" | "salary" | null): this {
    this.builder.withSystemRole(systemRole);
    return this;
  }

  build(): Account {
    return this.builder.build();
  }
}
