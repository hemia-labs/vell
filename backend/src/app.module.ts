import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envVarsSchema } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { RolesModule } from './modules/roles/role.module';
import { UsersModule } from './modules/users/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/category.module';
import { TagsModule } from './modules/tags/tag.module';
import { ContentTypesModule } from './modules/content-types/content-type.module';
import { ContentsModule } from './modules/contents/content.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { MediaModule } from './modules/media/media.module';
import { AuditLogModule } from './modules/audit-logs/audit-log.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      validationSchema: envVarsSchema,
      validationOptions: { 
        allowUnknown: true,
        abortEarly: true 
      },
    }),
    DatabaseModule,
    AuthModule,
    RolesModule,
    UsersModule,
    CategoriesModule,
    TagsModule,
    ContentTypesModule,
    ContentsModule,
    MediaModule,
    FileUploadModule,
    AuditLogModule,
    SettingsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
