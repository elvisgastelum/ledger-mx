/**
 * Port for hashing and comparing passwords.
 * Infrastructure will implement this (e.g., using bcrypt).
 */
export interface PasswordHasher {
  /**
   * Hashes a plain text password.
   * @param password - The plain text password
   * @returns The hashed password
   */
  hash(password: string): Promise<string>;

  /**
   * Compares a plain text password with a hash.
   * @param plain - The plain text password
   * @param hash - The hashed password
   * @returns true if the password matches
   */
  compare(plain: string, hash: string): Promise<boolean>;
}
