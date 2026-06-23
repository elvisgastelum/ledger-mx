/**
 * Tests for auth-utils functions.
 */
import { describe, it, expect } from "vitest";
import { getSafeRedirect } from "./auth-utils";

describe("getSafeRedirect", () => {
  it("should return /onboarding for non-string input", () => {
    expect(getSafeRedirect(null)).toBe("/onboarding");
    expect(getSafeRedirect(undefined)).toBe("/onboarding");
    expect(getSafeRedirect(123)).toBe("/onboarding");
    expect(getSafeRedirect({})).toBe("/onboarding");
    expect(getSafeRedirect([])).toBe("/onboarding");
  });

  it("should return /onboarding for empty string", () => {
    expect(getSafeRedirect("")).toBe("/onboarding");
  });

  it("should return /onboarding for strings not starting with /", () => {
    expect(getSafeRedirect("http://evil.com")).toBe("/onboarding");
    expect(getSafeRedirect("https://evil.com")).toBe("/onboarding");
    expect(getSafeRedirect("javascript:alert(1)")).toBe("/onboarding");
    expect(getSafeRedirect("ftp://files.com")).toBe("/onboarding");
    expect(getSafeRedirect("relative/path")).toBe("/onboarding");
  });

  it("should return /onboarding for protocol-relative URLs (//)", () => {
    expect(getSafeRedirect("//evil.com")).toBe("/onboarding");
    expect(getSafeRedirect("//javascript:alert(1)")).toBe("/onboarding");
  });

  it("should return /onboarding for strings containing javascript: protocol", () => {
    expect(getSafeRedirect("/path/javascript:alert(1)")).toBe("/onboarding");
    expect(getSafeRedirect("/path?redirect=javascript:alert(1)")).toBe("/onboarding");
  });

  it("should return /onboarding for strings containing http: or https: protocols", () => {
    expect(getSafeRedirect("/path?redirect=http://evil.com")).toBe("/onboarding");
    expect(getSafeRedirect("/path?url=https://evil.com")).toBe("/onboarding");
  });

  it("should allow safe same-origin paths starting with /", () => {
    expect(getSafeRedirect("/")).toBe("/");
    expect(getSafeRedirect("/onboarding")).toBe("/onboarding");
    expect(getSafeRedirect("/login")).toBe("/login");
    expect(getSafeRedirect("/accounts")).toBe("/accounts");
    expect(getSafeRedirect("/transactions")).toBe("/transactions");
  });

  it("should allow paths with query strings that don't contain protocols", () => {
    expect(getSafeRedirect("/onboarding?step=1")).toBe("/onboarding?step=1");
    expect(getSafeRedirect("/accounts?id=123")).toBe("/accounts?id=123");
  });

  it("should allow paths with hash fragments", () => {
    expect(getSafeRedirect("/onboarding#section")).toBe("/onboarding#section");
  });

  it("should handle paths with special characters safely", () => {
    // These should be safe as they start with / and don't contain protocols
    expect(getSafeRedirect("/path-with-dashes")).toBe("/path-with-dashes");
    expect(getSafeRedirect("/path_with_underscores")).toBe("/path_with_underscores");
    expect(getSafeRedirect("/path/with/slashes")).toBe("/path/with/slashes");
  });
});
