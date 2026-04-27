import { Permissions } from "@/common/decorators/permissions.decorator";
import { AuthGuard } from "@/common/guards/auth.guard";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { Body, ClassSerializerInterceptor, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards, UseInterceptors, ValidationPipe } from "@nestjs/common";
import { ContentTypesService } from "./content-type.service";
import { CreateContentTypeDto } from "./dtos/create-content-type.dto";
import { FilterContentTypeDto } from "./dtos/filter-content-type.dto";
import { UpdateContentTypeDto } from "./dtos/update-content-type.dto";

@Controller('api/v1/content-types')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, AuthGuard)
export class ContentTypesController {
  constructor(private readonly contentTypesService: ContentTypesService) {}

  @Get()
  @Permissions('content-types:view')
  async findAll(@Query(new ValidationPipe({ transform: true })) query: FilterContentTypeDto) {
    return await this.contentTypesService.findAll(query);
  }

  @Get('slug/:slug')
  @Permissions('content-types:view')
  async findBySlug(@Param('slug') slug: string) {
    return await this.contentTypesService.findBySlug(slug);
  }

  @Get(':id/versions')
  @Permissions('content-types:view')
  async findVersions(@Param('id') id: string) {
    return await this.contentTypesService.findVersions(id);
  }

  @Post(':id/versions/:version/restore')
  @Permissions('content-types:edit')
  async restoreVersion(@Param('id') id: string, @Param('version') version: string) {
    return await this.contentTypesService.restoreVersion(id, Number(version));
  }

  @Get(':id')
  @Permissions('content-types:view')
  async findById(@Param('id') id: string) {
    return await this.contentTypesService.findById(id);
  }

  @Post()
  @Permissions('content-types:create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(ValidationPipe) dto: CreateContentTypeDto) {
    return await this.contentTypesService.create(dto);
  }

  @Put(':id')
  @Permissions('content-types:edit')
  async update(@Param('id') id: string, @Body(ValidationPipe) dto: UpdateContentTypeDto) {
    return await this.contentTypesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('content-types:delete')
  async delete(@Param('id') id: string, @Query('mode') mode?: string) {
    if (mode === 'hard') {
      return await this.contentTypesService.hardDelete(id);
    }
    return await this.contentTypesService.delete(id);
  }

  @Post(':id/restore')
  @Permissions('content-types:edit')
  async restore(@Param('id') id: string) {
    return await this.contentTypesService.restore(id);
  }
}
