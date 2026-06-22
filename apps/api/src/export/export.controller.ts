import {
  Controller,
  Get,
  Query,
  UseGuards,
  Inject,
  BadRequestException,
  Header,
} from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { DateRangeQuerySchema } from "@ledger-mx/contracts";
import type { DateRangeQuery } from "@ledger-mx/contracts";
import { ExportTransactionsCsvUseCase } from "@ledger-mx/application";
import { userIdFromString } from "@ledger-mx/domain";

@Controller("api/v1/export")
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(
    @Inject(ExportTransactionsCsvUseCase)
    private readonly exportTransactionsCsvUseCase: ExportTransactionsCsvUseCase,
  ) {}

  @Get("csv")
  @Header("Content-Type", "text/csv")
  @Header("Content-Disposition", 'attachment; filename="transactions.csv"')
  async downloadCsv(
    @Query(new ZodValidationPipe(DateRangeQuerySchema.optional()))
    query: DateRangeQuery | undefined,
    @CurrentUser("sub") sub: string,
  ): Promise<string> {
    const userId = userIdFromString(sub);

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
      throw new BadRequestException("startDate must be before or equal to endDate");
    }

    // Generate CSV
    const result = await this.exportTransactionsCsvUseCase.execute({
      userId,
      startDate,
      endDate,
    });

    return result.csv;
  }
}
