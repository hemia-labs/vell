import { SettingGroup, SettingType } from "../entities/setting.entity";

export class SettingDto {
  id: string;
  key: string;
  value: unknown;
  type: SettingType;
  group: SettingGroup;
  description?: string | null;
  isPublic: boolean;
  isReadonly: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PublicSettingDto {
  key: string;
  value: unknown;
  type: SettingType;
  group: SettingGroup;
}
