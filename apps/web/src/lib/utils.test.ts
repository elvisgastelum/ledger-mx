/**
 * Unit tests for utils.ts
 * Tests the cn() function for class merging.
 */
import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("should merge class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("should merge tailwind classes correctly", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("should handle undefined and null values", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });

  it("should handle empty strings", () => {
    expect(cn("", "foo", "")).toBe("foo");
  });

  it("should handle array of classes", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("should handle object with conditional classes", () => {
    expect(cn("foo", { bar: true, baz: false })).toBe("foo bar");
  });
});
