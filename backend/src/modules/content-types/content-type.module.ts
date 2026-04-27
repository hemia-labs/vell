import { DatabaseModule } from "@/database/database.module";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContentFieldValue } from "../contents/entities/content-field-value.entity";
import { Content } from "../contents/entities/content.entity";
import { ContentTypeField } from "./entities/content-type-field.entity";
import { ContentTypeVersion } from "./entities/content-type-version.entity";
import { ContentType } from "./entities/content-type.entity";
import { ContentTypesController } from "./content-type.controller";
import { ContentTypeVersionsService } from "./content-type-version.service";
import { ContentTypesService } from "./content-type.service";

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([ContentType, ContentTypeField, ContentTypeVersion, Content, ContentFieldValue])],
  controllers: [ContentTypesController],
  providers: [ContentTypesService, ContentTypeVersionsService],
  exports: [ContentTypesService, ContentTypeVersionsService],
})
export class ContentTypesModule {}
