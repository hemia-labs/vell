import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, Not, Repository } from "typeorm";
import { CreateTagDto } from "./dtos/create-tag.dto";
import { FilterTagDto } from "./dtos/filter-tag.dto";
import { TagDto } from "./dtos/tag.dto";
import { UpdateTagDto } from "./dtos/update-tag.dto";
import { Tag } from "./entities/tag.entity";
import { TagMapper } from "./mappers/tag.mapper";

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private repository: Repository<Tag>,
  ) {}

  async findAll(params: FilterTagDto = {}): Promise<TagDto[]> {
    const tagsQuery = this.repository.createQueryBuilder('tag');
    const page = Number(params.page);
    const limit = Number(params.limit);

    if (params.withContents === true) {
      tagsQuery.leftJoinAndSelect('tag.contents', 'content');
    }

    if (params.search) {
      tagsQuery.andWhere('(tag.name ILIKE :search OR tag.slug ILIKE :search)', {
        search: `%${params.search}%`,
      });
    }

    if (Number.isInteger(page) && Number.isInteger(limit) && page > 0 && limit > 0) {
      tagsQuery.skip((page - 1) * limit).take(limit);
    }

    const tags = await tagsQuery
      .orderBy('tag.name', 'ASC')
      .getMany();

    return tags.map(tag => TagMapper.toDTO(tag));
  }

  async findById(id: string): Promise<TagDto> {
    const tag = await this.repository.findOne({ where: { id }, relations: ['contents'] });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    return TagMapper.toDTO(tag);
  }

  async findBySlug(slug: string): Promise<TagDto> {
    const tag = await this.repository.findOne({ where: { slug }, relations: ['contents'] });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    return TagMapper.toDTO(tag);
  }

  async create(dto: CreateTagDto): Promise<TagDto> {
    await this.ensureNameAvailable(dto.name);
    await this.ensureSlugAvailable(dto.slug);

    const entity = TagMapper.toEntity(dto);
    const savedTag = await this.repository.save(entity);
    return TagMapper.toDTO(savedTag);
  }

  async update(id: string, dto: UpdateTagDto): Promise<TagDto> {
    const tag = await this.ensureExists(id);

    if (dto.name !== undefined) {
      await this.ensureNameAvailable(dto.name, id);
    }

    if (dto.slug !== undefined) {
      await this.ensureSlugAvailable(dto.slug, id);
    }

    const updatedTag = this.repository.merge(tag, TagMapper.toUpdateEntity(dto));
    const savedTag = await this.repository.save(updatedTag);
    return TagMapper.toDTO(savedTag);
  }

  async delete(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.repository.update(id, { deletedAt: new Date() });
  }

  async hardDelete(id: string): Promise<void> {
    const tag = await this.repository.findOne({
      where: { id },
      relations: ['contents'],
      withDeleted: true,
    });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    const contentIds = (tag.contents ?? []).map(content => content.id);
    if (contentIds.length > 0) {
      await this.repository
        .createQueryBuilder()
        .relation(Tag, 'contents')
        .of(id)
        .remove(contentIds);
    }

    await this.repository.delete(id);
  }

  async restore(id: string): Promise<void> {
    const tag = await this.ensureExists(id, true);
    await this.ensureNameAvailable(tag.name, id);
    await this.ensureSlugAvailable(tag.slug, id);
    await this.repository.update(id, { deletedAt: null });
  }

  async ensureExistByIds(ids: string[]): Promise<void> {
    const tags = await this.repository.findBy({ id: In(ids) });
    const foundIds = new Set(tags.map(tag => tag.id));
    const missingIds = ids.filter(id => !foundIds.has(id));

    if (missingIds.length > 0) {
      throw new NotFoundException(`No existen los siguientes tags: ${missingIds.join(', ')}`);
    }
  }

  async findByIds(ids: string[], manager?: EntityManager): Promise<Tag[]> {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) {
      return [];
    }

    const repository = manager?.getRepository(Tag) ?? this.repository;
    const tags = await repository.findBy({ id: In(uniqueIds) });
    const foundIds = new Set(tags.map(tag => tag.id));
    const missingIds = uniqueIds.filter(id => !foundIds.has(id));

    if (missingIds.length > 0) {
      throw new NotFoundException(`No existen los siguientes tags: ${missingIds.join(', ')}`);
    }

    return tags;
  }

  private async ensureExists(id: string, withDeleted = false): Promise<Tag> {
    const tag = await this.repository.findOne({ where: { id }, withDeleted });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    return tag;
  }

  private async ensureNameAvailable(name: string, currentId?: string): Promise<void> {
    const where = currentId ? { name, id: Not(currentId) } : { name };
    const tag = await this.repository.findOne({ where });
    if (tag) {
      throw new ConflictException(`El nombre "${name}" ya está registrado`);
    }
  }

  private async ensureSlugAvailable(slug: string, currentId?: string): Promise<void> {
    const where = currentId ? { slug, id: Not(currentId) } : { slug };
    const tag = await this.repository.findOne({ where });
    if (tag) {
      throw new ConflictException(`El slug "${slug}" ya está registrado`);
    }
  }
}
