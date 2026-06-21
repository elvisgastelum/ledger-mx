import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { userIdFromString } from "@ledger-mx/domain";

interface JwtAuthRequest extends Request {
  user?: {
    sub: string;
    email?: string;
    [key: string]: unknown;
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<JwtAuthRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException("Authorization header is required");
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw new UnauthorizedException("Invalid authorization header format");
    }

    const token = parts[1];
    if (!token) {
      throw new UnauthorizedException("Token is required");
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      if (!payload || typeof payload.sub !== "string") {
        throw new UnauthorizedException("Invalid token payload");
      }

      // Validate that sub is a valid UUID v4
      try {
        userIdFromString(payload.sub);
      } catch {
        throw new UnauthorizedException("Invalid user ID in token");
      }

      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
