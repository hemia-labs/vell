import { DatabaseModule } from "@/database/database.module";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Tag } from "./entities/tag.entity";
import { TagsController } from "./tag.controller";
import { TagsService } from "./tag.service";

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Tag])],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
