import {
  Controller,
  UseGuards,
  Inject,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { Req } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { userIdFromString } from "@ledger-mx/domain";
import {
  ApplyDefaultCategoryGroupLayoutUseCase,
  CategoryGroupLayoutConflictError,
} from "@ledger-mx/application";
import type { CategoryGroupKind } from "@ledger-mx/domain";
import { contract } from "@ledger-mx/contracts";
import { TsRestHandler, tsRestHandler } from "@ts-rest/nest";

// Extend Express Request type to include user property added by JWT guard
interface RequestWithUser extends Request {
  user: {
    sub: string;
  };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(
    @Inject(ApplyDefaultCategoryGroupLayoutUseCase)
    private readonly applyLayoutUseCase: ApplyDefaultCategoryGroupLayoutUseCase,
  ) {}

  @TsRestHandler(contract.onboarding.applyLayout)
  async applyLayout(@Req() req: RequestWithUser): Promise<unknown> {
    return tsRestHandler(contract.onboarding.applyLayout, async ({ body }) => {
      const userId = userIdFromString(req.user.sub);

      try {
        const result = await this.applyLayoutUseCase.execute({
          userId,
          layout: body.layout,
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
              ownership: group.ownership,
              createdAt: group.createdAt.toISOString(),
              updatedAt: group.updatedAt.toISOString(),
            })),
            created: result.created,
          },
        };
      } catch (err) {
        this.handleError(err);
      }
    });
  }

  private handleError(error: unknown): never {
    if (error instanceof CategoryGroupLayoutConflictError) {
      throw new ConflictException(
        (error as CategoryGroupLayoutConflictError).message,
      );
    }

    if (error instanceof ConflictException) {
      throw error;
    }

    if (error instanceof BadRequestException) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "An error occurred";
    throw new BadRequestException(message);
  }
}
