import type { UserId } from "../value-objects/uuid";

/**
 * Auth user data shape for persistence and retrieval.
 */
export interface AuthUser {
  /** Unique user identifier */
  id: UserId;
  /** User's email address (unique) */
  email: string;
  /** Optional display name */
  displayName?: string | null;
  /** Hashed password (nullable for imported users or OAuth) */
  passwordHash?: string | null;
  /** When the user was created */
  createdAt: Date;
  /** When the user was last updated */
  updatedAt: Date;
  /** Soft delete timestamp (null if active) */
  deletedAt?: Date | null;
}

/**
 * Data for creating a new user (without timestamps and soft delete).
 */
export interface NewAuthUser {
  /** Unique user identifier */
  id: UserId;
  /** User's email address (unique) */
  email: string;
  /** Optional display name */
  displayName?: string | null;
  /** Hashed password (nullable for imported users or OAuth) */
  passwordHash?: string | null;
}

/**
 * Repository interface for persisting and retrieving auth users.
 * Framework-agnostic, no implementation details.
 */
export interface UserRepository {
  /**
   * Finds a user by their email address.
   * @param email - The email to search for
   * @returns The user or null if not found
   */
  findByEmail(email: string): Promise<AuthUser | null>;

  /**
   * Finds a user by their ID.
   * @param id - The user ID to search for
   * @returns The user or null if not found
   */
  findById(id: UserId): Promise<AuthUser | null>;

  /**
   * Saves a user (creates or updates).
   * @param user - The user data to save
   */
  save(user: NewAuthUser | AuthUser): Promise<void>;
}
