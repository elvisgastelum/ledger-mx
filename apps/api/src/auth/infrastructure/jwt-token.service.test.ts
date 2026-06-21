import { describe, it, expect, beforeEach, vi } from "vitest";
import { JwtTokenService } from "./jwt-token.service";
import type { AccessTokenPayload } from "@ledger-mx/application";
import type { UserId } from "@ledger-mx/domain";
import { JwtService } from "@nestjs/jwt";

describe("JwtTokenService", () => {
  let service: JwtTokenService;
  let mockSignAsync: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSignAsync = vi.fn().mockResolvedValue("mock-signed-token");
    const mockJwtService = {
      signAsync: mockSignAsync,
    };
    service = new JwtTokenService(mockJwtService as unknown as JwtService);
  });

  describe("signAccessToken", () => {
    it("should return a string token", async () => {
      const payload: AccessTokenPayload = {
        sub: "user-123" as UserId,
        email: "test@example.com",
      };

      const token = await service.signAccessToken(payload);
      expect(typeof token).toBe("string");
      expect(token).toBe("mock-signed-token");
    });

    it("should call signAsync with payload and expiresIn", async () => {
      const payload: AccessTokenPayload = {
        sub: "user-123" as UserId,
        email: "test@example.com",
        sessionId: "session-456",
      };

      await service.signAccessToken(payload);

      expect(mockSignAsync).toHaveBeenCalledWith(
        payload,
        expect.objectContaining({ expiresIn: expect.any(String) }),
      );
    });
  });

  describe("generateRefreshToken", () => {
    it("should return a base64url string", async () => {
      const token = await service.generateRefreshToken();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);

      // Should be valid base64url (no +, /, or = characters)
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("should generate unique tokens", async () => {
      const token1 = await service.generateRefreshToken();
      const token2 = await service.generateRefreshToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe("hashRefreshToken", () => {
    it("should return a deterministic hash", async () => {
      const token = "my-refresh-token";
      const hash1 = await service.hashRefreshToken(token);
      const hash2 = await service.hashRefreshToken(token);

      expect(hash1).toBe(hash2);
    });

    it("should return base64url hash", async () => {
      const token = "my-refresh-token";
      const hash = await service.hashRefreshToken(token);

      expect(typeof hash).toBe("string");
      expect(hash.length).toBeGreaterThan(0);
      // Should be valid base64url
      expect(hash).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("should produce different hashes for different tokens", async () => {
      const hash1 = await service.hashRefreshToken("token1");
      const hash2 = await service.hashRefreshToken("token2");

      expect(hash1).not.toBe(hash2);
    });

    it("should not contain the raw token", async () => {
      const token = "my-secret-token";
      const hash = await service.hashRefreshToken(token);

      expect(hash).not.toContain(token);
    });
  });
});
