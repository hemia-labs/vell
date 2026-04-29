import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentMedia } from '../contents/entities/content-media.entity';
import { Media } from '../media/entities/media.entity';
import { s3ClientFactory } from './s3-client.factory';
import { FileUploadController } from './file-upload.controller';
import { FileUploadService } from './file-upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([Media, ContentMedia])],
  controllers: [FileUploadController],
  providers: [s3ClientFactory, FileUploadService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
