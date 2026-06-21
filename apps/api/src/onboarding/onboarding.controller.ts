import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import {
  ApplyLayoutRequestSchema,
  LAYOUT_TYPES,
} from "@ledger-mx/contracts";
import type { UserId } from "@ledger-mx/domain";
import { userIdFromString } from "@ledger-mx/domain";
import {
  ApplyDefaultCategoryGroupLayoutUseCase,
  CategoryGroupLayoutConflictError,
} from "@ledger-mx/application";
import type { LayoutType } from "@ledger-mx/contracts";

@Controller("api/v1/onboarding")
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(
    @Inject(ApplyDefaultCategoryGroupLayoutUseCase)
    private readonly applyLayoutUseCase: ApplyDefaultCategoryGroupLayoutUseCase,
  ) {}

  @Post("layout")
  @HttpCode(HttpStatus.OK)
  async applyLayout(
    @Body(new ZodValidationPipe(ApplyLayoutRequestSchema.strict()))
    dto: { layout: LayoutType },
    @CurrentUser("sub") sub: string,
  ) {
    try {
      const userId = userIdFromString(sub);

      const result = await this.applyLayoutUseCase.execute({
        userId,
        layout: dto.layout,
      });

       return {
         categoryGroups: result.categoryGroups.map((group: { id: string; name: string; kind: string; idealPercentageBasisPoints: number | null; sortOrder: number; isSystem: boolean; createdAt: Date; updatedAt: Date }) => ({
           id: group.id,
           name: group.name,
           kind: group.kind,
           idealPercentageBasisPoints: group.idealPercentageBasisPoints,
           sortOrder: group.sortOrder,
           isSystem: group.isSystem,
           createdAt: group.createdAt.toISOString(),
           updatedAt: group.updatedAt.toISOString(),
         })),
         created: result.created,
       };
    } catch (err) {
      this.handleError(err);
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof CategoryGroupLayoutConflictError) {
      throw new ConflictException((error as CategoryGroupLayoutConflictError).message);
    }

    if (error instanceof ConflictException) {
      throw error;
    }

    if (error instanceof BadRequestException) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "An error occurred";
    throw new BadRequestException(message);
  }
}
