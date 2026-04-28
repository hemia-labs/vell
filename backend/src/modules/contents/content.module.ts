import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DatabaseModule } from "@/database/database.module";
import { CategoriesModule } from "../categories/category.module";
import { ContentTypesModule } from "../content-types/content-type.module";
import { MediaModule } from "../media/media.module";
import { TagsModule } from "../tags/tag.module";
import { ContentFieldValue } from "./entities/content-field-value.entity";
import { ContentMedia } from "./entities/content-media.entity";
import { ContentVersion } from "./entities/content-version.entity";
import { Content } from "./entities/content.entity";
import { ContentFieldValueService } from "./content-field-value.service";
import { ContentMediaService } from "./content-media.service";
import { ContentsController } from "./content.controller";
import { ContentsService } from "./content.service";
import { ContentVersionService } from "./content-version.service";

@Module({
  imports: [
    DatabaseModule,
    CategoriesModule,
    ContentTypesModule,
    TagsModule,
    MediaModule,
    TypeOrmModule.forFeature([
      Content,
      ContentFieldValue,
      ContentMedia,
      ContentVersion,
    ]),
  ],
  controllers: [ContentsController],
  providers: [
    ContentsService,
    ContentFieldValueService,
    ContentMediaService,
    ContentVersionService,
  ],
  exports: [
    ContentsService,
    ContentFieldValueService,
    ContentMediaService,
    ContentVersionService,
  ],
})
export class ContentsModule {}
