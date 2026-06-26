import {
  Controller,
  UseGuards,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { Req } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { OwnershipType, CategoryId } from "@ledger-mx/domain";
import {
  userIdFromString,
  categoryIdFromString,
  categoryGroupIdFromString,
} from "@ledger-mx/domain";
import {
  CreateCategoryUseCase,
  ListCategoriesUseCase,
  GetCategoryUseCase,
  UpdateCategoryUseCase,
  ArchiveCategoryUseCase,
  CategoryNotFoundError,
  SystemCategoryModificationError,
  CategoryGroupNotFoundError,
  InvalidParentCategoryError,
  CategoryInUseError,
  CategoryHasActiveChildrenError,
  DuplicateCategoryNameError,
} from "@ledger-mx/application";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@ledger-mx/application";
import { contract } from "@ledger-mx/contracts";
import { TsRestHandler, tsRestHandler } from "@ts-rest/nest";

// Extend Express Request type to include user property added by JWT guard
interface RequestWithUser extends Request {
  user: {
    sub: string;
    // Add other user properties as needed
  };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(
    @Inject(CreateCategoryUseCase)
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    @Inject(ListCategoriesUseCase)
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
    @Inject(GetCategoryUseCase)
    private readonly getCategoryUseCase: GetCategoryUseCase,
    @Inject(UpdateCategoryUseCase)
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    @Inject(ArchiveCategoryUseCase)
    private readonly archiveCategoryUseCase: ArchiveCategoryUseCase,
  ) {}

  @TsRestHandler(contract.categories.list)
  async listCategories(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.categories.list, async ({ query }) => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      const result = await this.listCategoriesUseCase.execute({
        userId,
        categoryGroupId: query?.categoryGroupId
          ? categoryGroupIdFromString(query.categoryGroupId)
          : undefined,
      });

      return {
        status: 200 as const,
        body: {
          categories: result.categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            parentId: cat.parentId,
            categoryGroupId: cat.categoryGroupId,
            ownership: cat.ownership as OwnershipType,
            createdAt: cat.createdAt.toISOString(),
            updatedAt: cat.updatedAt.toISOString(),
            usageCount: cat.usageCount,
          })),
        },
      };
    });
  }

  @TsRestHandler(contract.categories.create)
  async createCategory(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.categories.create, async ({ body }) => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        const result = await this.createCategoryUseCase.execute({
          userId,
          name: body.name,
          categoryGroupId: categoryGroupIdFromString(body.categoryGroupId),
          parentId: body.parentId
            ? categoryIdFromString(body.parentId)
            : undefined,
        } as CreateCategoryInput);

        return {
          status: 201 as const,
          body: {
            id: result.id,
            name: result.name,
            parentId: result.parentId,
            categoryGroupId: result.categoryGroupId,
            ownership: result.ownership,
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
          },
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  @TsRestHandler(contract.categories.get)
  async getCategory(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.categories.get, async ({ params }) => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        const result = await this.getCategoryUseCase.execute({
          userId,
          id: categoryIdFromString(params.id),
        });

        return {
          status: 200 as const,
          body: {
            category: {
              id: result.category.id,
              name: result.category.name,
              parentId: result.category.parentId,
              categoryGroupId: result.category.categoryGroupId,
              ownership: result.category.ownership,
              createdAt: result.category.createdAt.toISOString(),
              updatedAt: result.category.updatedAt.toISOString(),
              usageCount: result.category.usageCount,
            },
          },
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  @TsRestHandler(contract.categories.update)
  async updateCategory(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(
      contract.categories.update,
      async ({ body, params }) => {
        const user = req.user as { sub: string };
        const userId = userIdFromString(user.sub);

        try {
          const result = await this.updateCategoryUseCase.execute({
            userId,
            id: categoryIdFromString(params.id),
            name: body.name,
            parentId: body.parentId as CategoryId | null | undefined,
          } as UpdateCategoryInput);

          return {
            status: 200 as const,
            body: {
              id: result.id,
              name: result.name,
              parentId: result.parentId,
              categoryGroupId: result.categoryGroupId,
              ownership: result.ownership,
              createdAt: result.createdAt.toISOString(),
              updatedAt: result.updatedAt.toISOString(),
            },
          };
        } catch (error) {
          this.handleError(error);
        }
      },
    );
  }

  @TsRestHandler(contract.categories.archive)
  async archiveCategory(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.categories.archive, async ({ params }) => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        await this.archiveCategoryUseCase.execute({
          userId,
          id: categoryIdFromString(params.id),
        });

        return {
          status: 204 as const,
          body: undefined,
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  private handleError(error: unknown): never {
    if (error instanceof CategoryNotFoundError) {
      throw new NotFoundException(error.message);
    }

    if (error instanceof CategoryGroupNotFoundError) {
      throw new NotFoundException(error.message);
    }

    if (error instanceof SystemCategoryModificationError) {
      throw new ConflictException(error.message);
    }

    if (error instanceof InvalidParentCategoryError) {
      throw new BadRequestException(error.message);
    }

    if (error instanceof CategoryInUseError) {
      throw new ConflictException(error.message);
    }

    if (error instanceof CategoryHasActiveChildrenError) {
      throw new ConflictException(error.message);
    }

    if (error instanceof DuplicateCategoryNameError) {
      throw new ConflictException(error.message);
    }

    if (
      error instanceof NotFoundException ||
      error instanceof ConflictException ||
      error instanceof BadRequestException
    ) {
      throw error;
    }

    throw new BadRequestException(
      error instanceof Error ? error.message : "An error occurred",
    );
  }
}
