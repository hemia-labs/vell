import { DatabaseModule } from "@/database/database.module";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContentFieldValue } from "../contents/entities/content-field-value.entity";
import { ContentMedia } from "../contents/entities/content-media.entity";
import { Content } from "../contents/entities/content.entity";
import { FileUploadModule } from "../file-upload/file-upload.module";
import { Media } from "./entities/media.entity";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";

@Module({
  imports: [DatabaseModule, FileUploadModule, TypeOrmModule.forFeature([Media, Content, ContentMedia, ContentFieldValue])],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
