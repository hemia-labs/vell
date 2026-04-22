import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envVarsSchema } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { RolesModule } from './modules/roles/role.module';
import { UsersModule } from './modules/users/user.module';
import { AuthModule } from './modules/auth/auth.module';

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
    UsersModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
