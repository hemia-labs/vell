import { IsString, MaxLength } from "class-validator";

export class CreateTagDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @IsString({ message: 'El slug debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El slug no puede exceder 100 caracteres' })
  slug: string;
}
