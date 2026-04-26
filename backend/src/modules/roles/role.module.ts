import { DatabaseModule } from "@/database/database.module";
import { Module } from "@nestjs/common";
import { RolesService } from "./role.service";
import { RolesController } from "./roles.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Role } from "./entities/role.entity";
import { PermissionsModule } from "../permissions/permission.module";

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Role]), PermissionsModule],
  controllers: [RolesController],
  providers: [
    RolesService,
  ],
  exports: [RolesService]
})
export class RolesModule {}
