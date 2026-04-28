import { IsOptional, IsString, IsUUID } from "class-validator";

export class ContentFieldValueInputDto {
  @IsOptional()
  @IsUUID('4', { message: 'El fieldId debe ser un UUID válido' })
  fieldId?: string;

  @IsOptional()
  @IsString({ message: 'El fieldKey debe ser una cadena de texto' })
  fieldKey?: string;

  value: unknown;
}
