import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateMediaDto {
  @IsOptional()
  @IsString({ message: 'El nombre original debe ser una cadena de texto' })
  @MaxLength(255, { message: 'El nombre original no puede exceder 255 caracteres' })
  originalName?: string;
}
