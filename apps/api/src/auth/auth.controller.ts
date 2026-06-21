import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  ConflictException,
  Inject,
} from "@nestjs/common";
import type { Request } from "express";
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

interface RegisterDto {
  email: string;
  password: string;
  displayName?: string;
  deviceName?: string;
  rememberMe?: boolean;
}

interface LoginDto {
  email: string;
  password: string;
  deviceName?: string;
  rememberMe?: boolean;
}

interface RefreshDto {
  refreshToken: string;
}

interface LogoutDto {
  refreshToken: string;
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
  ) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
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

      return result;
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        throw new ConflictException("Email already exists");
      }
      throw error;
    }
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
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

      return result;
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException("Invalid credentials");
      }
      throw error;
    }
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    try {
      const result = await this.refreshTokenUseCase.execute({
        refreshToken: dto.refreshToken,
      });

      return result;
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: LogoutDto) {
    try {
      await this.logoutUseCase.execute({
        refreshToken: dto.refreshToken,
      });
    } catch {
      // Always return success for logout
    }

    return { success: true };
  }
}
