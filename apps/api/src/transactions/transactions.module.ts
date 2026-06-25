import {
  Module,
  DynamicModule,
  Provider,
  FactoryProvider,
} from "@nestjs/common";
import { JwtAccessModule } from "../auth/jwt-access.module";
import { ConfigModule } from "@nestjs/config";
import { TransactionsController } from "./transactions.controller";
import { TRANSACTIONS_TOKENS } from "./transactions.tokens";
import type { TransactionRepository } from "@ledger-mx/domain";
import {
  CreateTransactionUseCase,
  ListTransactionsUseCase,
  CreateReversalUseCase,
  CreateCorrectionUseCase,
} from "@ledger-mx/application";
import {
  createDatabase,
  DrizzleTransactionRepository,
} from "@ledger-mx/database";

// Internal token for shared database connection
const TRANSACTIONS_DATABASE = Symbol("TRANSACTIONS_DATABASE");

export interface TransactionsModuleOptions {
  transactionRepository?: Provider<TransactionRepository>;
}

function createDefaultDatabaseProvider(): FactoryProvider {
  return {
    provide: TRANSACTIONS_DATABASE,
    useFactory: () => createDatabase(),
  };
}

function createDefaultTransactionRepoProvider(): FactoryProvider {
  return {
    provide: TRANSACTIONS_TOKENS.TRANSACTION_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleTransactionRepository(db);
    },
    inject: [TRANSACTIONS_DATABASE],
  };
}

@Module({})
export class TransactionsModule {
  static forRoot(options?: TransactionsModuleOptions): DynamicModule {
    const transactionRepoProvider =
      options?.transactionRepository ?? createDefaultTransactionRepoProvider();

    // Only provide shared database if using default repo provider
    const needsDatabase = !options?.transactionRepository;

    return {
      module: TransactionsModule,
      controllers: [TransactionsController],
      imports: [ConfigModule, JwtAccessModule],
      providers: [
        transactionRepoProvider,
        ...(needsDatabase ? [createDefaultDatabaseProvider()] : []),
        // Use cases
        {
          provide: CreateTransactionUseCase,
          useFactory: (transactionRepository: TransactionRepository) => {
            return new CreateTransactionUseCase(transactionRepository);
          },
          inject: [TRANSACTIONS_TOKENS.TRANSACTION_REPOSITORY],
        },
        {
          provide: ListTransactionsUseCase,
          useFactory: (transactionRepository: TransactionRepository) => {
            return new ListTransactionsUseCase(transactionRepository);
          },
          inject: [TRANSACTIONS_TOKENS.TRANSACTION_REPOSITORY],
        },
        {
          provide: CreateReversalUseCase,
          useFactory: (transactionRepository: TransactionRepository) => {
            return new CreateReversalUseCase(transactionRepository);
          },
          inject: [TRANSACTIONS_TOKENS.TRANSACTION_REPOSITORY],
        },
        // Correction use case: application-level foundation (no API endpoint yet)
        // TODO: Add POST /transactions/:id/correct endpoint in future MVP iteration
        {
          provide: CreateCorrectionUseCase,
          useFactory: (transactionRepository: TransactionRepository) => {
            return new CreateCorrectionUseCase(transactionRepository);
          },
          inject: [TRANSACTIONS_TOKENS.TRANSACTION_REPOSITORY],
        },
      ],
      exports: [],
    };
  }
}
