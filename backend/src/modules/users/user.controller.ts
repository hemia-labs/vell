import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { AuthGuard } from "@/common/guards/auth.guard";
import { Body, ClassSerializerInterceptor, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards, UseInterceptors, ValidationPipe } from "@nestjs/common";
import { UsersService } from "./user.service";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { CreateUserDto } from "./dtos/create-user.dto";
import { UpdateUserDto } from "./dtos/update-user.dto";

@Controller('api/v1/users')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, AuthGuard)
export class UsersController {

    constructor(private readonly usersService: UsersService) {}

    @Get()
    @Permissions('users:view')
    async findAll() {
        return await this.usersService.findAll();
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
    async update(@Param('id') id: string, @Body(ValidationPipe) dto: UpdateUserDto) {
        return await this.usersService.update(dto, id);
    }

    @Delete(':id')
    @Permissions('users:delete')
    async delete(@Param('id') id: string) {
        return await this.usersService.delete(id);
    }

}