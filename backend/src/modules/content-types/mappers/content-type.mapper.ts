import { ContentTypeDto } from "../dtos/content-type.dto";
import { CreateContentTypeDto } from "../dtos/create-content-type.dto";
import { UpdateContentTypeDto } from "../dtos/update-content-type.dto";
import { ContentType } from "../entities/content-type.entity";
import { ContentTypeField } from "../entities/content-type-field.entity";

export class ContentTypeMapper {
  static toDTO(contentType: ContentType): ContentTypeDto {
    const dto = new ContentTypeDto();
    dto.id = contentType.id;
    dto.name = contentType.name;
    dto.slug = contentType.slug;
    dto.description = contentType.description;
    dto.version = contentType.version;
    dto.createdAt = contentType.createdAt;
    dto.updatedAt = contentType.updatedAt;

    if (contentType.fields) {
      dto.fields = [...contentType.fields]
        .sort((a, b) => a.order - b.order)
        .map(field => ({
          id: field.id,
          contentTypeId: field.contentTypeId,
          name: field.name,
          fieldKey: field.fieldKey,
          fieldType: field.fieldType,
          isRequired: field.isRequired,
          meta: field.meta ?? {},
          order: field.order,
          createdAt: field.createdAt,
          updatedAt: field.updatedAt,
        }));
    }

    return dto;
  }

  static toEntity(contentTypeDto: CreateContentTypeDto): Partial<ContentType> {
    const contentType = new ContentType();
    contentType.name = contentTypeDto.name;
    contentType.slug = contentTypeDto.slug;
    contentType.description = contentTypeDto.description ?? null;
    contentType.version = 1;
    contentType.fields = (contentTypeDto.fields ?? []).map((fieldDto, index) => {
      const field = new ContentTypeField();
      field.name = fieldDto.name;
      field.fieldKey = fieldDto.fieldKey;
      field.fieldType = fieldDto.fieldType;
      field.isRequired = fieldDto.isRequired ?? false;
      field.meta = fieldDto.meta ?? {};
      field.order = fieldDto.order ?? index;
      return field;
    });
    return contentType;
  }

  static toUpdateEntity(contentTypeDto: UpdateContentTypeDto): Partial<ContentType> {
    const contentType: Partial<ContentType> = {};
    if (contentTypeDto.name !== undefined) contentType.name = contentTypeDto.name;
    if (contentTypeDto.slug !== undefined) contentType.slug = contentTypeDto.slug;
    if (contentTypeDto.description !== undefined) contentType.description = contentTypeDto.description;
    return contentType;
  }
}
