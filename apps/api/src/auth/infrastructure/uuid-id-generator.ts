import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { IdGenerator } from "@ledger-mx/application";

/**
 * UUID v4 generator using Node.js crypto module.
 */
@Injectable()
export class UuidIdGenerator implements IdGenerator {
  uuid(): string {
    return randomUUID();
  }
}
