import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { SettingGroup } from "../entities/setting.entity";

export class FilterSettingDto {
  @IsOptional()
  @IsEnum(SettingGroup, { message: 'El grupo no es válido' })
  group?: SettingGroup;

  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser texto' })
  @MaxLength(100, { message: 'La búsqueda no puede exceder 100 caracteres' })
  search?: string;
}
