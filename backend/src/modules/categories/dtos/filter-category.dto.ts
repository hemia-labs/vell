import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class FilterCategoryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'null' ? null : value)
  @IsUUID('4', { message: 'El parentId debe ser un UUID válido' })
  parentId?: string | null;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  withParent?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  withChildren?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  limit?: number;
}
