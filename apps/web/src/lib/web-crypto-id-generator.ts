/**
 * Web Crypto API implementation of IdGenerator.
 * Uses globalThis.crypto.randomUUID() for UUID v4 generation.
 */

export interface IdGenerator {
  uuid(): string;
}

export class WebCryptoIdGenerator implements IdGenerator {
  uuid(): string {
    return globalThis.crypto.randomUUID();
  }
}
