import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { CategoryGroupsModule } from "./category-groups/category-groups.module";
import { CategoriesModule } from "./categories/categories.module";
import { AccountsModule } from "./accounts/accounts.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { BalancesModule } from "./balances/balances.module";
import { ExportModule } from "./export/export.module";
import { OnboardingModule } from "./onboarding/onboarding.module";
import { EnvelopesModule } from "./envelopes/envelopes.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    CategoryGroupsModule.forRoot(),
    CategoriesModule.forRoot(),
    AccountsModule.forRoot(),
    TransactionsModule.forRoot(),
    BalancesModule.forRoot(),
    ExportModule.forRoot(),
    OnboardingModule.forRoot(),
    EnvelopesModule.forRoot(),
  ],
})
export class AppModule {}
