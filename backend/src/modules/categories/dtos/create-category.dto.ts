import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateCategoryDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @IsString({ message: 'El slug debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El slug no puede exceder 100 caracteres' })
  slug: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  description?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El parentId debe ser un UUID válido' })
  parentId?: string | null;
}
