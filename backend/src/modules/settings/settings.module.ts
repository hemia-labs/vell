import { DatabaseModule } from "@/database/database.module";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Setting } from "./entities/setting.entity";
import { PublicSettingsController, SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Setting])],
  controllers: [PublicSettingsController, SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
