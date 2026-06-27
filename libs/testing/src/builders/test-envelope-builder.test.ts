import { expect, test, describe } from "vitest";
import { TestEnvelopeBuilder } from "./test-envelope-builder";
import { testEnvelopeId, testUserId } from "./test-ids";

describe("TestEnvelopeBuilder", () => {
  test("builds a valid envelope with safe defaults", () => {
    const envelope = new TestEnvelopeBuilder().build();

    expect(envelope.id).toBeDefined();
    expect(envelope.userId).toBeDefined();
    expect(envelope.name).toBe("Test Envelope");
    expect(envelope.targetAmountCents).toBeNull();
    expect(envelope.isProtected).toBe(true);
    expect(envelope.sortOrder).toBe(0);
  });

  test("withName overrides the default name", () => {
    const envelope = new TestEnvelopeBuilder()
      .withName("Groceries")
      .build();

    expect(envelope.name).toBe("Groceries");
  });

  test("withTargetAmountCents overrides the default (null)", () => {
    const envelope = new TestEnvelopeBuilder()
      .withTargetAmountCents(500000)
      .build();

    expect(envelope.targetAmountCents).toBe(500000);
  });

  test("withIsProtected overrides the default", () => {
    const envelope = new TestEnvelopeBuilder()
      .withIsProtected(false)
      .build();

    expect(envelope.isProtected).toBe(false);
  });

  test("withSortOrder overrides the default", () => {
    const envelope = new TestEnvelopeBuilder()
      .withSortOrder(5)
      .build();

    expect(envelope.sortOrder).toBe(5);
  });

  test("withId overrides the default id", () => {
    const customId = testEnvelopeId();
    const envelope = new TestEnvelopeBuilder()
      .withId(customId)
      .build();

    expect(envelope.id).toBe(customId);
  });

  test("withUserId overrides the default userId", () => {
    const customUserId = testUserId();
    const envelope = new TestEnvelopeBuilder()
      .withUserId(customUserId)
      .build();

    expect(envelope.userId).toBe(customUserId);
  });

  test("withDeletedAt sets the deletedAt field", () => {
    const deletedAt = new Date("2024-06-01");
    const envelope = new TestEnvelopeBuilder()
      .withDeletedAt(deletedAt)
      .build();

    expect(envelope.deletedAt).toBe(deletedAt);
  });

  test("withDeletedAt(null) sets deletedAt to null", () => {
    const envelope = new TestEnvelopeBuilder()
      .withDeletedAt(null)
      .build();

    expect(envelope.deletedAt).toBeNull();
  });
});
