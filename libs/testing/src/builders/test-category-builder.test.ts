import { expect, test, describe } from "vitest";
import { TestCategoryBuilder } from "./test-category-builder";
import { testCategoryId, testCategoryGroupId } from "./test-ids";

describe("TestCategoryBuilder", () => {
  test("builds a valid category with safe defaults", () => {
    const category = new TestCategoryBuilder().build();

    expect(category.id).toBeDefined();
    expect(category.userId).toBeDefined();
    expect(category.name).toBe("Test Category");
    expect(category.parentId).toBeNull();
    expect(category.categoryGroupId).toBeDefined();
    expect(category.ownership).toBe("user");
  });

  test("withName overrides the default name", () => {
    const category = new TestCategoryBuilder()
      .withName("Groceries")
      .build();

    expect(category.name).toBe("Groceries");
  });

  test("withParentId overrides the default (null)", () => {
    const parentId = testCategoryId();
    const category = new TestCategoryBuilder()
      .withParentId(parentId)
      .build();

    expect(category.parentId).toBe(parentId);
  });

  test("withCategoryGroupId overrides the default", () => {
    const customGroupId = testCategoryGroupId();
    const category = new TestCategoryBuilder()
      .withCategoryGroupId(customGroupId)
      .build();

    expect(category.categoryGroupId).toBe(customGroupId);
  });

  test("withOwnership overrides the default", () => {
    const category = new TestCategoryBuilder()
      .withOwnership("system")
      .build();

    expect(category.ownership).toBe("system");
  });
});
