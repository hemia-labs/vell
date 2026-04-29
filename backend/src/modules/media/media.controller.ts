import { Permissions } from "@/common/decorators/permissions.decorator";
import { AuthGuard } from "@/common/guards/auth.guard";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { Body, ClassSerializerInterceptor, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards, UseInterceptors, ValidationPipe } from "@nestjs/common";
import { FilterMediaDto } from "./dtos/filter-media.dto";
import { UpdateMediaDto } from "./dtos/update-media.dto";
import { MediaService } from "./media.service";

@Controller('api/v1/media')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, AuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @Permissions('media:view')
  async findAll(@Query(new ValidationPipe({ transform: true })) query: FilterMediaDto) {
    return await this.mediaService.findAll(query);
  }

  @Get(':id')
  @Permissions('media:view')
  async findById(@Param('id') id: string) {
    return await this.mediaService.findById(id);
  }

  @Get(':id/preview-url')
  @Permissions('media:view')
  async getPreviewUrl(@Param('id') id: string) {
    return await this.mediaService.getPreviewUrl(id);
  }

  @Get(':id/references')
  @Permissions('media:view')
  async getReferences(@Param('id') id: string) {
    return await this.mediaService.getReferences(id);
  }

  @Patch(':id')
  @Permissions('media:edit')
  async update(@Param('id') id: string, @Body(ValidationPipe) dto: UpdateMediaDto) {
    return await this.mediaService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('media:delete')
  async delete(@Param('id') id: string, @Query('mode') mode?: string) {
    if (mode === 'hard') {
      await this.mediaService.hardDelete(id);
      return;
    }
    await this.mediaService.delete(id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('media:restore')
  async restore(@Param('id') id: string) {
    await this.mediaService.restore(id);
  }
}
