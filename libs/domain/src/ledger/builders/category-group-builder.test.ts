import { expect, test, describe } from "vitest";
import { CategoryGroupBuilder } from "./category-group-builder";
import {
  categoryGroupIdFromString,
  userIdFromString,
} from "../../value-objects/uuid";
import type { CategoryGroupKind, OwnershipType } from "../../index";

// Valid UUID v4 strings for testing
const CATEGORY_GROUP_ID = "9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a";
const USER_ID = "8a3b2c1d-5678-4f9e-8a1b-2c3d4e5f6a7b";

const categoryGroupId = categoryGroupIdFromString(CATEGORY_GROUP_ID);
const userId = userIdFromString(USER_ID);

describe("CategoryGroupBuilder", () => {
  test("builds a valid category group", () => {
    const categoryGroup = new CategoryGroupBuilder()
      .withId(categoryGroupId)
      .withUserId(userId)
      .withName("Needs")
      .withKind("expense" as CategoryGroupKind)
      .withIdealPercentageBasisPoints(5000) // 50%
      .withSortOrder(0)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user" as OwnershipType)
      .build();

    expect(categoryGroup.id).toBe(CATEGORY_GROUP_ID);
    expect(categoryGroup.userId).toBe(USER_ID);
    expect(categoryGroup.name).toBe("Needs");
    expect(categoryGroup.kind).toBe("expense");
    expect(categoryGroup.idealPercentageBasisPoints).toBe(5000);
    expect(categoryGroup.sortOrder).toBe(0);
    expect(categoryGroup.ownership).toBe("user");
  });

  test("idealPercentageBasisPoints can be null for income groups", () => {
    const categoryGroup = new CategoryGroupBuilder()
      .withId(categoryGroupId)
      .withUserId(userId)
      .withName("Income")
      .withKind("income" as CategoryGroupKind)
      .withIdealPercentageBasisPoints(null)
      .withSortOrder(1)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user" as OwnershipType)
      .build();

    expect(categoryGroup.idealPercentageBasisPoints).toBeNull();
  });

  test("sortOrder can be 0", () => {
    const categoryGroup = new CategoryGroupBuilder()
      .withId(categoryGroupId)
      .withUserId(userId)
      .withName("First Group")
      .withKind("expense" as CategoryGroupKind)
      .withIdealPercentageBasisPoints(5000)
      .withSortOrder(0)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user" as OwnershipType)
      .build();

    expect(categoryGroup.sortOrder).toBe(0);
  });

  test("throws if idealPercentageBasisPoints is not set", () => {
    const builder = new CategoryGroupBuilder()
      .withId(categoryGroupId)
      .withUserId(userId)
      .withName("Test Group")
      .withKind("expense" as CategoryGroupKind)
      .withSortOrder(0)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user" as OwnershipType);
    // Intentionally not calling withIdealPercentageBasisPoints()

    expect(() => builder.build()).toThrow("CategoryGroupBuilder: idealPercentageBasisPoints is required");
  });

  test("throws if sortOrder is not set", () => {
    const builder = new CategoryGroupBuilder()
      .withId(categoryGroupId)
      .withUserId(userId)
      .withName("Test Group")
      .withKind("expense" as CategoryGroupKind)
      .withIdealPercentageBasisPoints(5000)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user" as OwnershipType);
    // Intentionally not calling withSortOrder()

    expect(() => builder.build()).toThrow("CategoryGroupBuilder: sortOrder is required");
  });

  test("throws if id is missing when building", () => {
    const builder = new CategoryGroupBuilder()
      .withUserId(userId)
      .withName("Test Group")
      .withKind("expense" as CategoryGroupKind)
      .withIdealPercentageBasisPoints(5000)
      .withSortOrder(0)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user" as OwnershipType);

    expect(() => builder.build()).toThrow("CategoryGroupBuilder: id is required");
  });

  test("omits deletedAt when not set", () => {
    const categoryGroup = new CategoryGroupBuilder()
      .withId(categoryGroupId)
      .withUserId(userId)
      .withName("Test Group")
      .withKind("expense" as CategoryGroupKind)
      .withIdealPercentageBasisPoints(5000)
      .withSortOrder(0)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user" as OwnershipType)
      .build();

    expect(categoryGroup.deletedAt).toBeUndefined();
  });
});
