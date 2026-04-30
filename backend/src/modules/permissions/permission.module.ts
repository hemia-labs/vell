import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Permission } from "./entities/permission.entity";
import { PermissionsService } from "./permission.service";
import { PermissionsController } from "./permission.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Permission])],
    controllers: [PermissionsController],
    providers: [PermissionsService],
    exports: [PermissionsService],
})
export class PermissionsModule {}
