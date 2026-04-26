import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { AuthGuard } from "@/common/guards/auth.guard";
import { Body, ClassSerializerInterceptor, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, Req, UseGuards, UseInterceptors, ValidationPipe } from "@nestjs/common";
import { UsersService } from "./user.service";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { CreateUserDto } from "./dtos/create-user.dto";
import { UpdateUserDto } from "./dtos/update-user.dto";
import { FilterUserDto } from "./dtos/filter-user.dto";
import { Request } from "express";

@Controller('api/v1/users')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, AuthGuard)
export class UsersController {

    constructor(private readonly usersService: UsersService) {}

    @Get()
    @Permissions('users:view')
    async findAll(@Query(new ValidationPipe({ transform: true })) query: FilterUserDto) {
        return await this.usersService.findAll(query);
    }

    @Get(':id')
    @Permissions('users:view')
    async findById(@Param('id') id: string) {
        return await this.usersService.findById(id);
    }

    @Post()
    @Permissions('users:create')
    @HttpCode(HttpStatus.CREATED)
    async create(@Body(ValidationPipe) dto: CreateUserDto) {
        return await this.usersService.create(dto);
    }

    @Put(':id')
    @Permissions('users:edit')
    async update(@Param('id') id: string, @Body(ValidationPipe) dto: UpdateUserDto, @Req() req: Request) {
        return await this.usersService.update(dto, id, req.user.userId);
    }

    @Delete(':id')
    @Permissions('users:delete')
    async delete(@Param('id') id: string, @Query('mode') mode?: 'hard') {
        if (mode === 'hard') {
            return await this.usersService.hardDelete(id);
        }
        return await this.usersService.delete(id);
    }

    @Post(':id/restore')
    @Permissions('users:edit')
    async restore(@Param('id') id: string) {
        return await this.usersService.restore(id);
    }

}
