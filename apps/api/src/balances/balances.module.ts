import {
  Module,
  DynamicModule,
  Provider,
  FactoryProvider,
} from "@nestjs/common";
import { JwtAccessModule } from "../auth/jwt-access.module";
import { ConfigModule } from "@nestjs/config";
import { BalancesController } from "./balances.controller";
import { BALANCES_TOKENS } from "./balances.tokens";
import type { BalanceRepository } from "@ledger-mx/domain";
import {
  GetAccountBalanceUseCase,
  GetAccountBalancesUseCase,
  GetBalancesByTypeUseCase,
  GetLiabilityBalancesUseCase,
  GetGeneralBalanceUseCase,
} from "@ledger-mx/application";
import { createDatabase, DrizzleBalanceRepository } from "@ledger-mx/database";

// Internal token for shared database connection
const BALANCES_DATABASE = Symbol("BALANCES_DATABASE");

export interface BalancesModuleOptions {
  balanceRepository?: Provider<BalanceRepository>;
}

function createDefaultDatabaseProvider(): FactoryProvider {
  return {
    provide: BALANCES_DATABASE,
    useFactory: () => createDatabase(),
  };
}

function createDefaultBalanceRepoProvider(): FactoryProvider {
  return {
    provide: BALANCES_TOKENS.BALANCE_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleBalanceRepository(db);
    },
    inject: [BALANCES_DATABASE],
  };
}

@Module({})
export class BalancesModule {
  static forRoot(options?: BalancesModuleOptions): DynamicModule {
    const balanceRepoProvider =
      options?.balanceRepository ?? createDefaultBalanceRepoProvider();

    // Only provide shared database if using default repo provider
    const needsDatabase = !options?.balanceRepository;

    return {
      module: BalancesModule,
      controllers: [BalancesController],
      imports: [ConfigModule, JwtAccessModule],
      providers: [
        balanceRepoProvider,
        ...(needsDatabase ? [createDefaultDatabaseProvider()] : []),
        // Use cases
        {
          provide: GetAccountBalanceUseCase,
          useFactory: (balanceRepository: BalanceRepository) => {
            return new GetAccountBalanceUseCase(balanceRepository);
          },
          inject: [BALANCES_TOKENS.BALANCE_REPOSITORY],
        },
        {
          provide: GetAccountBalancesUseCase,
          useFactory: (balanceRepository: BalanceRepository) => {
            return new GetAccountBalancesUseCase(balanceRepository);
          },
          inject: [BALANCES_TOKENS.BALANCE_REPOSITORY],
        },
        {
          provide: GetBalancesByTypeUseCase,
          useFactory: (balanceRepository: BalanceRepository) => {
            return new GetBalancesByTypeUseCase(balanceRepository);
          },
          inject: [BALANCES_TOKENS.BALANCE_REPOSITORY],
        },
        {
          provide: GetLiabilityBalancesUseCase,
          useFactory: (balanceRepository: BalanceRepository) => {
            return new GetLiabilityBalancesUseCase(balanceRepository);
          },
          inject: [BALANCES_TOKENS.BALANCE_REPOSITORY],
        },
        {
          provide: GetGeneralBalanceUseCase,
          useFactory: (balanceRepository: BalanceRepository) => {
            return new GetGeneralBalanceUseCase(balanceRepository);
          },
          inject: [BALANCES_TOKENS.BALANCE_REPOSITORY],
        },
      ],
      exports: [],
    };
  }
}
