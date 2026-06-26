import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { resolve } from "node:path";
import { AuthModule } from "./auth/auth.module";
import { CategoryGroupsModule } from "./category-groups/category-groups.module";
import { CategoriesModule } from "./categories/categories.module";
import { AccountsModule } from "./accounts/accounts.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { BalancesModule } from "./balances/balances.module";
import { OnboardingModule } from "./onboarding/onboarding.module";
import { ExportModule } from "./export/export.module";
import { validateEnv } from "./config/env.validation";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(process.cwd(), "../..", ".env.local"),
        resolve(process.cwd(), "../..", ".env"),
      ],
      validate: validateEnv,
    }),
    AuthModule.forRoot(),
    CategoryGroupsModule.forRoot(),
    CategoriesModule.forRoot(),
    AccountsModule.forRoot(),
    TransactionsModule.forRoot(),
    BalancesModule.forRoot(),
    OnboardingModule.forRoot(),
    ExportModule.forRoot(),
  ],
})
export class AppModule {}
