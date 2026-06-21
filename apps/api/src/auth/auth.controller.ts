import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  ConflictException,
  Inject,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { ConfigService } from "@nestjs/config";
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  RefreshTokenUseCase,
  LogoutUseCase,
} from "@ledger-mx/application";
import {
  InvalidCredentialsError,
  DuplicateEmailError,
} from "@ledger-mx/domain";
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  RefreshTokenRequestSchema,
  LogoutRequestSchema,
} from "@ledger-mx/contracts";
import type { AuthRequestContext } from "@ledger-mx/application";
import { createZodDto, ZodValidationPipe } from "nestjs-zod";

export const REFRESH_COOKIE_NAME = "ledger_mx_refresh_token";

// Auth routes use explicit ZodValidationPipe on each @Body parameter to avoid
// metadata inference issues that can occur with global validation pipes.
export class RegisterDto extends createZodDto(RegisterRequestSchema) {}

export class LoginDto extends createZodDto(LoginRequestSchema) {}

export class RefreshDto extends createZodDto(RefreshTokenRequestSchema) {}

export class LogoutDto extends createZodDto(LogoutRequestSchema) {}



interface AuthResultResponse {
  accessToken: string;
  sessionId: string;
  user: {
    id: string;
    email: string;
    displayName?: string;
  };
}

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(RegisterUserUseCase)
    private readonly registerUserUseCase: RegisterUserUseCase,
    @Inject(LoginUserUseCase)
    private readonly loginUserUseCase: LoginUserUseCase,
    @Inject(RefreshTokenUseCase)
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    @Inject(LogoutUseCase)
    private readonly logoutUseCase: LogoutUseCase,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {}

  private setRefreshTokenCookie(
    res: Response,
    refreshToken: string,
    rememberMe?: boolean,
  ): void {
    const isProduction = this.configService.get<string>("NODE_ENV") === "production";
    const cookieName =
      this.configService.get<string>("AUTH_REFRESH_COOKIE_NAME") ?? REFRESH_COOKIE_NAME;
    const secure = this.configService.get<boolean>("AUTH_REFRESH_COOKIE_SECURE") ?? isProduction;
    const sameSite =
      (this.configService.get<string>("AUTH_REFRESH_COOKIE_SAME_SITE") as "strict" | "lax" | "none") ?? "lax";

    // Default refresh token expiry: 7 days (no rememberMe) or 30 days (rememberMe)
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

    res.cookie(cookieName, refreshToken, {
      httpOnly: true,
      secure,
      sameSite,
      path: "/auth",
      maxAge,
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    const cookieName =
      this.configService.get<string>("AUTH_REFRESH_COOKIE_NAME") ?? REFRESH_COOKIE_NAME;
    const isProduction = this.configService.get<string>("NODE_ENV") === "production";
    const secure = this.configService.get<boolean>("AUTH_REFRESH_COOKIE_SECURE") ?? isProduction;
    const sameSite =
      (this.configService.get<string>("AUTH_REFRESH_COOKIE_SAME_SITE") as "strict" | "lax" | "none") ?? "lax";

    res.cookie(cookieName, "", {
      httpOnly: true,
      secure,
      sameSite,
      path: "/auth",
      maxAge: 0,
    });
  }

  private getRefreshTokenFromRequest(req: Request): string | undefined {
    const cookieName =
      this.configService.get<string>("AUTH_REFRESH_COOKIE_NAME") ?? REFRESH_COOKIE_NAME;
    return req.cookies?.[cookieName];
  }

  private stripRefreshToken(result: {
    accessToken: string;
    refreshToken: string;
    sessionId: string;
    user: { id: string; email: string; displayName?: string | null };
  }): AuthResultResponse {
    const { refreshToken: _refreshToken, ...rest } = result;
    // Map displayName null to undefined for TypeScript compatibility
    if (rest.user) {
      rest.user = {
        ...rest.user,
        displayName: rest.user.displayName ?? undefined,
      };
    }
    return rest as AuthResultResponse;
  }

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ZodValidationPipe(RegisterDto)) dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const context: AuthRequestContext = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      deviceName: dto.deviceName,
      rememberMe: dto.rememberMe,
    };

    try {
      const result = await this.registerUserUseCase.execute({
        email: dto.email,
        password: dto.password,
        displayName: dto.displayName,
        context,
      });

      this.setRefreshTokenCookie(res, result.refreshToken, dto.rememberMe);
      return this.stripRefreshToken(result);
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        throw new ConflictException("Email already exists");
      }
      throw error;
    }
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(LoginDto)) dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const context: AuthRequestContext = {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      deviceName: dto.deviceName,
      rememberMe: dto.rememberMe,
    };

    try {
      const result = await this.loginUserUseCase.execute({
        email: dto.email,
        password: dto.password,
        context,
      });

      this.setRefreshTokenCookie(res, result.refreshToken, dto.rememberMe);
      return this.stripRefreshToken(result);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException("Invalid credentials");
      }
      throw error;
    }
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body(new ZodValidationPipe(RefreshTokenRequestSchema.optional().default({}))) dto: RefreshDto | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Read refresh token from cookie first, then fallback to body for backwards compatibility
    const refreshToken = this.getRefreshTokenFromRequest(req) ?? dto?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token is required");
    }

    try {
      const result = await this.refreshTokenUseCase.execute({
        refreshToken,
      });

      this.setRefreshTokenCookie(res, result.refreshToken);
      return this.stripRefreshToken(result);
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body(new ZodValidationPipe(LogoutRequestSchema.optional().default({}))) dto: LogoutDto | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
      // Read refresh token from cookie first, then fallback to body for backwards compatibility
    const refreshToken = this.getRefreshTokenFromRequest(req) ?? dto?.refreshToken;

    // Always clear the cookie regardless of whether logout succeeds
    this.clearRefreshTokenCookie(res);

    if (refreshToken) {
      try {
        await this.logoutUseCase.execute({
          refreshToken,
        });
      } catch {
        // Always return success for logout
      }
    }

    return { success: true };
  }
}
