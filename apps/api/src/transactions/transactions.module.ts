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
import type {
  TransactionRepository,
  CategoryRepository,
  AccountRepository,
  EnvelopeRepository,
} from "@ledger-mx/domain";
import {
  CreateTransactionUseCase,
  ListTransactionsUseCase,
  CreateReversalUseCase,
  CreateCorrectionUseCase,
} from "@ledger-mx/application";
import {
  createDatabase,
  DrizzleTransactionRepository,
  DrizzleCategoryRepository,
  DrizzleAccountRepository,
  DrizzleEnvelopeRepository,
} from "@ledger-mx/database";

// Internal token for shared database connection
const TRANSACTIONS_DATABASE = Symbol("TRANSACTIONS_DATABASE");

export interface TransactionsModuleOptions {
  transactionRepository?: Provider<TransactionRepository>;
  categoryRepository?: Provider<CategoryRepository>;
  accountRepository?: Provider<AccountRepository>;
  envelopeRepository?: Provider<EnvelopeRepository>;
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

function createDefaultCategoryRepoProvider(): FactoryProvider {
  return {
    provide: TRANSACTIONS_TOKENS.CATEGORY_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleCategoryRepository(db);
    },
    inject: [TRANSACTIONS_DATABASE],
  };
}

function createDefaultAccountRepoProvider(): FactoryProvider {
  return {
    provide: TRANSACTIONS_TOKENS.ACCOUNT_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleAccountRepository(db);
    },
    inject: [TRANSACTIONS_DATABASE],
  };
}

function createDefaultEnvelopeRepoProvider(): FactoryProvider {
  return {
    provide: TRANSACTIONS_TOKENS.ENVELOPE_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleEnvelopeRepository(db);
    },
    inject: [TRANSACTIONS_DATABASE],
  };
}

@Module({})
export class TransactionsModule {
  static forRoot(options?: TransactionsModuleOptions): DynamicModule {
    const transactionRepoProvider =
      options?.transactionRepository ?? createDefaultTransactionRepoProvider();

    const categoryRepoProvider =
      options?.categoryRepository ?? createDefaultCategoryRepoProvider();

    const accountRepoProvider =
      options?.accountRepository ?? createDefaultAccountRepoProvider();

    const envelopeRepoProvider =
      options?.envelopeRepository ?? createDefaultEnvelopeRepoProvider();

    // Only provide shared database if using default repo providers
    const needsDatabase =
      !options?.transactionRepository ||
      !options?.categoryRepository ||
      !options?.accountRepository ||
      !options?.envelopeRepository;

    return {
      module: TransactionsModule,
      controllers: [TransactionsController],
      imports: [ConfigModule, JwtAccessModule],
      providers: [
        transactionRepoProvider,
        categoryRepoProvider,
        accountRepoProvider,
        envelopeRepoProvider,
        ...(needsDatabase ? [createDefaultDatabaseProvider()] : []),
        // Use cases
        {
          provide: CreateTransactionUseCase,
          useFactory: (
            transactionRepository: TransactionRepository,
            categoryRepository: CategoryRepository,
            accountRepository: AccountRepository,
            envelopeRepository: EnvelopeRepository,
          ) => {
            return new CreateTransactionUseCase(
              transactionRepository,
              categoryRepository,
              accountRepository,
              envelopeRepository,
            );
          },
          inject: [
            TRANSACTIONS_TOKENS.TRANSACTION_REPOSITORY,
            TRANSACTIONS_TOKENS.CATEGORY_REPOSITORY,
            TRANSACTIONS_TOKENS.ACCOUNT_REPOSITORY,
            TRANSACTIONS_TOKENS.ENVELOPE_REPOSITORY,
          ],
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
