import {
  Module,
  DynamicModule,
  Provider,
  FactoryProvider,
} from "@nestjs/common";
import { JwtAccessModule } from "../auth/jwt-access.module";
import { ConfigModule } from "@nestjs/config";
import { ExportController } from "./export.controller";
import { EXPORT_TOKENS } from "./export.tokens";
import { ExportTransactionsCsvUseCase } from "@ledger-mx/application";
import type { TransactionExportRepository } from "@ledger-mx/application";
import { DrizzleTransactionExportRepository } from "@ledger-mx/database";
import { createDatabase } from "@ledger-mx/database";

// Internal token for shared database connection
const EXPORT_DATABASE = Symbol("EXPORT_DATABASE");

export interface ExportModuleOptions {
  transactionExportRepository?: Provider;
}

function createDefaultDatabaseProvider(): FactoryProvider {
  return {
    provide: EXPORT_DATABASE,
    useFactory: () => createDatabase(),
  };
}

function createDefaultTransactionExportRepoProvider(): FactoryProvider {
  return {
    provide: EXPORT_TOKENS.TRANSACTION_EXPORT_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleTransactionExportRepository(db);
    },
    inject: [EXPORT_DATABASE],
  };
}

@Module({})
export class ExportModule {
  static forRoot(options?: ExportModuleOptions): DynamicModule {
    const transactionExportRepoProvider =
      options?.transactionExportRepository ?? createDefaultTransactionExportRepoProvider();

    // Only provide shared database if using default repo provider
    const needsDatabase = !options?.transactionExportRepository;

    return {
      module: ExportModule,
      controllers: [ExportController],
      imports: [
        ConfigModule,
        JwtAccessModule,
      ],
      providers: [
        transactionExportRepoProvider,
        ...(needsDatabase ? [createDefaultDatabaseProvider()] : []),
        // Use cases
        {
          provide: ExportTransactionsCsvUseCase,
          useFactory: (
            transactionExportRepository: TransactionExportRepository,
          ) => {
            return new ExportTransactionsCsvUseCase(transactionExportRepository);
          },
          inject: [EXPORT_TOKENS.TRANSACTION_EXPORT_REPOSITORY],
        },
      ],
      exports: [],
    };
  }
}
