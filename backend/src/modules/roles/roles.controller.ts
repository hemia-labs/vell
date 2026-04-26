import { AuthGuard } from "@/common/guards/auth.guard";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { Body, ClassSerializerInterceptor, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards, UseInterceptors, ValidationPipe } from "@nestjs/common";
import { RolesService } from "./role.service";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { CreateRoleDto } from "./dtos/create-role.dto";
import { UpdateRoleDto } from "./dtos/update-role.dto";
import { FilterRoleDto } from "./dtos/filter-role.dto";


@Controller('api/v1/roles')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, AuthGuard)
export class RolesController {

    constructor(private readonly rolesService: RolesService) {}

    @Get()
    @Permissions('roles:view')
    async findAll(@Query(new ValidationPipe({ transform: true })) query: FilterRoleDto) {
        return await this.rolesService.findAll(query);
    }

    @Get(':id')
    @Permissions('roles:view')
    async findById(@Param('id') id: string) {
        return await this.rolesService.findById(id);
    }

    @Get('slug/:slug')
    @Permissions('roles:view')
    async findBySlug(@Param('slug') slug: string) {
        return await this.rolesService.findBySlug(slug);
    }

    @Post()
    @Permissions('roles:create')
    @HttpCode(HttpStatus.CREATED)
    async create(@Body(ValidationPipe) dto: CreateRoleDto) {
        return await this.rolesService.create(dto);
    }

    @Put(':id')
    @Permissions('roles:edit')
    async update(@Param('id') id: string, @Body(ValidationPipe) dto: UpdateRoleDto) {
        return await this.rolesService.update(id, dto);
    }

    @Delete(':id')
    @Permissions('roles:delete')
    async delete(@Param('id') id: string, @Query('mode') mode?: string) {
        if (mode === 'hard') {
            return await this.rolesService.hardDelete(id);
        }
        return await this.rolesService.delete(id);
    }

    @Post(':id/restore')
    @Permissions('roles:edit')
    async restore(@Param('id') id: string) {
        return await this.rolesService.restore(id);
    }

}
