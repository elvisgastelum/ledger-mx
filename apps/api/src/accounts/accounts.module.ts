import {
  Module,
  DynamicModule,
  Provider,
  FactoryProvider,
} from "@nestjs/common";
import { JwtAccessModule } from "../auth/jwt-access.module";
import { ConfigModule } from "@nestjs/config";
import { AccountsController } from "./accounts.controller";
import { ACCOUNTS_TOKENS } from "./accounts.tokens";
import type { AccountRepository, BalanceRepository } from "@ledger-mx/domain";
import {
  CreateAccountUseCase,
  ListAccountsUseCase,
  UpdateAccountUseCase,
  ArchiveAccountUseCase,
  EnsureSystemAccountsUseCase,
  GetAccountBalancesUseCase,
} from "@ledger-mx/application";
import { UuidIdGenerator } from "../auth/infrastructure/uuid-id-generator";
import { SystemClock } from "@ledger-mx/application";
import {
  createDatabase,
  DrizzleAccountRepository,
  DrizzleBalanceRepository,
} from "@ledger-mx/database";

// Internal token for shared database connection
const ACCOUNTS_DATABASE = Symbol("ACCOUNTS_DATABASE");

export interface AccountsModuleOptions {
  accountRepository?: Provider<AccountRepository>;
}

function createDefaultDatabaseProvider(): FactoryProvider {
  return {
    provide: ACCOUNTS_DATABASE,
    useFactory: () => createDatabase(),
  };
}

function createDefaultAccountRepoProvider(): FactoryProvider {
  return {
    provide: ACCOUNTS_TOKENS.ACCOUNT_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleAccountRepository(db);
    },
    inject: [ACCOUNTS_DATABASE],
  };
}

function createDefaultBalanceRepoProvider(): FactoryProvider {
  return {
    provide: ACCOUNTS_TOKENS.BALANCE_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleBalanceRepository(db);
    },
    inject: [ACCOUNTS_DATABASE],
  };
}

@Module({})
export class AccountsModule {
  static forRoot(options?: AccountsModuleOptions): DynamicModule {
    const accountRepoProvider =
      options?.accountRepository ?? createDefaultAccountRepoProvider();

    // Only provide shared database if using default repo provider
    const needsDatabase = !options?.accountRepository;

    const balanceRepoProvider = createDefaultBalanceRepoProvider();

    return {
      module: AccountsModule,
      controllers: [AccountsController],
      imports: [ConfigModule, JwtAccessModule],
      providers: [
        accountRepoProvider,
        balanceRepoProvider,
        ...(needsDatabase ? [createDefaultDatabaseProvider()] : []),
        // Infrastructure services
        {
          provide: UuidIdGenerator,
          useClass: UuidIdGenerator,
        },
        {
          provide: SystemClock,
          useClass: SystemClock,
        },
        // Use cases
        {
          provide: CreateAccountUseCase,
          useFactory: (
            accountRepository: AccountRepository,
            idGenerator: UuidIdGenerator,
            clock: SystemClock,
          ) => {
            return new CreateAccountUseCase(
              accountRepository,
              idGenerator,
              clock,
            );
          },
          inject: [
            ACCOUNTS_TOKENS.ACCOUNT_REPOSITORY,
            UuidIdGenerator,
            SystemClock,
          ],
        },
        {
          provide: EnsureSystemAccountsUseCase,
          useFactory: (
            accountRepository: AccountRepository,
            idGenerator: UuidIdGenerator,
            clock: SystemClock,
          ) => {
            return new EnsureSystemAccountsUseCase(
              accountRepository,
              idGenerator,
              clock,
            );
          },
          inject: [
            ACCOUNTS_TOKENS.ACCOUNT_REPOSITORY,
            UuidIdGenerator,
            SystemClock,
          ],
        },
        {
          provide: ListAccountsUseCase,
          useFactory: (accountRepository: AccountRepository) => {
            return new ListAccountsUseCase(accountRepository);
          },
          inject: [ACCOUNTS_TOKENS.ACCOUNT_REPOSITORY],
        },
        {
          provide: UpdateAccountUseCase,
          useFactory: (
            accountRepository: AccountRepository,
            clock: SystemClock,
          ) => {
            return new UpdateAccountUseCase(accountRepository, clock);
          },
          inject: [ACCOUNTS_TOKENS.ACCOUNT_REPOSITORY, SystemClock],
        },
        {
          provide: ArchiveAccountUseCase,
          useFactory: (
            accountRepository: AccountRepository,
            clock: SystemClock,
          ) => {
            return new ArchiveAccountUseCase(accountRepository, clock);
          },
          inject: [ACCOUNTS_TOKENS.ACCOUNT_REPOSITORY, SystemClock],
        },
        // Balance use cases
        {
          provide: GetAccountBalancesUseCase,
          useFactory: (balanceRepository: BalanceRepository) => {
            return new GetAccountBalancesUseCase(balanceRepository);
          },
          inject: [ACCOUNTS_TOKENS.BALANCE_REPOSITORY],
        },
      ],
      exports: [],
    };
  }
}
