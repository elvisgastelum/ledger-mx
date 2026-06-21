import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import type { PasswordHasher } from "@ledger-mx/application";

/**
 * Bcrypt implementation of PasswordHasher.
 */
@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  private readonly saltRounds: number;

  constructor() {
    this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? "10", 10);
  }

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
