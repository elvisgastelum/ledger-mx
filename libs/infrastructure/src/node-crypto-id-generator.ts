import { randomUUID } from "node:crypto";
import type { IdGenerator } from "@ledger-mx/application";

/**
 * Node.js crypto-based UUID v4 generator.
 * Framework-agnostic implementation of the IdGenerator port.
 */
export class NodeCryptoIdGenerator implements IdGenerator {
  uuid(): string {
    return randomUUID();
  }
}
