import { Permissions } from "@/common/decorators/permissions.decorator";
import { AuthGuard } from "@/common/guards/auth.guard";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { Body, ClassSerializerInterceptor, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req, UnauthorizedException, UseGuards, UseInterceptors, ValidationPipe } from "@nestjs/common";
import { Request } from "express";
import { ContentsService } from "./content.service";
import { CreateContentDto } from "./dtos/create-content.dto";
import { FilterContentDto } from "./dtos/filter-content.dto";
import { UpdateContentDto } from "./dtos/update-content.dto";

@Controller('api/v1/contents')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, AuthGuard)
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Get()
  @Permissions('content:view')
  async findAll(@Query(new ValidationPipe({ transform: true })) query: FilterContentDto) {
    return this.contentsService.findAll(query);
  }

  @Get('slug/:contentTypeId/:slug')
  @Permissions('content:view')
  async findBySlug(@Param('contentTypeId') contentTypeId: string, @Param('slug') slug: string) {
    return this.contentsService.findBySlug(contentTypeId, slug);
  }

  @Get(':id/versions')
  @Permissions('content:versions:view')
  async findVersions(@Param('id') id: string) {
    return this.contentsService.findVersions(id);
  }

  @Get(':id')
  @Permissions('content:view')
  async findById(@Param('id') id: string) {
    return this.contentsService.findById(id);
  }

  @Post()
  @Permissions('content:create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body(ValidationPipe) dto: CreateContentDto, @Req() request: Request) {
    return this.contentsService.create(dto, this.getUserId(request));
  }

  @Put(':id')
  @Permissions('content:edit')
  async update(@Param('id') id: string, @Body(ValidationPipe) dto: UpdateContentDto, @Req() request: Request) {
    return this.contentsService.update(id, dto, this.getUserId(request));
  }

  @Delete(':id')
  @Permissions('content:delete')
  async delete(@Param('id') id: string, @Query('mode') mode?: string) {
    if (mode === 'hard') {
      return this.contentsService.hardDelete(id);
    }
    return this.contentsService.delete(id);
  }

  @Post(':id/restore')
  @Permissions('content:restore')
  async restore(@Param('id') id: string) {
    return this.contentsService.restore(id);
  }

  private getUserId(request: Request): string {
    const userId = request.user?.userId ?? request.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return userId;
  }
}
