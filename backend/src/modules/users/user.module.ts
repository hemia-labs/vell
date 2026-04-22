import { Module } from "@nestjs/common";
import { UsersController } from "./user.controller";
import { UsersService } from "./user.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { DatabaseModule } from "@/database/database.module";

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    UsersService,
  ],
  exports: [UsersService]
})
export class UsersModule {}