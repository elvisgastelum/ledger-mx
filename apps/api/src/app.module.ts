import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { CategoryGroupsModule } from "./category-groups/category-groups.module";
import { OnboardingModule } from "./onboarding/onboarding.module";
import { ExportModule } from "./export/export.module";
import { validateEnv } from "./config/env.validation";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
      validate: validateEnv,
    }),
    AuthModule.forRoot(),
    CategoryGroupsModule.forRoot(),
    OnboardingModule.forRoot(),
    ExportModule.forRoot(),
  ],
})
export class AppModule {}
