import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import { CreateContentTypeFieldDto } from "./create-content-type-field.dto";

export class CreateContentTypeDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @IsString({ message: 'El slug debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El slug no puede exceder 100 caracteres' })
  slug: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  description?: string | null;

  @IsOptional()
  @IsArray({ message: 'fields debe ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => CreateContentTypeFieldDto)
  fields?: CreateContentTypeFieldDto[];
}
