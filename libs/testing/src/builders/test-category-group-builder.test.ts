import { expect, test, describe } from "vitest";
import { TestCategoryGroupBuilder } from "./test-category-group-builder";
import { testCategoryGroupId } from "./test-ids";

describe("TestCategoryGroupBuilder", () => {
  test("builds a valid category group with safe defaults", () => {
    const categoryGroup = new TestCategoryGroupBuilder().build();

    expect(categoryGroup.id).toBeDefined();
    expect(categoryGroup.userId).toBeDefined();
    expect(categoryGroup.name).toBe("Test Category Group");
    expect(categoryGroup.kind).toBe("expense");
    expect(categoryGroup.idealPercentageBasisPoints).toBe(5000);
    expect(categoryGroup.sortOrder).toBe(0);
    expect(categoryGroup.ownership).toBe("user");
  });

  test("withName overrides the default name", () => {
    const categoryGroup = new TestCategoryGroupBuilder()
      .withName("Needs")
      .build();

    expect(categoryGroup.name).toBe("Needs");
  });

  test("withKind overrides the default kind", () => {
    const categoryGroup = new TestCategoryGroupBuilder()
      .withKind("income")
      .build();

    expect(categoryGroup.kind).toBe("income");
  });

  test("withIdealPercentageBasisPoints overrides the default", () => {
    const categoryGroup = new TestCategoryGroupBuilder()
      .withIdealPercentageBasisPoints(3000) // 30%
      .build();

    expect(categoryGroup.idealPercentageBasisPoints).toBe(3000);
  });

  test("withIdealPercentageBasisPoints can be set to null", () => {
    const categoryGroup = new TestCategoryGroupBuilder()
      .withIdealPercentageBasisPoints(null)
      .build();

    expect(categoryGroup.idealPercentageBasisPoints).toBeNull();
  });

  test("withSortOrder overrides the default", () => {
    const categoryGroup = new TestCategoryGroupBuilder()
      .withSortOrder(5)
      .build();

    expect(categoryGroup.sortOrder).toBe(5);
  });

  test("withSortOrder can be 0", () => {
    const categoryGroup = new TestCategoryGroupBuilder()
      .withSortOrder(0)
      .build();

    expect(categoryGroup.sortOrder).toBe(0);
  });

  test("withId overrides the default id", () => {
    const customId = testCategoryGroupId();
    const categoryGroup = new TestCategoryGroupBuilder()
      .withId(customId)
      .build();

    expect(categoryGroup.id).toBe(customId);
  });
});
