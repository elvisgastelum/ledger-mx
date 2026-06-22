import { Injectable } from "@nestjs/common";
import { NodeCryptoIdGenerator } from "@ledger-mx/infrastructure";
import type { IdGenerator } from "@ledger-mx/application";

/**
 * UUID v4 generator using Node.js crypto module.
 * NestJS injectable wrapper around the framework-agnostic NodeCryptoIdGenerator.
 */
@Injectable()
export class UuidIdGenerator
  extends NodeCryptoIdGenerator
  implements IdGenerator {}
