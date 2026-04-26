import { CreateCategoryDto } from "../dtos/create-category.dto";
import { CategoryDto } from "../dtos/category.dto";
import { UpdateCategoryDto } from "../dtos/update-category.dto";
import { Category } from "../entities/category.entity";

export class CategoryMapper {
  static toDTO(category: Category): CategoryDto {
    const dto = new CategoryDto();
    dto.id = category.id;
    dto.name = category.name;
    dto.slug = category.slug;
    dto.description = category.description;
    dto.parentId = category.parentId;
    dto.createdAt = category.createdAt;
    dto.updatedAt = category.updatedAt;

    if (category.parent) {
      dto.parent = {
        id: category.parent.id,
        name: category.parent.name,
        slug: category.parent.slug,
      };
    }

    if (category.children) {
      dto.children = category.children.map(child => this.toDTO(child));
    }

    return dto;
  }

  static toTreeDTO(category: Category): CategoryDto {
    const dto = this.toDTO(category);
    dto.children = (category.children ?? []).map(child => this.toTreeDTO(child));
    return dto;
  }

  static toEntity(categoryDto: CreateCategoryDto): Partial<Category> {
    const category = new Category();
    category.name = categoryDto.name;
    category.slug = categoryDto.slug;
    category.description = categoryDto.description ?? null;
    category.parentId = categoryDto.parentId ?? null;
    return category;
  }

  static toUpdateEntity(categoryDto: UpdateCategoryDto): Partial<Category> {
    const category: Partial<Category> = {};
    if (categoryDto.name !== undefined) category.name = categoryDto.name;
    if (categoryDto.slug !== undefined) category.slug = categoryDto.slug;
    if (categoryDto.description !== undefined) category.description = categoryDto.description;
    if (categoryDto.parentId !== undefined) category.parentId = categoryDto.parentId;
    return category;
  }
}
