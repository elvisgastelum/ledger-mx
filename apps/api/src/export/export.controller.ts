import {
  Controller,
  UseGuards,
  Inject,
  BadRequestException,
} from "@nestjs/common";
import { Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ExportTransactionsCsvUseCase } from "@ledger-mx/application";
import { userIdFromString } from "@ledger-mx/domain";
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
export class ExportController {
  constructor(
    @Inject(ExportTransactionsCsvUseCase)
    private readonly exportTransactionsCsvUseCase: ExportTransactionsCsvUseCase,
  ) {}

  @TsRestHandler(contract.export.downloadCsv)
  async downloadCsv(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    return tsRestHandler(contract.export.downloadCsv, async ({ query }) => {
      const user = req.user;
      const userId = userIdFromString(user.sub);

      let startDate: Date | undefined;
      let endDate: Date | undefined;

      // Parse dates if provided
      if (query?.startDate) {
        startDate = new Date(query.startDate);
        if (isNaN(startDate.getTime())) {
          throw new BadRequestException("Invalid startDate format");
        }
      }

      if (query?.endDate) {
        endDate = new Date(query.endDate);
        if (isNaN(endDate.getTime())) {
          throw new BadRequestException("Invalid endDate format");
        }
      }

      // Validate date range
      if (startDate && endDate && startDate > endDate) {
        throw new BadRequestException(
          "startDate must be before or equal to endDate",
        );
      }

      // Generate CSV
      const result = await this.exportTransactionsCsvUseCase.execute({
        userId,
        startDate,
        endDate,
      });

      // Set headers for CSV download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="transactions.csv"',
      );

      return {
        status: 200 as const,
        body: result.csv,
      };
    });
  }
}
