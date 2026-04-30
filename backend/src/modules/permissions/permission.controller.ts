import { AuthGuard } from "@/common/guards/auth.guard";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { Controller, Get, UseGuards, UseInterceptors, ClassSerializerInterceptor } from "@nestjs/common";
import { PermissionsService } from "./permission.service";

@Controller('api/v1/permissions')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, AuthGuard)
export class PermissionsController {
    constructor(private readonly permissionsService: PermissionsService) {}

    @Get()
    @Permissions('roles:view')
    async findAll() {
        return this.permissionsService.findAll();
    }
}
