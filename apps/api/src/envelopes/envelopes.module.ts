import {
  Module,
  DynamicModule,
  Provider,
  FactoryProvider,
} from "@nestjs/common";
import { JwtAccessModule } from "../auth/jwt-access.module";
import { ConfigModule } from "@nestjs/config";
import { EnvelopesController } from "./envelopes.controller";
import { ENVELOPES_TOKENS } from "./envelopes.tokens";
import type { EnvelopeRepository, AccountRepository, TransactionRepository, BalanceRepository } from "@ledger-mx/domain";
import {
  CreateEnvelopeUseCase,
  ListEnvelopesUseCase,
  GetEnvelopeUseCase,
  UpdateEnvelopeUseCase,
  ArchiveEnvelopeUseCase,
  FundEnvelopeUseCase,
  AllocateEnvelopeUseCase,
  GetEnvelopeBalanceUseCase,
  GetEnvelopeBalancesUseCase,
  GetEnvelopeTransactionsUseCase,
} from "@ledger-mx/application";
import { UuidIdGenerator } from "../auth/infrastructure/uuid-id-generator";
import { SystemClock } from "@ledger-mx/application";
import {
  createDatabase,
  DrizzleEnvelopeRepository,
  DrizzleAccountRepository,
  DrizzleTransactionRepository,
  DrizzleBalanceRepository,
} from "@ledger-mx/database";

// Internal token for shared database connection
const ENVELOPES_DATABASE = Symbol("ENVELOPES_DATABASE");

export interface EnvelopesModuleOptions {
  envelopeRepository?: Provider<EnvelopeRepository>;
  accountRepository?: Provider<AccountRepository>;
  transactionRepository?: Provider<TransactionRepository>;
  balanceRepository?: Provider<BalanceRepository>;
}

function createDefaultDatabaseProvider(): FactoryProvider {
  return {
    provide: ENVELOPES_DATABASE,
    useFactory: () => createDatabase(),
  };
}

function createDefaultEnvelopeRepoProvider(): FactoryProvider {
  return {
    provide: ENVELOPES_TOKENS.ENVELOPE_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleEnvelopeRepository(db);
    },
    inject: [ENVELOPES_DATABASE],
  };
}

function createDefaultAccountRepoProvider(): FactoryProvider {
  return {
    provide: ENVELOPES_TOKENS.ACCOUNT_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleAccountRepository(db);
    },
    inject: [ENVELOPES_DATABASE],
  };
}

function createDefaultTransactionRepoProvider(): FactoryProvider {
  return {
    provide: ENVELOPES_TOKENS.TRANSACTION_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleTransactionRepository(db);
    },
    inject: [ENVELOPES_DATABASE],
  };
}

function createDefaultBalanceRepoProvider(): FactoryProvider {
  return {
    provide: ENVELOPES_TOKENS.BALANCE_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleBalanceRepository(db);
    },
    inject: [ENVELOPES_DATABASE],
  };
}

@Module({})
export class EnvelopesModule {
  static forRoot(options?: EnvelopesModuleOptions): DynamicModule {
    const envelopeRepoProvider =
      options?.envelopeRepository ?? createDefaultEnvelopeRepoProvider();

    const accountRepoProvider =
      options?.accountRepository ?? createDefaultAccountRepoProvider();

    const transactionRepoProvider =
       options?.transactionRepository ?? createDefaultTransactionRepoProvider();

     const balanceRepoProvider =
       options?.balanceRepository ?? createDefaultBalanceRepoProvider();

     // Only provide shared database if using default repo providers
     const needsDatabase = !options?.envelopeRepository;

    return {
      module: EnvelopesModule,
      controllers: [EnvelopesController],
      imports: [ConfigModule, JwtAccessModule],
      providers: [
        envelopeRepoProvider,
        accountRepoProvider,
        transactionRepoProvider,
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
          provide: CreateEnvelopeUseCase,
          useFactory: (
            envelopeRepository: EnvelopeRepository,
            idGenerator: UuidIdGenerator,
            clock: SystemClock,
          ) => {
            return new CreateEnvelopeUseCase(
              envelopeRepository,
              idGenerator,
              clock,
            );
          },
          inject: [
            ENVELOPES_TOKENS.ENVELOPE_REPOSITORY,
            UuidIdGenerator,
            SystemClock,
          ],
        },
        {
          provide: ListEnvelopesUseCase,
          useFactory: (envelopeRepository: EnvelopeRepository) => {
            return new ListEnvelopesUseCase(envelopeRepository);
          },
          inject: [ENVELOPES_TOKENS.ENVELOPE_REPOSITORY],
        },
        {
          provide: GetEnvelopeUseCase,
          useFactory: (envelopeRepository: EnvelopeRepository) => {
            return new GetEnvelopeUseCase(envelopeRepository);
          },
          inject: [ENVELOPES_TOKENS.ENVELOPE_REPOSITORY],
        },
        {
          provide: UpdateEnvelopeUseCase,
          useFactory: (
            envelopeRepository: EnvelopeRepository,
            clock: SystemClock,
          ) => {
            return new UpdateEnvelopeUseCase(
              envelopeRepository,
              clock,
            );
          },
          inject: [ENVELOPES_TOKENS.ENVELOPE_REPOSITORY, SystemClock],
        },
        {
          provide: ArchiveEnvelopeUseCase,
          useFactory: (
            envelopeRepository: EnvelopeRepository,
            clock: SystemClock,
          ) => {
            return new ArchiveEnvelopeUseCase(
              envelopeRepository,
              clock,
            );
          },
          inject: [ENVELOPES_TOKENS.ENVELOPE_REPOSITORY, SystemClock],
        },
        {
          provide: FundEnvelopeUseCase,
          useFactory: (
            envelopeRepository: EnvelopeRepository,
            accountRepository: AccountRepository,
            transactionRepository: TransactionRepository,
            balanceRepository: BalanceRepository,
            idGenerator: UuidIdGenerator,
            clock: SystemClock,
          ) => {
            return new FundEnvelopeUseCase(
              envelopeRepository,
              accountRepository,
              transactionRepository,
              balanceRepository,
              idGenerator,
              clock,
            );
          },
          inject: [
            ENVELOPES_TOKENS.ENVELOPE_REPOSITORY,
            ENVELOPES_TOKENS.ACCOUNT_REPOSITORY,
            ENVELOPES_TOKENS.TRANSACTION_REPOSITORY,
            ENVELOPES_TOKENS.BALANCE_REPOSITORY,
            UuidIdGenerator,
            SystemClock,
          ],
        },
        {
          provide: AllocateEnvelopeUseCase,
          useFactory: (
            envelopeRepository: EnvelopeRepository,
            accountRepository: AccountRepository,
            transactionRepository: TransactionRepository,
            balanceRepository: BalanceRepository,
            idGenerator: UuidIdGenerator,
            clock: SystemClock,
          ) => {
            return new AllocateEnvelopeUseCase(
              envelopeRepository,
              accountRepository,
              transactionRepository,
              balanceRepository,
              idGenerator,
              clock,
            );
          },
          inject: [
            ENVELOPES_TOKENS.ENVELOPE_REPOSITORY,
            ENVELOPES_TOKENS.ACCOUNT_REPOSITORY,
            ENVELOPES_TOKENS.TRANSACTION_REPOSITORY,
            ENVELOPES_TOKENS.BALANCE_REPOSITORY,
            UuidIdGenerator,
            SystemClock,
          ],
        },
        {
          provide: GetEnvelopeBalanceUseCase,
          useFactory: (envelopeRepository: EnvelopeRepository) => {
            return new GetEnvelopeBalanceUseCase(envelopeRepository);
          },
          inject: [ENVELOPES_TOKENS.ENVELOPE_REPOSITORY],
        },
        {
          provide: GetEnvelopeBalancesUseCase,
          useFactory: (envelopeRepository: EnvelopeRepository) => {
            return new GetEnvelopeBalancesUseCase(envelopeRepository);
          },
          inject: [ENVELOPES_TOKENS.ENVELOPE_REPOSITORY],
        },
        {
          provide: GetEnvelopeTransactionsUseCase,
          useFactory: (
            envelopeRepository: EnvelopeRepository,
            transactionRepository: TransactionRepository,
          ) => {
            return new GetEnvelopeTransactionsUseCase(
              envelopeRepository,
              transactionRepository,
            );
          },
          inject: [
            ENVELOPES_TOKENS.ENVELOPE_REPOSITORY,
            ENVELOPES_TOKENS.TRANSACTION_REPOSITORY,
          ],
        },
      ],
      exports: [],
    };
  }
}
