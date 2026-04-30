import { Permissions } from "@/common/decorators/permissions.decorator";
import { AuthGuard } from "@/common/guards/auth.guard";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { ClassSerializerInterceptor, Controller, Get, Param, Query, UseGuards, UseInterceptors, ValidationPipe } from "@nestjs/common";
import { AuditLogService } from "./audit-log.service";
import { FilterAuditLogDto } from "./dtos/filter-audit-log.dto";

@Controller('api/v1/audit-logs')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, AuthGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Permissions('audit:view')
  async findAll(@Query(new ValidationPipe({ transform: true })) query: FilterAuditLogDto) {
    return await this.auditLogService.findAll(query);
  }

  @Get(':id')
  @Permissions('audit:view')
  async findById(@Param('id') id: string) {
    return await this.auditLogService.findById(id);
  }
}
