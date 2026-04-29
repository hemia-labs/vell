import { AuthGuard } from '@/common/guards/auth.guard';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Permissions } from '@/common/decorators/permissions.decorator';
import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Body,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { MulterFile } from '@/types/express';
import { Request } from 'express';
import { FileUploadService } from './file-upload.service';
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_FILE_SIZE_BYTES, type UploadScope } from './file-upload.constants';

const uploadOptions = {
  limits: { fileSize: MAX_UPLOAD_FILE_SIZE_BYTES },
  fileFilter: (_req: Request, file: MulterFile, callback: (error: Error | null, acceptFile: boolean) => void) => {
    if (!ALLOWED_UPLOAD_MIME_TYPES.test(file.mimetype)) {
      callback(new BadRequestException('File type is not allowed'), false);
      return;
    }

    callback(null, true);
  },
};

@Controller('api/v1/uploads')
@UseGuards(JwtAuthGuard, AuthGuard)
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('media:upload')
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  async upload(
    @UploadedFile() file: MulterFile,
    @Body('scope') scope: UploadScope = 'library',
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.fileUploadService.uploadFile(file, req.user.userId, scope);
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('media:upload')
  @UseInterceptors(FilesInterceptor('files', 10, uploadOptions))
  async uploadBatch(
    @UploadedFiles() files: MulterFile[],
    @Body('scope') scope: UploadScope = 'library',
    @Req() req: Request,
  ) {
    if (!files?.length) {
      throw new BadRequestException('At least one file is required');
    }

    return this.fileUploadService.uploadFiles(files, req.user.userId, scope);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('media:delete')
  async delete(@Param('id') id: string) {
    await this.fileUploadService.deleteMedia(id);
  }
}
