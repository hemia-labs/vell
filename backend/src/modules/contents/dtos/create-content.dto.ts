import { Type } from "class-transformer";
import { IsArray, IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from "class-validator";
import { ContentStatus } from "../entities/content.entity";
import { ContentFieldValueInputDto } from "./content-field-value-input.dto";
import { ContentMediaInputDto } from "./content-media-input.dto";

export class CreateContentDto {
  @IsString({ message: 'El título debe ser una cadena de texto' })
  @MaxLength(255, { message: 'El título no puede exceder 255 caracteres' })
  title: string;

  @IsString({ message: 'El slug debe ser una cadena de texto' })
  @MaxLength(255, { message: 'El slug no puede exceder 255 caracteres' })
  slug: string;

  @IsUUID('4', { message: 'El contentTypeId debe ser un UUID válido' })
  contentTypeId: string;

  @IsOptional()
  @IsUUID('4', { message: 'El categoryId debe ser un UUID válido' })
  categoryId?: string | null;

  @IsOptional()
  @IsObject({ message: 'El body debe ser un objeto' })
  body?: Record<string, unknown> | null;

  @IsOptional()
  @IsObject({ message: 'El SEO debe ser un objeto' })
  seo?: Record<string, unknown>;

  @IsOptional()
  @IsObject({ message: 'La configuración debe ser un objeto' })
  config?: Record<string, unknown>;

  @IsOptional()
  @IsString({ message: 'El extracto debe ser una cadena de texto' })
  excerpt?: string | null;

  @IsOptional()
  @IsEnum(ContentStatus, { message: 'El status no es válido' })
  status?: ContentStatus;

  @IsOptional()
  @IsUUID('4', { message: 'El coverImageId debe ser un UUID válido' })
  coverImageId?: string | null;

  @IsOptional()
  @IsString({ message: 'El metaTitle debe ser una cadena de texto' })
  @MaxLength(255, { message: 'El metaTitle no puede exceder 255 caracteres' })
  metaTitle?: string | null;

  @IsOptional()
  @IsString({ message: 'El metaDescription debe ser una cadena de texto' })
  metaDescription?: string | null;

  @IsOptional()
  publishedAt?: Date | string | null;

  @IsOptional()
  @IsArray({ message: 'tagIds debe ser un arreglo' })
  @IsUUID('4', { each: true, message: 'Cada tagId debe ser un UUID válido' })
  tagIds?: string[];

  @IsOptional()
  @IsArray({ message: 'fieldValues debe ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => ContentFieldValueInputDto)
  fieldValues?: ContentFieldValueInputDto[];

  @IsOptional()
  @IsArray({ message: 'mediaItems debe ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => ContentMediaInputDto)
  mediaItems?: ContentMediaInputDto[];
}
