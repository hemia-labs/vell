import { Permissions } from "@/common/decorators/permissions.decorator";
import { AuthGuard } from "@/common/guards/auth.guard";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { Body, ClassSerializerInterceptor, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards, UseInterceptors, ValidationPipe } from "@nestjs/common";
import { CreateTagDto } from "./dtos/create-tag.dto";
import { FilterTagDto } from "./dtos/filter-tag.dto";
import { UpdateTagDto } from "./dtos/update-tag.dto";
import { TagsService } from "./tag.service";

@Controller('api/v1/tags')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, AuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @Permissions('tags:view')
  async findAll(@Query(new ValidationPipe({ transform: true })) query: FilterTagDto) {
    return await this.tagsService.findAll(query);
  }

  @Get('slug/:slug')
  @Permissions('tags:view')
  async findBySlug(@Param('slug') slug: string) {
    return await this.tagsService.findBySlug(slug);
  }

  @Get(':id')
  @Permissions('tags:view')
  async findById(@Param('id') id: string) {
    return await this.tagsService.findById(id);
  }

  @Post()
  @Permissions('tags:create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(ValidationPipe) dto: CreateTagDto) {
    return await this.tagsService.create(dto);
  }

  @Put(':id')
  @Permissions('tags:edit')
  async update(@Param('id') id: string, @Body(ValidationPipe) dto: UpdateTagDto) {
    return await this.tagsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('tags:delete')
  async delete(@Param('id') id: string, @Query('mode') mode?: string) {
    if (mode === 'hard') {
      return await this.tagsService.hardDelete(id);
    }
    return await this.tagsService.delete(id);
  }

  @Post(':id/restore')
  @Permissions('tags:edit')
  async restore(@Param('id') id: string) {
    return await this.tagsService.restore(id);
  }
}
