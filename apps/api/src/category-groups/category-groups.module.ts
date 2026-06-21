import {
  Module,
  DynamicModule,
  Provider,
  FactoryProvider,
} from "@nestjs/common";
import { JwtAccessModule } from "../auth/jwt-access.module";
import { ConfigModule } from "@nestjs/config";
import { CategoryGroupsController } from "./category-groups.controller";
import { CATEGORY_GROUPS_TOKENS } from "./category-groups.tokens";
import type { CategoryGroupRepository } from "@ledger-mx/domain";
import {
  CreateCategoryGroupUseCase,
  ListCategoryGroupsUseCase,
  UpdateCategoryGroupUseCase,
  DeleteCategoryGroupUseCase,
} from "@ledger-mx/application";
import { UuidIdGenerator } from "../auth/infrastructure/uuid-id-generator";
import { SystemClock } from "@ledger-mx/application";
import { createDatabase, DrizzleCategoryGroupRepository } from "@ledger-mx/database";

// Internal token for shared database connection
const CATEGORY_GROUPS_DATABASE = Symbol("CATEGORY_GROUPS_DATABASE");

export interface CategoryGroupsModuleOptions {
  categoryGroupRepository?: Provider<CategoryGroupRepository>;
}

function createDefaultDatabaseProvider(): FactoryProvider {
  return {
    provide: CATEGORY_GROUPS_DATABASE,
    useFactory: () => createDatabase(),
  };
}

function createDefaultCategoryGroupRepoProvider(): FactoryProvider {
  return {
    provide: CATEGORY_GROUPS_TOKENS.CATEGORY_GROUP_REPOSITORY,
    useFactory: (db: ReturnType<typeof createDatabase>) => {
      return new DrizzleCategoryGroupRepository(db);
    },
    inject: [CATEGORY_GROUPS_DATABASE],
  };
}

@Module({})
export class CategoryGroupsModule {
  static forRoot(options?: CategoryGroupsModuleOptions): DynamicModule {
    const categoryGroupRepoProvider =
      options?.categoryGroupRepository ?? createDefaultCategoryGroupRepoProvider();

    // Only provide shared database if using default repo provider
    const needsDatabase = !options?.categoryGroupRepository;

    return {
      module: CategoryGroupsModule,
      controllers: [CategoryGroupsController],
      imports: [
        ConfigModule,
        JwtAccessModule,
      ],
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
          provide: CreateCategoryGroupUseCase,
          useFactory: (
            categoryGroupRepository: CategoryGroupRepository,
            idGenerator: UuidIdGenerator,
            clock: SystemClock,
          ) => {
            return new CreateCategoryGroupUseCase(
              categoryGroupRepository,
              idGenerator,
              clock,
            );
          },
          inject: [
            CATEGORY_GROUPS_TOKENS.CATEGORY_GROUP_REPOSITORY,
            UuidIdGenerator,
            SystemClock,
          ],
        },
        {
          provide: ListCategoryGroupsUseCase,
          useFactory: (categoryGroupRepository: CategoryGroupRepository) => {
            return new ListCategoryGroupsUseCase(categoryGroupRepository);
          },
          inject: [CATEGORY_GROUPS_TOKENS.CATEGORY_GROUP_REPOSITORY],
        },
        {
          provide: UpdateCategoryGroupUseCase,
          useFactory: (
            categoryGroupRepository: CategoryGroupRepository,
            clock: SystemClock,
          ) => {
            return new UpdateCategoryGroupUseCase(
              categoryGroupRepository,
              clock,
            );
          },
          inject: [
            CATEGORY_GROUPS_TOKENS.CATEGORY_GROUP_REPOSITORY,
            SystemClock,
          ],
        },
        {
          provide: DeleteCategoryGroupUseCase,
          useFactory: (
            categoryGroupRepository: CategoryGroupRepository,
            clock: SystemClock,
          ) => {
            return new DeleteCategoryGroupUseCase(
              categoryGroupRepository,
              clock,
            );
          },
          inject: [
            CATEGORY_GROUPS_TOKENS.CATEGORY_GROUP_REPOSITORY,
            SystemClock,
          ],
        },
      ],
      exports: [],
    };
  }
}
