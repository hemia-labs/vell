import { DatabaseModule } from "@/database/database.module";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoriesController } from "./category.controller";
import { CategoriesService } from "./category.service";
import { Category } from "./entities/category.entity";

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
