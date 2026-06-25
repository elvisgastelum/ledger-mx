import {
  Controller,
  UnauthorizedException,
  ConflictException,
  Inject,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Req, Res } from "@nestjs/common";
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
import type { AuthRequestContext } from "@ledger-mx/application";
import { contract } from "@ledger-mx/contracts";
import { TsRestHandler, tsRestHandler } from "@ts-rest/nest";

export const REFRESH_COOKIE_NAME = "ledger_mx_refresh_token";

interface AuthResultResponse {
  accessToken: string;
  sessionId: string;
  user: {
    id: string;
    email: string;
    displayName?: string;
  };
}

@Controller()
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

    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

    res.cookie(cookieName, refreshToken, {
      httpOnly: true,
      secure,
      sameSite,
      path: "/api/v1/auth",
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
      path: "/api/v1/auth",
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
    const { accessToken, sessionId, user } = result;
    return {
      accessToken,
      sessionId,
      user: {
        ...user,
        displayName: user.displayName ?? undefined,
      },
    };
  }

  @TsRestHandler(contract.auth.register)
  async register(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    return tsRestHandler(contract.auth.register, async ({ body }) => {
      const context: AuthRequestContext = {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        deviceName: body.deviceName,
        rememberMe: body.rememberMe,
      };

      try {
        const result = await this.registerUserUseCase.execute({
          email: body.email,
          password: body.password,
          displayName: body.displayName,
          context,
        });

        this.setRefreshTokenCookie(res, result.refreshToken, body.rememberMe);
        return {
          status: 201 as const,
          body: this.stripRefreshToken(result),
        };
      } catch (error) {
        if (error instanceof DuplicateEmailError) {
          throw new ConflictException("Email already exists");
        }
        throw error;
      }
    });
  }

  @TsRestHandler(contract.auth.login)
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    return tsRestHandler(contract.auth.login, async ({ body }) => {
      const context: AuthRequestContext = {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        deviceName: body.deviceName,
        rememberMe: body.rememberMe,
      };

      try {
        const result = await this.loginUserUseCase.execute({
          email: body.email,
          password: body.password,
          context,
        });

        this.setRefreshTokenCookie(res, result.refreshToken, body.rememberMe);
        return {
          status: 200 as const,
          body: this.stripRefreshToken(result),
        };
      } catch (error) {
        if (error instanceof InvalidCredentialsError) {
          throw new UnauthorizedException("Invalid credentials");
        }
        throw error;
      }
    });
  }

  @TsRestHandler(contract.auth.refresh)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    return tsRestHandler(contract.auth.refresh, async () => {
      const refreshToken = this.getRefreshTokenFromRequest(req);

      if (!refreshToken) {
        throw new UnauthorizedException("Refresh token is required");
      }

      try {
        const result = await this.refreshTokenUseCase.execute({
          refreshToken,
        });

        this.setRefreshTokenCookie(res, result.refreshToken);
        return {
          status: 200 as const,
          body: this.stripRefreshToken(result),
        };
      } catch {
        throw new UnauthorizedException("Invalid or expired refresh token");
      }
    });
  }

  @TsRestHandler(contract.auth.logout)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    return tsRestHandler(contract.auth.logout, async () => {
      const refreshToken = this.getRefreshTokenFromRequest(req);

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

      return {
        status: 200 as const,
        body: { success: true },
      };
    });
  }
}
