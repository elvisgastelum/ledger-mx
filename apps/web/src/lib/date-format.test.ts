/**
 * Tests for date-format utilities.
 */
import {
  parseDateInputValue,
  formatDateInputValue,
  getTodayString,
  isValidDateString,
  dateInputToISOString,
} from "./date-format";

describe("date-format", () => {
  describe("parseDateInputValue", () => {
    it("should parse valid YYYY-MM-DD string", () => {
      const result = parseDateInputValue("2024-06-15");
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(5); // 0-indexed
      expect(result?.getDate()).toBe(15);
    });

    it("should return undefined for invalid date string", () => {
      expect(parseDateInputValue("2024-13-01")).toBeUndefined(); // Invalid month
      expect(parseDateInputValue("2024-02-30")).toBeUndefined(); // Invalid day
      expect(parseDateInputValue("invalid")).toBeUndefined();
      expect(parseDateInputValue("")).toBeUndefined();
    });

    it("should return undefined for null/undefined", () => {
      expect(parseDateInputValue(null)).toBeUndefined();
      expect(parseDateInputValue(undefined)).toBeUndefined();
    });

    it("should handle single digit month/day with zero padding", () => {
      const result = parseDateInputValue("2024-01-05");
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(5);
    });
  });

  describe("formatDateInputValue", () => {
    it("should format Date to YYYY-MM-DD string", () => {
      const date = new Date(2024, 5, 15); // June 15, 2024
      expect(formatDateInputValue(date)).toBe("2024-06-15");
    });

    it("should zero-pad month and day", () => {
      const date = new Date(2024, 0, 5); // January 5, 2024
      expect(formatDateInputValue(date)).toBe("2024-01-05");
    });

    it("should return empty string for invalid date", () => {
      expect(formatDateInputValue(undefined)).toBe("");
      expect(formatDateInputValue(null)).toBe("");
    });

    it("should handle Date with time component", () => {
      const date = new Date("2024-06-15T14:30:00");
      expect(formatDateInputValue(date)).toBe("2024-06-15");
    });
  });

  describe("getTodayString", () => {
    it("should return today's date in YYYY-MM-DD format", () => {
      const result = getTodayString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Verify it matches today's date
      const today = new Date();
      const expected = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
      expect(result).toBe(expected);
    });
  });

  describe("isValidDateString", () => {
    it("should return true for valid date strings", () => {
      expect(isValidDateString("2024-06-15")).toBe(true);
      expect(isValidDateString("2000-02-29")).toBe(true); // Leap year
    });

    it("should return false for invalid date strings", () => {
      expect(isValidDateString("2024-13-01")).toBe(false);
      expect(isValidDateString("2024-02-30")).toBe(false);
      expect(isValidDateString("invalid")).toBe(false);
      expect(isValidDateString("")).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(isValidDateString(null)).toBe(false);
      expect(isValidDateString(undefined)).toBe(false);
    });
  });

  describe("dateInputToISOString", () => {
    it("should convert YYYY-MM-DD to ISO string at local midnight", () => {
      const result = dateInputToISOString("2024-06-15");
      const expected = new Date(2024, 5, 15).toISOString();
      expect(result).toBe(expected);
    });

    it("should handle single digit month/day", () => {
      const result = dateInputToISOString("2024-01-05");
      const expected = new Date(2024, 0, 5).toISOString();
      expect(result).toBe(expected);
    });

    it("should throw RangeError for empty string", () => {
      expect(() => dateInputToISOString("")).toThrow(RangeError);
    });
  });
});
