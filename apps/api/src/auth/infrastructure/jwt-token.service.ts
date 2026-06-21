import { Injectable, Inject } from "@nestjs/common";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import type { AccessTokenPayload, TokenService } from "@ledger-mx/application";
import { randomBytes, createHash } from "node:crypto";

/**
 * JWT and refresh token implementation of TokenService.
 * Uses @nestjs/jwt for access tokens and crypto for refresh tokens.
 */
@Injectable()
export class JwtTokenService implements TokenService {
  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    const expiresIn = (process.env.JWT_ACCESS_TOKEN_TTL ??
      "15m") as JwtSignOptions["expiresIn"];
    return this.jwtService.signAsync(payload, { expiresIn });
  }

  async generateRefreshToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      // 32 bytes = 256 bits of entropy
      randomBytes(32, (err, buf) => {
        if (err) {
          reject(err);
        } else {
          resolve(buf.toString("base64url"));
        }
      });
    });
  }

  async hashRefreshToken(token: string): Promise<string> {
    // Use SHA-256 hash for refresh token storage
    return createHash("sha256").update(token).digest("base64url");
  }
}
