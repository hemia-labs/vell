import { TagDto } from "../dtos/tag.dto";
import { CreateTagDto } from "../dtos/create-tag.dto";
import { UpdateTagDto } from "../dtos/update-tag.dto";
import { Tag } from "../entities/tag.entity";

export class TagMapper {
  static toDTO(tag: Tag): TagDto {
    const dto = new TagDto();
    dto.id = tag.id;
    dto.name = tag.name;
    dto.slug = tag.slug;
    dto.createdAt = tag.createdAt;
    dto.updatedAt = tag.updatedAt;

    if (tag.contents) {
      dto.contents = tag.contents.map(content => ({
        id: content.id,
        title: content.title,
        slug: content.slug,
      }));
    }

    return dto;
  }

  static toEntity(tagDto: CreateTagDto): Partial<Tag> {
    const tag = new Tag();
    tag.name = tagDto.name;
    tag.slug = tagDto.slug;
    return tag;
  }

  static toUpdateEntity(tagDto: UpdateTagDto): Partial<Tag> {
    const tag: Partial<Tag> = {};
    if (tagDto.name !== undefined) tag.name = tagDto.name;
    if (tagDto.slug !== undefined) tag.slug = tagDto.slug;
    return tag;
  }
}
