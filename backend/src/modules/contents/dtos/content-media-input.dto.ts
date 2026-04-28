import { IsEnum, IsInt, IsObject, IsOptional, IsUUID, Min } from "class-validator";
import { ContentMediaRole } from "../entities/content-media.entity";

export class ContentMediaInputDto {
  @IsUUID('4', { message: 'El mediaId debe ser un UUID válido' })
  mediaId: string;

  @IsOptional()
  @IsEnum(ContentMediaRole, { message: 'El rol de media no es válido' })
  role?: ContentMediaRole;

  @IsOptional()
  @IsInt({ message: 'El orden debe ser entero' })
  @Min(0, { message: 'El orden mínimo es 0' })
  order?: number;

  @IsOptional()
  @IsObject({ message: 'La metadata debe ser un objeto' })
  meta?: Record<string, unknown>;
}
