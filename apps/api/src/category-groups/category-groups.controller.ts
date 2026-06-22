import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { z } from "zod";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import {
  CreateCategoryGroupRequestSchema,
  UpdateCategoryGroupRequestSchema,
} from "@ledger-mx/contracts";
import type { CategoryGroupKind } from "@ledger-mx/domain";
import { categoryGroupIdFromString, userIdFromString } from "@ledger-mx/domain";
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

// UUID validation schema for route params
const UuidParamSchema = z.object({
  id: z.string().uuid({ message: "Invalid category group ID format" }),
});

@Controller("category-groups")
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

  @Get()
  async listCategoryGroups(@CurrentUser("sub") sub: string) {
    const userId = userIdFromString(sub);
    const result = await this.listCategoryGroupsUseCase.execute({
      userId,
    });

     return {
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
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCategoryGroup(
    @Body(new ZodValidationPipe(CreateCategoryGroupRequestSchema.strict()))
    dto: z.infer<typeof CreateCategoryGroupRequestSchema>,
    @CurrentUser("sub") sub: string,
  ) {
    try {
      const userId = userIdFromString(sub);
      const result = await this.createCategoryGroupUseCase.execute({
        userId,
        name: dto.name,
        kind: dto.kind as CategoryGroupKind,
        idealPercentageBasisPoints: dto.idealPercentageBasisPoints,
        sortOrder: dto.sortOrder,
      } as CreateCategoryGroupInput);

      return {
        id: result.id,
        name: result.name,
        kind: result.kind,
        idealPercentageBasisPoints: result.idealPercentageBasisPoints,
        sortOrder: result.sortOrder,
        isSystem: result.isSystem,
        createdAt: result.createdAt.toISOString(),
         updatedAt: result.updatedAt.toISOString(),
       };
     } catch (error) {
       this.handleError(error);
     }
   }
 
   @Patch(":id")
  async updateCategoryGroup(
    @Param(new ZodValidationPipe(UuidParamSchema)) params: z.infer<typeof UuidParamSchema>,
    @Body(new ZodValidationPipe(UpdateCategoryGroupRequestSchema.strict()))
    dto: z.infer<typeof UpdateCategoryGroupRequestSchema>,
    @CurrentUser("sub") sub: string,
  ) {
    try {
      const userId = userIdFromString(sub);
      const result = await this.updateCategoryGroupUseCase.execute({
        userId,
        id: categoryGroupIdFromString(params.id),
        name: dto.name,
        kind: dto.kind as CategoryGroupKind | undefined,
        idealPercentageBasisPoints: dto.idealPercentageBasisPoints,
        sortOrder: dto.sortOrder,
      } as UpdateCategoryGroupInput);

      return {
        id: result.id,
        name: result.name,
        kind: result.kind,
        idealPercentageBasisPoints: result.idealPercentageBasisPoints,
        sortOrder: result.sortOrder,
        isSystem: result.isSystem,
        createdAt: result.createdAt.toISOString(),
         updatedAt: result.updatedAt.toISOString(),
       };
     } catch (error) {
       this.handleError(error);
     }
   }
 
   @Delete(":id")
  async deleteCategoryGroup(
    @Param(new ZodValidationPipe(UuidParamSchema)) params: z.infer<typeof UuidParamSchema>,
    @CurrentUser("sub") sub: string,
  ) {
    try {
      const userId = userIdFromString(sub);
      await this.deleteCategoryGroupUseCase.execute({
        userId,
        id: categoryGroupIdFromString(params.id),
      });

      return { success: true };
    } catch (error) {
      this.handleError(error);
    }
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
