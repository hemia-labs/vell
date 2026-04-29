import { IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { FieldType } from "../entities/field-type.enum";

export class CreateContentTypeFieldDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @IsString({ message: 'El fieldKey debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El fieldKey no puede exceder 100 caracteres' })
  fieldKey: string;

  @IsEnum(FieldType, { message: 'El fieldType no es válido' })
  fieldType: FieldType;

  @IsOptional()
  @IsBoolean({ message: 'isRequired debe ser booleano' })
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'multiple debe ser booleano' })
  multiple?: boolean;

  @IsOptional()
  @IsObject({ message: 'meta debe ser un objeto JSON' })
  meta?: Record<string, unknown>;

  @IsOptional()
  @IsInt({ message: 'El order debe ser un número entero' })
  @Min(0, { message: 'El order mínimo es 0' })
  order?: number;
}
