import { expect, test, describe } from "vitest";
import { CategoryBuilder } from "./category-builder";
import {
  categoryIdFromString,
  userIdFromString,
  categoryGroupIdFromString,
} from "../../value-objects/uuid";
import type { OwnershipType } from "../../index";

// Valid UUID v4 strings for testing
const CATEGORY_ID = "9f4e5a7b-1234-4d8e-9f1a-2b3c4d5e6f7a";
const USER_ID = "8a3b2c1d-5678-4f9e-8a1b-2c3d4e5f6a7b";
const CATEGORY_GROUP_ID = "7a8b9c0d-1234-4d8e-9f1a-2b3c4d5e6f7a";
const PARENT_CATEGORY_ID = "6a7b8c9d-1234-4d8e-9f1a-2b3c4d5e6f7a";

const categoryId = categoryIdFromString(CATEGORY_ID);
const userId = userIdFromString(USER_ID);
const categoryGroupId = categoryGroupIdFromString(CATEGORY_GROUP_ID);
const parentCategoryId = categoryIdFromString(PARENT_CATEGORY_ID);

describe("CategoryBuilder", () => {
  test("builds a valid category", () => {
    const category = new CategoryBuilder()
      .withId(categoryId)
      .withUserId(userId)
      .withName("Groceries")
      .withParentId(null)
      .withCategoryGroupId(categoryGroupId)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user" as OwnershipType)
      .build();

    expect(category.id).toBe(CATEGORY_ID);
    expect(category.userId).toBe(USER_ID);
    expect(category.name).toBe("Groceries");
    expect(category.parentId).toBeNull();
    expect(category.categoryGroupId).toBe(CATEGORY_GROUP_ID);
    expect(category.ownership).toBe("user");
  });

  test("parentId can be null for top-level categories", () => {
    const category = new CategoryBuilder()
      .withId(categoryId)
      .withUserId(userId)
      .withName("Needs")
      .withParentId(null)
      .withCategoryGroupId(categoryGroupId)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user" as OwnershipType)
      .build();

    expect(category.parentId).toBeNull();
  });

  test("parentId can be set for child categories", () => {
    const category = new CategoryBuilder()
      .withId(categoryId)
      .withUserId(userId)
      .withName("Dining Out")
      .withParentId(parentCategoryId)
      .withCategoryGroupId(categoryGroupId)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user" as OwnershipType)
      .build();

    expect(category.parentId).toBe(PARENT_CATEGORY_ID);
  });

  test("throws if parentId is not set", () => {
    const builder = new CategoryBuilder()
      .withId(categoryId)
      .withUserId(userId)
      .withName("Test Category")
      .withCategoryGroupId(categoryGroupId)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user" as OwnershipType);
    // Intentionally not calling withParentId()

    expect(() => builder.build()).toThrow("CategoryBuilder: parentId is required");
  });

  test("throws if id is missing when building", () => {
    const builder = new CategoryBuilder()
      .withUserId(userId)
      .withName("Test Category")
      .withParentId(null)
      .withCategoryGroupId(categoryGroupId)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user" as OwnershipType);

    expect(() => builder.build()).toThrow("CategoryBuilder: id is required");
  });

  test("omits deletedAt when not set", () => {
    const category = new CategoryBuilder()
      .withId(categoryId)
      .withUserId(userId)
      .withName("Test Category")
      .withParentId(null)
      .withCategoryGroupId(categoryGroupId)
      .withCreatedAt(new Date("2024-01-15"))
      .withUpdatedAt(new Date("2024-01-15"))
      .withOwnership("user" as OwnershipType)
      .build();

    expect(category.deletedAt).toBeUndefined();
  });
});
