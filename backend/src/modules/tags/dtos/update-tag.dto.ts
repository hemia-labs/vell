import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateTagDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'El slug debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El slug no puede exceder 100 caracteres' })
  slug?: string;
}
