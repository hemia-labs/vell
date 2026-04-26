import { Permissions } from "@/common/decorators/permissions.decorator";
import { AuthGuard } from "@/common/guards/auth.guard";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { Body, ClassSerializerInterceptor, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards, UseInterceptors, ValidationPipe } from "@nestjs/common";
import { CategoriesService } from "./category.service";
import { CreateCategoryDto } from "./dtos/create-category.dto";
import { FilterCategoryDto } from "./dtos/filter-category.dto";
import { UpdateCategoryDto } from "./dtos/update-category.dto";

@Controller('api/v1/categories')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, AuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Permissions('categories:view')
  async findAll(@Query(new ValidationPipe({ transform: true })) query: FilterCategoryDto) {
    return await this.categoriesService.findAll(query);
  }

  @Get('slug/:slug')
  @Permissions('categories:view')
  async findBySlug(@Param('slug') slug: string) {
    return await this.categoriesService.findBySlug(slug);
  }

  @Get(':id/children')
  @Permissions('categories:view')
  async findChildren(@Param('id') id: string) {
    return await this.categoriesService.findChildren(id);
  }

  @Get(':id')
  @Permissions('categories:view')
  async findById(@Param('id') id: string) {
    return await this.categoriesService.findById(id);
  }

  @Post()
  @Permissions('categories:create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(ValidationPipe) dto: CreateCategoryDto) {
    return await this.categoriesService.create(dto);
  }

  @Put(':id')
  @Permissions('categories:edit')
  async update(@Param('id') id: string, @Body(ValidationPipe) dto: UpdateCategoryDto) {
    return await this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('categories:delete')
  async delete(@Param('id') id: string, @Query('mode') mode?: string) {
    if (mode === 'hard') {
      return await this.categoriesService.hardDelete(id);
    }
    return await this.categoriesService.delete(id);
  }

  @Post(':id/restore')
  @Permissions('categories:edit')
  async restore(@Param('id') id: string) {
    return await this.categoriesService.restore(id);
  }
}
