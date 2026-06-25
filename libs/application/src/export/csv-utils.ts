/**
 * Escapes a value for safe CSV output.
 *
 * @param value - The value to escape (string, null, or undefined)
 * @returns The escaped CSV string
 *
 * @example
 * escapeCsvValue("hello") // "hello"
 * escapeCsvValue("hello, world") // "\"hello, world\""
 * escapeCsvValue(null) // ""
 * escapeCsvValue(undefined) // ""
 */
export function escapeCsvValue(value: string | null | undefined): string {
  // Handle null/undefined
  if (value == null) {
    return "";
  }

  let escaped = value;

  // Mitigate spreadsheet formula injection
  // Prefix with single quote if value starts with =, +, -, @, tab, or carriage return
  if (/^[=+\-@\t\r]/.test(escaped)) {
    escaped = `'${escaped}`;
  }

  // Escape double quotes by doubling them
  if (escaped.includes('"')) {
    escaped = escaped.replace(/"/g, '""');
  }

  // Wrap in double quotes if contains comma, double quote, newline, or carriage return
  if (/[,"\n\r]/.test(escaped)) {
    escaped = `"${escaped}"`;
  }

  return escaped;
}
