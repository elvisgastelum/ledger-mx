/**
 * Date formatting utilities for YYYY-MM-DD format.
 * Avoids timezone drift by using local year/month/day construction.
 */

/**
 * Parses a YYYY-MM-DD string to a Date object (local midnight).
 * Returns undefined if the input is invalid.
 */
export function parseDateInputValue(
  value: string | null | undefined,
): Date | undefined {
  if (!value || typeof value !== "string") return undefined;

  // Match YYYY-MM-DD format
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;

  const year = parseInt(match[1]!, 10);
  const month = parseInt(match[2]!, 10) - 1; // 0-indexed
  const day = parseInt(match[3]!, 10);

  const date = new Date(year, month, day);

  // Validate the date is real (handles overflow like 2024-02-30)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
}

/**
 * Formats a Date object to YYYY-MM-DD string (local time).
 * Returns empty string if date is invalid.
 */
export function formatDateInputValue(date: Date | undefined | null): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();

  // Zero-pad month and day
  const mm = month.toString().padStart(2, "0");
  const dd = day.toString().padStart(2, "0");

  return `${year}-${mm}-${dd}`;
}

/**
 * Returns today's date in YYYY-MM-DD format (local time).
 */
export function getTodayString(): string {
  return formatDateInputValue(new Date()) ?? "";
}

/**
 * Validates if a string is a valid YYYY-MM-DD date.
 */
export function isValidDateString(value: string | null | undefined): boolean {
  return parseDateInputValue(value) !== undefined;
}

/**
 * Converts a YYYY-MM-DD string to an ISO 8601 datetime string at local midnight.
 * Uses numeric constructor to avoid date-only UTC interpretation.
 * Assumes valid YYYY-MM-DD input; invalid input will produce Invalid Date.
 */
export function dateInputToISOString(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  // Month is 0-indexed in Date constructor
  const localMidnight = new Date(year, month - 1, day);
  return localMidnight.toISOString();
}
