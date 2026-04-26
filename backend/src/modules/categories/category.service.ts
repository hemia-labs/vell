import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, Not, Repository } from "typeorm";
import { CategoryDto } from "./dtos/category.dto";
import { CreateCategoryDto } from "./dtos/create-category.dto";
import { FilterCategoryDto } from "./dtos/filter-category.dto";
import { UpdateCategoryDto } from "./dtos/update-category.dto";
import { Category } from "./entities/category.entity";
import { CategoryMapper } from "./mappers/category.mapper";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private repository: Repository<Category>,
  ) {}

  async findAll(params: FilterCategoryDto = {}): Promise<CategoryDto[]> {
    const categoriesQuery = this.repository.createQueryBuilder('category');
    const page = Number(params.page);
    const limit = Number(params.limit);

    if (params.withParent === true) {
      categoriesQuery.leftJoinAndSelect('category.parent', 'parent');
    }

    if (params.withChildren === true) {
      categoriesQuery.leftJoinAndSelect('category.children', 'children');
    }

    if (params.search) {
      categoriesQuery.andWhere('(category.name ILIKE :search OR category.slug ILIKE :search)', {
        search: `%${params.search}%`,
      });
    }

    if (params.parentId !== undefined) {
      if (params.parentId === null) {
        categoriesQuery.andWhere('category.parentId IS NULL');
      } else {
        categoriesQuery.andWhere('category.parentId = :parentId', { parentId: params.parentId });
      }
    }

    if (Number.isInteger(page) && Number.isInteger(limit) && page > 0 && limit > 0) {
      categoriesQuery.skip((page - 1) * limit).take(limit);
    }

    const categories = await categoriesQuery
      .orderBy('category.name', 'ASC')
      .getMany();

    return categories.map(category => CategoryMapper.toDTO(category));
  }

  async findById(id: string): Promise<CategoryDto> {
    const category = await this.repository.findOne({
      where: { id },
      relations: ['parent', 'children', 'children.children'],
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return CategoryMapper.toTreeDTO(category);
  }

  async findBySlug(slug: string): Promise<CategoryDto> {
    const category = await this.repository.findOne({
      where: { slug },
      relations: ['parent', 'children', 'children.children'],
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return CategoryMapper.toTreeDTO(category);
  }

  async findChildren(id: string): Promise<CategoryDto[]> {
    await this.ensureExists(id);
    const children = await this.repository.find({
      where: { parentId: id },
      relations: ['children'],
      order: { name: 'ASC' },
    });
    return children.map(category => CategoryMapper.toDTO(category));
  }

  async create(dto: CreateCategoryDto): Promise<CategoryDto> {
    await this.ensureSlugAvailable(dto.slug);

    if (dto.parentId) {
      await this.ensureExists(dto.parentId);
    }

    const entity = CategoryMapper.toEntity(dto);
    const savedCategory = await this.repository.save(entity);
    return this.findById(savedCategory.id);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryDto> {
    const category = await this.ensureExists(id);

    if (dto.slug !== undefined) {
      await this.ensureSlugAvailable(dto.slug, id);
    }

    if (dto.parentId !== undefined) {
      await this.validateParent(id, dto.parentId);
    }

    const updatedCategory = this.repository.merge(category, CategoryMapper.toUpdateEntity(dto));
    const savedCategory = await this.repository.save(updatedCategory);
    return this.findById(savedCategory.id);
  }

  async delete(id: string): Promise<void> {
    await this.ensureExists(id);
    const ids = await this.getCategoryBranchIds(id);
    await this.repository.update({ id: In(ids) }, { deletedAt: new Date() });
  }

  async hardDelete(id: string): Promise<void> {
    await this.ensureExists(id, true);
    const ids = await this.getCategoryBranchIds(id, true);
    await this.repository.delete(ids);
  }

  async restore(id: string): Promise<void> {
    await this.ensureExists(id, true);
    await this.repository.update(id, { deletedAt: null });
  }

  private async ensureExists(id: string, withDeleted = false): Promise<Category> {
    const category = await this.repository.findOne({ where: { id }, withDeleted });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  private async ensureSlugAvailable(slug: string, currentId?: string): Promise<void> {
    const where = currentId ? { slug, id: Not(currentId) } : { slug };
    const category = await this.repository.findOne({ where });
    if (category) {
      throw new ConflictException(`El slug "${slug}" ya está registrado`);
    }
  }

  private async validateParent(categoryId: string, parentId: string | null): Promise<void> {
    if (parentId === null) {
      return;
    }

    if (categoryId === parentId) {
      throw new BadRequestException('Una categoría no puede ser su propio padre');
    }

    await this.ensureExists(parentId);
    const descendants = await this.findDescendantIds(categoryId);
    if (descendants.has(parentId)) {
      throw new BadRequestException('Una categoría no puede moverse dentro de sus descendientes');
    }
  }

  private async findDescendantIds(categoryId: string, withDeleted = false): Promise<Set<string>> {
    const categories = await this.repository.find({
      select: ['id', 'parentId'],
      where: { parentId: Not(IsNull()) },
      withDeleted,
    });
    const childrenByParent = new Map<string, string[]>();

    for (const category of categories) {
      if (!category.parentId) {
        continue;
      }
      const children = childrenByParent.get(category.parentId) ?? [];
      children.push(category.id);
      childrenByParent.set(category.parentId, children);
    }

    const descendants = new Set<string>();
    const pending = [...(childrenByParent.get(categoryId) ?? [])];

    while (pending.length > 0) {
      const childId = pending.pop();
      if (!childId || descendants.has(childId)) {
        continue;
      }
      descendants.add(childId);
      pending.push(...(childrenByParent.get(childId) ?? []));
    }

    return descendants;
  }

  private async getCategoryBranchIds(categoryId: string, withDeleted = false): Promise<string[]> {
    const descendants = await this.findDescendantIds(categoryId, withDeleted);
    return [categoryId, ...descendants];
  }

}
