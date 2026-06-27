import { expect, test, describe } from "vitest";
import { EnvelopeBuilder } from "./envelope-builder";
import {
  envelopeIdFromString,
  userIdFromString,
} from "../../value-objects/uuid";
import type { EnvelopeId, UserId } from "../../index";

// Valid UUID v4 strings for testing
const ENVELOPE_ID = "9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a";
const USER_ID = "8a3b2c1d-5678-4f9e-8a1b-2c3d4e5f6a7b";

const envelopeId = envelopeIdFromString(ENVELOPE_ID) as EnvelopeId;
const userId = userIdFromString(USER_ID) as UserId;

describe("EnvelopeBuilder", () => {
  test("builds a valid envelope", () => {
    const envelope = new EnvelopeBuilder()
      .withId(envelopeId)
      .withUserId(userId)
      .withName("Groceries")
      .withTargetAmountCents(500000)
      .withIsProtected(true)
      .withSortOrder(0)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withDeletedAt(null)
      .build();

    expect(envelope.id).toBe(ENVELOPE_ID);
    expect(envelope.userId).toBe(USER_ID);
    expect(envelope.name).toBe("Groceries");
    expect(envelope.targetAmountCents).toBe(500000);
    expect(envelope.isProtected).toBe(true);
    expect(envelope.sortOrder).toBe(0);
  });

  test("accepts null targetAmountCents", () => {
    const envelope = new EnvelopeBuilder()
      .withId(envelopeId)
      .withUserId(userId)
      .withName("Test Envelope")
      .withTargetAmountCents(null)
      .withIsProtected(true)
      .withSortOrder(0)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .build();

    expect(envelope.targetAmountCents).toBeNull();
  });

  test("accepts zero targetAmountCents", () => {
    const envelope = new EnvelopeBuilder()
      .withId(envelopeId)
      .withUserId(userId)
      .withName("Test Envelope")
      .withTargetAmountCents(0)
      .withIsProtected(true)
      .withSortOrder(0)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .build();

    expect(envelope.targetAmountCents).toBe(0);
  });

  test("throws if targetAmountCents is negative", () => {
    const builder = new EnvelopeBuilder()
      .withId(envelopeId)
      .withUserId(userId)
      .withName("Test Envelope")
      .withIsProtected(true)
      .withSortOrder(0)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"));

    expect(() => builder.withTargetAmountCents(-1000)).toThrow(
      "EnvelopeBuilder: targetAmountCents must be non-negative",
    );
  });

  test("throws if id is missing when building", () => {
    const builder = new EnvelopeBuilder()
      .withUserId(userId)
      .withName("Test Envelope")
      .withTargetAmountCents(null)
      .withIsProtected(true)
      .withSortOrder(0)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"));

    expect(() => builder.build()).toThrow("EnvelopeBuilder: id is required");
  });

  test("throws if userId is missing when building", () => {
    const builder = new EnvelopeBuilder()
      .withId(envelopeId)
      .withName("Test Envelope")
      .withTargetAmountCents(null)
      .withIsProtected(true)
      .withSortOrder(0)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"));

    expect(() => builder.build()).toThrow("EnvelopeBuilder: userId is required");
  });

  test("throws if name is missing when building", () => {
    const builder = new EnvelopeBuilder()
      .withId(envelopeId)
      .withUserId(userId)
      .withTargetAmountCents(null)
      .withIsProtected(true)
      .withSortOrder(0)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"));

    expect(() => builder.build()).toThrow("EnvelopeBuilder: name is required");
  });

  test("omits deletedAt when not set", () => {
    const envelope = new EnvelopeBuilder()
      .withId(envelopeId)
      .withUserId(userId)
      .withName("Test Envelope")
      .withTargetAmountCents(null)
      .withIsProtected(true)
      .withSortOrder(0)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .build();

    expect(envelope.deletedAt).toBeUndefined();
  });

  test("includes deletedAt when set", () => {
    const deletedAt = new Date("2024-06-01");
    const envelope = new EnvelopeBuilder()
      .withId(envelopeId)
      .withUserId(userId)
      .withName("Test Envelope")
      .withTargetAmountCents(null)
      .withIsProtected(true)
      .withSortOrder(0)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-06-01"))
      .withDeletedAt(deletedAt)
      .build();

    expect(envelope.deletedAt).toBe(deletedAt);
  });
});

