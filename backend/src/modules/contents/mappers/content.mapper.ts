import { ContentDto } from "../dtos/content.dto";
import { Content } from "../entities/content.entity";

export class ContentMapper {
  static toDTO(content: Content): ContentDto {
    const dto = new ContentDto();
    dto.id = content.id;
    dto.title = content.title;
    dto.slug = content.slug;
    dto.body = content.body;
    dto.seo = content.seo ?? {};
    dto.config = content.config ?? {};
    dto.excerpt = content.excerpt;
    dto.status = content.status;
    dto.contentTypeId = content.contentTypeId;
    dto.contentTypeVersion = content.contentTypeVersion;
    dto.categoryId = content.categoryId;
    dto.authorId = content.authorId;
    dto.coverImageId = content.coverImageId;
    dto.metaTitle = content.metaTitle;
    dto.metaDescription = content.metaDescription;
    dto.publishedAt = content.publishedAt;
    dto.createdAt = content.createdAt;
    dto.updatedAt = content.updatedAt;

    if (content.tags) {
      dto.tagIds = content.tags.map(tag => tag.id);
    }

    if (content.fieldValues) {
      dto.fieldValues = content.fieldValues.map(fieldValue => ({
        id: fieldValue.id,
        fieldId: fieldValue.fieldId,
        fieldKey: fieldValue.fieldKey,
        fieldType: fieldValue.fieldType,
        contentTypeVersion: fieldValue.contentTypeVersion,
        value: fieldValue.value,
      }));
    }

    if (content.mediaItems) {
      dto.mediaItems = content.mediaItems.map(mediaItem => ({
        id: mediaItem.id,
        mediaId: mediaItem.mediaId,
        role: mediaItem.role,
        order: mediaItem.order,
        meta: mediaItem.meta ?? {},
      }));
    }

    return dto;
  }
}
