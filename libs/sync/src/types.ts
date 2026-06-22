/**
 * Sync Engine Types
 *
 * Aligned with docs/mvp/sync/offline-retry.md and docs/mvp/sync/conflicts.md
 */

/**
 * Write operation types for sync queue
 */
export type QueuedWriteType = "INSERT" | "UPDATE" | "DELETE";

/**
 * Status of a queued write
 */
export type QueuedWriteStatus = "pending" | "synced" | "error";

/**
 * Conflict resolution choices (user-driven, never auto-delete)
 */
export type ConflictResolutionChoice =
  | "keep-a"
  | "keep-b"
  | "keep-both"
  | "merge";

/**
 * A write that has been queued for sync (offline or retry)
 */
export interface QueuedWrite {
  id: string;
  type: QueuedWriteType;
  table: string;
  data: Record<string, unknown>;
  status: QueuedWriteStatus;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  lastError?: string;
  createdAt: Date;
}

/**
 * Conflict record when same transaction edited on multiple devices
 */
export interface SyncConflict {
  id: string;
  tableName: string;
  recordId: string;
  versionA: Record<string, unknown>;
  versionB: Record<string, unknown>;
  resolution?: ConflictResolutionChoice;
  resolvedAt?: Date;
  resolvedBy?: string;
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean;
  syncedWrites: string[];
  failedWrites: string[];
  conflicts: SyncConflict[];
  errors: string[];
}

/**
 * Sync queue statistics
 */
export interface SyncQueueStats {
  pending: number;
  synced: number;
  error: number;
  total: number;
}

/**
 * Configuration for sync behavior
 */
export interface SyncConfig {
  maxRetryAttempts: number;
  baseBackoffMs: number;
  maxBackoffMs: number;
  enabled: boolean;
}

/**
 * Default sync configuration
 */
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  maxRetryAttempts: 7,
  baseBackoffMs: 1000,
  maxBackoffMs: 300000, // 5 minutes
  enabled: true,
};
