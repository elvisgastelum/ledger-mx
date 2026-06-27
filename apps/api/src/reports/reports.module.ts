import {
  Module,
  DynamicModule,
  Provider,
  FactoryProvider,
} from "@nestjs/common";
import { JwtAccessModule } from "../auth/jwt-access.module";
import { ConfigModule } from "@nestjs/config";
import { ReportsController } from "./reports.controller";
import { REPORTS_TOKENS } from "./reports.tokens";
import type {
  TransactionRepository,
  AccountRepository,
  CategoryRepository,
  CategoryGroupRepository,
} from "@ledger-mx/domain";
import {
  GetSpendableBalanceUseCase,
  GetExpensesByCategoryUseCase,
  GetDebtProgressUseCase,
} from "@ledger-mx/application";
import {
  createDatabase,
  DrizzleTransactionRepository,
  DrizzleAccountRepository,
  DrizzleCategoryRepository,
  DrizzleCategoryGroupRepository,
} from "@ledger-mx/database";

// Internal token for shared database connection
const REPORTS_DATABASE = Symbol("REPORTS_DATABASE");

export interface ReportsModuleOptions {
  transactionRepository?: Provider<TransactionRepository>;
  accountRepository?: Provider<AccountRepository>;
  categoryRepository?: Provider<CategoryRepository>;
  categoryGroupRepository?: Provider<CategoryGroupRepository>;
}

function createDefaultDatabaseProvider(): FactoryProvider {
  return {
    provide: REPORTS_DATABASE,
    useFactory: () => createDatabase(),
  };
}

function createDefaultTransactionRepoProvider(): FactoryProvider {
  return {
    provide: REPORTS_TOKENS.TRANSACTION_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleTransactionRepository(db);
    },
    inject: [REPORTS_DATABASE],
  };
}

function createDefaultAccountRepoProvider(): FactoryProvider {
  return {
    provide: REPORTS_TOKENS.ACCOUNT_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleAccountRepository(db);
    },
    inject: [REPORTS_DATABASE],
  };
}

function createDefaultCategoryRepoProvider(): FactoryProvider {
  return {
    provide: REPORTS_TOKENS.CATEGORY_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleCategoryRepository(db);
    },
    inject: [REPORTS_DATABASE],
  };
}

function createDefaultCategoryGroupRepoProvider(): FactoryProvider {
  return {
    provide: REPORTS_TOKENS.CATEGORY_GROUP_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleCategoryGroupRepository(db);
    },
    inject: [REPORTS_DATABASE],
  };
}

@Module({})
export class ReportsModule {
  static forRoot(options?: ReportsModuleOptions): DynamicModule {
    const transactionRepoProvider =
      options?.transactionRepository ?? createDefaultTransactionRepoProvider();

    const accountRepoProvider =
      options?.accountRepository ?? createDefaultAccountRepoProvider();

    const categoryRepoProvider =
      options?.categoryRepository ?? createDefaultCategoryRepoProvider();

    const categoryGroupRepoProvider =
      options?.categoryGroupRepository ??
      createDefaultCategoryGroupRepoProvider();

    // Only provide shared database if using default repo providers
    const needsDatabase =
      !options?.transactionRepository &&
      !options?.accountRepository &&
      !options?.categoryRepository &&
      !options?.categoryGroupRepository;

    return {
      module: ReportsModule,
      controllers: [ReportsController],
      imports: [ConfigModule, JwtAccessModule],
      providers: [
        transactionRepoProvider,
        accountRepoProvider,
        categoryRepoProvider,
        categoryGroupRepoProvider,
        ...(needsDatabase ? [createDefaultDatabaseProvider()] : []),
        // Use cases
        {
          provide: GetSpendableBalanceUseCase,
          useFactory: (
            transactionRepository: TransactionRepository,
            accountRepository: AccountRepository,
          ) => {
            return new GetSpendableBalanceUseCase(
              transactionRepository,
              accountRepository,
            );
          },
          inject: [
            REPORTS_TOKENS.TRANSACTION_REPOSITORY,
            REPORTS_TOKENS.ACCOUNT_REPOSITORY,
          ],
        },
        {
          provide: GetExpensesByCategoryUseCase,
          useFactory: (
            transactionRepository: TransactionRepository,
            categoryRepository: CategoryRepository,
            categoryGroupRepository: CategoryGroupRepository,
          ) => {
            return new GetExpensesByCategoryUseCase(
              transactionRepository,
              categoryRepository,
              categoryGroupRepository,
            );
          },
          inject: [
            REPORTS_TOKENS.TRANSACTION_REPOSITORY,
            REPORTS_TOKENS.CATEGORY_REPOSITORY,
            REPORTS_TOKENS.CATEGORY_GROUP_REPOSITORY,
          ],
        },
        {
          provide: GetDebtProgressUseCase,
          useFactory: (
            transactionRepository: TransactionRepository,
            accountRepository: AccountRepository,
          ) => {
            return new GetDebtProgressUseCase(
              transactionRepository,
              accountRepository,
            );
          },
          inject: [
            REPORTS_TOKENS.TRANSACTION_REPOSITORY,
            REPORTS_TOKENS.ACCOUNT_REPOSITORY,
          ],
        },
      ],
      exports: [],
    };
  }
}
