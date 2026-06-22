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
import type { CategoryGroupKind } from "@ledger-mx/domain";
import { userIdFromString, categoryGroupIdFromString } from "@ledger-mx/domain";
import {
  CreateCategoryGroupUseCase,
  ListCategoryGroupsUseCase,
  UpdateCategoryGroupUseCase,
  DeleteCategoryGroupUseCase,
  CategoryGroupNotFoundError,
  SystemCategoryGroupModificationError,
  CategoryGroupHasActiveCategoriesError,
} from "@ledger-mx/application";
import type { CreateCategoryGroupInput, UpdateCategoryGroupInput } from "@ledger-mx/application";
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
export class CategoryGroupsController {
  constructor(
    @Inject(CreateCategoryGroupUseCase)
    private readonly createCategoryGroupUseCase: CreateCategoryGroupUseCase,
    @Inject(ListCategoryGroupsUseCase)
    private readonly listCategoryGroupsUseCase: ListCategoryGroupsUseCase,
    @Inject(UpdateCategoryGroupUseCase)
    private readonly updateCategoryGroupUseCase: UpdateCategoryGroupUseCase,
    @Inject(DeleteCategoryGroupUseCase)
    private readonly deleteCategoryGroupUseCase: DeleteCategoryGroupUseCase,
  ) {}

  @TsRestHandler(contract.categoryGroups.list)
  async listCategoryGroups(@Req() req: RequestWithUser) {
    return tsRestHandler(contract.categoryGroups.list, async () => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      const result = await this.listCategoryGroupsUseCase.execute({
        userId,
      });

      return {
        status: 200 as const,
        body: {
          categoryGroups: result.categoryGroups.map((group) => ({
            id: group.id,
            name: group.name,
            kind: group.kind as CategoryGroupKind,
            idealPercentageBasisPoints: group.idealPercentageBasisPoints,
            sortOrder: group.sortOrder,
            isSystem: group.isSystem,
            createdAt: group.createdAt.toISOString(),
            updatedAt: group.updatedAt.toISOString(),
          })),
        },
      };
    });
  }

  @TsRestHandler(contract.categoryGroups.create)
  async createCategoryGroup(@Req() req: RequestWithUser) {
    return tsRestHandler(contract.categoryGroups.create, async ({ body }) => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        const result = await this.createCategoryGroupUseCase.execute({
          userId,
          name: body.name,
          kind: body.kind as CategoryGroupKind,
          idealPercentageBasisPoints: body.idealPercentageBasisPoints,
          sortOrder: body.sortOrder,
        } as CreateCategoryGroupInput);

        return {
          status: 201 as const,
          body: {
            id: result.id,
            name: result.name,
            kind: result.kind,
            idealPercentageBasisPoints: result.idealPercentageBasisPoints,
            sortOrder: result.sortOrder,
            isSystem: result.isSystem,
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
          },
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  @TsRestHandler(contract.categoryGroups.update)
  async updateCategoryGroup(@Req() req: RequestWithUser) {
    return tsRestHandler(contract.categoryGroups.update, async ({ body, params }) => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        const result = await this.updateCategoryGroupUseCase.execute({
          userId,
          id: categoryGroupIdFromString(params.id),
          name: body.name,
          kind: body.kind as CategoryGroupKind | undefined,
          idealPercentageBasisPoints: body.idealPercentageBasisPoints,
          sortOrder: body.sortOrder,
        } as UpdateCategoryGroupInput);

        return {
          status: 200 as const,
          body: {
            id: result.id,
            name: result.name,
            kind: result.kind,
            idealPercentageBasisPoints: result.idealPercentageBasisPoints,
            sortOrder: result.sortOrder,
            isSystem: result.isSystem,
            createdAt: result.createdAt.toISOString(),
            updatedAt: result.updatedAt.toISOString(),
          },
        };
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  @TsRestHandler(contract.categoryGroups.delete)
  async deleteCategoryGroup(@Req() req: RequestWithUser) {
    return tsRestHandler(contract.categoryGroups.delete, async ({ params }) => {
      const user = req.user as { sub: string };
      const userId = userIdFromString(user.sub);

      try {
        await this.deleteCategoryGroupUseCase.execute({
          userId,
          id: categoryGroupIdFromString(params.id),
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
    if (error instanceof CategoryGroupNotFoundError) {
      throw new NotFoundException(error.message);
    }

    if (
      error instanceof SystemCategoryGroupModificationError ||
      error instanceof CategoryGroupHasActiveCategoriesError
    ) {
      throw new ConflictException(error.message);
    }

    if (error instanceof NotFoundException || error instanceof ConflictException) {
      throw error;
    }

    throw new BadRequestException(
      error instanceof Error ? error.message : "An error occurred",
    );
  }
}
