import {
  Module,
  DynamicModule,
  Provider,
  FactoryProvider,
} from "@nestjs/common";
import { JwtAccessModule } from "../auth/jwt-access.module";
import { ConfigModule } from "@nestjs/config";
import { OnboardingController } from "./onboarding.controller";
import type { CategoryGroupRepository } from "@ledger-mx/domain";
import { ApplyDefaultCategoryGroupLayoutUseCase } from "@ledger-mx/application";
import { UuidIdGenerator } from "../auth/infrastructure/uuid-id-generator";
import { SystemClock } from "@ledger-mx/application";
import {
  createDatabase,
  DrizzleCategoryGroupRepository,
} from "@ledger-mx/database";

// Internal token for shared database connection
const ONBOARDING_DATABASE = Symbol("ONBOARDING_DATABASE");

export interface OnboardingModuleOptions {
  categoryGroupRepository?: Provider<CategoryGroupRepository>;
}

function createDefaultDatabaseProvider(): FactoryProvider {
  return {
    provide: ONBOARDING_DATABASE,
    useFactory: () => createDatabase(),
  };
}

function createDefaultCategoryGroupRepoProvider(): FactoryProvider {
  return {
    provide: "CATEGORY_GROUP_REPOSITORY",
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleCategoryGroupRepository(db);
    },
    inject: [ONBOARDING_DATABASE],
  };
}

@Module({})
export class OnboardingModule {
  static forRoot(options?: OnboardingModuleOptions): DynamicModule {
    const categoryGroupRepoProvider =
      options?.categoryGroupRepository ??
      createDefaultCategoryGroupRepoProvider();

    // Only provide shared database if using default repo provider
    const needsDatabase = !options?.categoryGroupRepository;

    return {
      module: OnboardingModule,
      controllers: [OnboardingController],
      imports: [ConfigModule, JwtAccessModule],
      providers: [
        categoryGroupRepoProvider,
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
          provide: ApplyDefaultCategoryGroupLayoutUseCase,
          useFactory: (
            categoryGroupRepository: CategoryGroupRepository,
            idGenerator: UuidIdGenerator,
            clock: SystemClock,
          ) => {
            return new ApplyDefaultCategoryGroupLayoutUseCase(
              categoryGroupRepository,
              idGenerator,
              clock,
            );
          },
          inject: ["CATEGORY_GROUP_REPOSITORY", UuidIdGenerator, SystemClock],
        },
      ],
      exports: [],
    };
  }
}
