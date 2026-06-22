import { describe, it, expect } from "vitest";
import { escapeCsvValue } from "./csv-utils";

describe("escapeCsvValue", () => {
  describe("null and undefined handling", () => {
    it("should return empty string for null", () => {
      expect(escapeCsvValue(null)).toBe("");
    });

    it("should return empty string for undefined", () => {
      expect(escapeCsvValue(undefined)).toBe("");
    });
  });

  describe("formula injection mitigation", () => {
    it("should prefix value starting with = with single quote", () => {
      expect(escapeCsvValue("=1+1")).toBe("'=1+1");
    });

    it("should prefix value starting with + with single quote", () => {
      expect(escapeCsvValue("+1+1")).toBe("'+1+1");
    });

    it("should prefix value starting with - with single quote", () => {
      expect(escapeCsvValue("-1+1")).toBe("'-1+1");
    });

    it("should prefix value starting with @ with single quote", () => {
      expect(escapeCsvValue("@SUM(A1:A10)")).toBe("'@SUM(A1:A10)");
    });

    it("should prefix value starting with tab with single quote", () => {
      expect(escapeCsvValue("\tHello")).toBe("'\tHello");
    });

    it("should prefix value starting with carriage return with single quote and wrap in quotes", () => {
      // \r triggers both formula injection prefix and quote wrapping
      // Result: "'\rHello" = DQ + SQ + CR + Hello + DQ (9 chars)
      const result = escapeCsvValue("\rHello");
      const expected = '"' + "'" + "\r" + "Hello" + '"';
      expect(result).toBe(expected);
    });
  });

  describe("double quote escaping", () => {
    it("should escape double quotes by doubling them", () => {
      expect(escapeCsvValue('He said "hello"')).toBe('"He said ""hello"""');
    });
  });

  describe("value wrapping", () => {
    it("should wrap value in quotes if it contains comma", () => {
      expect(escapeCsvValue("hello, world")).toBe('"hello, world"');
    });

    it("should wrap value in quotes if it contains newline", () => {
      expect(escapeCsvValue("hello\nworld")).toBe('"hello\nworld"');
    });

    it("should wrap value in quotes if it contains carriage return", () => {
      expect(escapeCsvValue("hello\rworld")).toBe('"hello\rworld"');
    });

    it("should wrap value in quotes if it contains double quote", () => {
      expect(escapeCsvValue('hello "world"')).toBe('"hello ""world"""');
    });
  });

  describe("normal values", () => {
    it("should return simple string unchanged", () => {
      expect(escapeCsvValue("hello")).toBe("hello");
    });

    it("should return numeric string unchanged", () => {
      expect(escapeCsvValue("123.45")).toBe("123.45");
    });
  });
});
