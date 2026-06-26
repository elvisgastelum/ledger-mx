import {
  Module,
  DynamicModule,
  Provider,
  FactoryProvider,
} from "@nestjs/common";
import { JwtAccessModule } from "../auth/jwt-access.module";
import { ConfigModule } from "@nestjs/config";
import { CategoriesController } from "./categories.controller";
import { CATEGORIES_TOKENS } from "./categories.tokens";
import type { CategoryRepository } from "@ledger-mx/domain";
import type { CategoryGroupRepository } from "@ledger-mx/domain";
import {
  CreateCategoryUseCase,
  ListCategoriesUseCase,
  GetCategoryUseCase,
  UpdateCategoryUseCase,
  ArchiveCategoryUseCase,
} from "@ledger-mx/application";
import { UuidIdGenerator } from "../auth/infrastructure/uuid-id-generator";
import { SystemClock } from "@ledger-mx/application";
import {
  createDatabase,
  DrizzleCategoryRepository,
  DrizzleCategoryGroupRepository,
} from "@ledger-mx/database";

// Internal token for shared database connection
const CATEGORIES_DATABASE = Symbol("CATEGORIES_DATABASE");

export interface CategoriesModuleOptions {
  categoryRepository?: Provider<CategoryRepository>;
  categoryGroupRepository?: Provider<CategoryGroupRepository>;
}

function createDefaultDatabaseProvider(): FactoryProvider {
  return {
    provide: CATEGORIES_DATABASE,
    useFactory: () => createDatabase(),
  };
}

function createDefaultCategoryRepoProvider(): FactoryProvider {
  return {
    provide: CATEGORIES_TOKENS.CATEGORY_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleCategoryRepository(db);
    },
    inject: [CATEGORIES_DATABASE],
  };
}

function createDefaultCategoryGroupRepoProvider(): FactoryProvider {
  return {
    provide: CATEGORIES_TOKENS.CATEGORY_GROUP_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleCategoryGroupRepository(db);
    },
    inject: [CATEGORIES_DATABASE],
  };
}

@Module({})
export class CategoriesModule {
  static forRoot(options?: CategoriesModuleOptions): DynamicModule {
    const categoryRepoProvider =
      options?.categoryRepository ?? createDefaultCategoryRepoProvider();

    const categoryGroupRepoProvider =
      options?.categoryGroupRepository ??
      createDefaultCategoryGroupRepoProvider();

    // Only provide shared database if using default repo providers
    const needsDatabase =
      !options?.categoryRepository || !options?.categoryGroupRepository;

    return {
      module: CategoriesModule,
      controllers: [CategoriesController],
      imports: [ConfigModule, JwtAccessModule],
      providers: [
        categoryRepoProvider,
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
          provide: CreateCategoryUseCase,
          useFactory: (
            categoryRepository: CategoryRepository,
            categoryGroupRepository: CategoryGroupRepository,
            idGenerator: UuidIdGenerator,
            clock: SystemClock,
          ) => {
            return new CreateCategoryUseCase(
              categoryRepository,
              categoryGroupRepository,
              idGenerator,
              clock,
            );
          },
          inject: [
            CATEGORIES_TOKENS.CATEGORY_REPOSITORY,
            CATEGORIES_TOKENS.CATEGORY_GROUP_REPOSITORY,
            UuidIdGenerator,
            SystemClock,
          ],
        },
        {
          provide: ListCategoriesUseCase,
          useFactory: (categoryRepository: CategoryRepository) => {
            return new ListCategoriesUseCase(categoryRepository);
          },
          inject: [CATEGORIES_TOKENS.CATEGORY_REPOSITORY],
        },
        {
          provide: GetCategoryUseCase,
          useFactory: (categoryRepository: CategoryRepository) => {
            return new GetCategoryUseCase(categoryRepository);
          },
          inject: [CATEGORIES_TOKENS.CATEGORY_REPOSITORY],
        },
        {
          provide: UpdateCategoryUseCase,
          useFactory: (
            categoryRepository: CategoryRepository,
            categoryGroupRepository: CategoryGroupRepository,
            clock: SystemClock,
          ) => {
            return new UpdateCategoryUseCase(
              categoryRepository,
              categoryGroupRepository,
              clock,
            );
          },
          inject: [
            CATEGORIES_TOKENS.CATEGORY_REPOSITORY,
            CATEGORIES_TOKENS.CATEGORY_GROUP_REPOSITORY,
            SystemClock,
          ],
        },
        {
          provide: ArchiveCategoryUseCase,
          useFactory: (
            categoryRepository: CategoryRepository,
            clock: SystemClock,
          ) => {
            return new ArchiveCategoryUseCase(categoryRepository, clock);
          },
          inject: [CATEGORIES_TOKENS.CATEGORY_REPOSITORY, SystemClock],
        },
      ],
      exports: [],
    };
  }
}
