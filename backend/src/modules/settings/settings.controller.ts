import { Permissions } from "@/common/decorators/permissions.decorator";
import { AuthGuard } from "@/common/guards/auth.guard";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { Body, ClassSerializerInterceptor, Controller, Get, Param, Patch, Query, UseGuards, UseInterceptors, ValidationPipe } from "@nestjs/common";
import { FilterSettingDto } from "./dtos/filter-setting.dto";
import { UpdateSettingDto } from "./dtos/update-setting.dto";
import { SettingGroup } from "./entities/setting.entity";
import { SettingsService } from "./settings.service";

@Controller('api/v1/settings/public')
export class PublicSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async findPublic() {
    return await this.settingsService.findPublic();
  }
}

@Controller('api/v1/settings')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, AuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Permissions('settings:view')
  async findAll(@Query(new ValidationPipe({ transform: true })) query: FilterSettingDto) {
    return await this.settingsService.findAll(query);
  }

  @Get('group/:group')
  @Permissions('settings:view')
  async findByGroup(@Param('group') group: SettingGroup) {
    return await this.settingsService.findByGroup(group);
  }

  @Get(':key')
  @Permissions('settings:view')
  async findByKey(@Param('key') key: string) {
    return await this.settingsService.findByKey(key);
  }

  @Patch(':key')
  @Permissions('settings:edit')
  async update(@Param('key') key: string, @Body(ValidationPipe) dto: UpdateSettingDto) {
    return await this.settingsService.update(key, dto);
  }
}
