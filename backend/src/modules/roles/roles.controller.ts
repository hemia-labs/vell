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
    async findAll(@Query() query: FilterRoleDto) {
        return this.rolesService.findAll(query);
    }

    @Get(':id')
    @Permissions('roles:view')
    async findById(@Param('id') id: string) {
        return this.rolesService.findById(id);
    }

    @Get('slug/:slug')
    @Permissions('roles:view')
    async findBySlug(@Param('slug') slug: string) {
        return this.rolesService.findBySlug(slug);
    }

    @Post()
    @Permissions('roles:create')
    @HttpCode(HttpStatus.CREATED)
    async create(@Body(ValidationPipe) dto: CreateRoleDto) {
        return this.rolesService.create(dto);
    }

    @Put(':id')
    @Permissions('roles:edit')
    async update(@Body(ValidationPipe) dto: UpdateRoleDto, @Param('id') id: string) {
        return this.rolesService.update(id, dto);
    }

    @Delete(':id')
    @Permissions('roles:delete')
    async delete(@Param('id') id: string) {
        return this.rolesService.delete(id);
    }

    @Delete(':id/hard')
    @Permissions('roles:delete')
    async hardDelete(@Param('id') id: string) {
        return this.rolesService.hardDelete(id);
    }

    @Post(':id/restore')
    @Permissions('roles:edit')
    async restore(@Param('id') id: string) {
        return this.rolesService.restore(id);
    }

}