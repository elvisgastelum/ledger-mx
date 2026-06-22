import { Module } from "@nestjs/common";
import { JwtModule, JwtModuleOptions } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const jwtSecret = configService.get<string>("JWT_SECRET");

        if (!jwtSecret) {
          throw new Error("JWT_SECRET environment variable is required");
        }

        return {
          secret: jwtSecret,
        };
      },
    }),
  ],
  exports: [JwtModule],
})
export class JwtAccessModule {}
