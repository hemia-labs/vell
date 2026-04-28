import { DatabaseModule } from "@/database/database.module";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Media } from "./entities/media.entity";
import { MediaService } from "./media.service";

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Media])],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
