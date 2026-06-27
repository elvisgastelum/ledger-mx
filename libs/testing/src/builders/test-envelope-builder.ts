import {
  EnvelopeBuilder as DomainEnvelopeBuilder,
  Envelope,
  EnvelopeId,
  UserId,
} from "@ledger-mx/domain";
import {
  testUserId,
  testEnvelopeId,
} from "./test-ids";

/**
 * Test-only EnvelopeBuilder with safe defaults.
 */
export class TestEnvelopeBuilder {
  private builder = new DomainEnvelopeBuilder();

  constructor() {
    // Set sensible defaults
    this.builder
      .withId(testEnvelopeId())
      .withUserId(testUserId())
      .withName("Test Envelope")
      .withTargetAmountCents(null)
      .withIsProtected(true)
      .withSortOrder(0)
      .withCreatedAt(new Date("2024-01-15T00:00:00.000Z"))
      .withUpdatedAt(new Date("2024-01-15T00:00:00.000Z"))
      .withDeletedAt(null);
  }

  withId(id: EnvelopeId): this {
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

  withTargetAmountCents(targetAmountCents: number | null): this {
    this.builder.withTargetAmountCents(targetAmountCents);
    return this;
  }

  withIsProtected(isProtected: boolean): this {
    this.builder.withIsProtected(isProtected);
    return this;
  }

  withSortOrder(sortOrder: number): this {
    this.builder.withSortOrder(sortOrder);
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

  build(): Envelope {
    return this.builder.build();
  }
}
