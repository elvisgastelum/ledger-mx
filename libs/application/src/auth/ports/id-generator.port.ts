/**
 * Port for generating unique identifiers.
 * Infrastructure will implement this (e.g., using crypto.randomUUID).
 */
export interface IdGenerator {
  /**
   * Generates a UUID string.
   * @returns A UUID v4 string
   */
  uuid(): string;
}
