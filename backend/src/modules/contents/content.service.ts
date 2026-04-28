import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";
import { CategoriesService } from "../categories/category.service";
import { ContentTypesService } from "../content-types/content-type.service";
import { MediaService } from "../media/media.service";
import { TagsService } from "../tags/tag.service";
import { ContentDto } from "./dtos/content.dto";
import { CreateContentDto } from "./dtos/create-content.dto";
import { FilterContentDto } from "./dtos/filter-content.dto";
import { UpdateContentDto } from "./dtos/update-content.dto";
import { Content, ContentStatus } from "./entities/content.entity";
import { ContentMapper } from "./mappers/content.mapper";
import { ContentFieldValueService } from "./content-field-value.service";
import { ContentMediaService } from "./content-media.service";
import { ContentVersionService } from "./content-version.service";

@Injectable()
export class ContentsService {
  constructor(
    @InjectRepository(Content)
    private repository: Repository<Content>,
    private contentTypesService: ContentTypesService,
    private categoriesService: CategoriesService,
    private tagsService: TagsService,
    private mediaService: MediaService,
    private fieldValueService: ContentFieldValueService,
    private contentMediaService: ContentMediaService,
    private contentVersionService: ContentVersionService,
  ) {}

  async findAll(params: FilterContentDto = {}): Promise<ContentDto[]> {
    const query = this.repository.createQueryBuilder('content');
    const page = Number(params.page);
    const limit = Number(params.limit);

    if (params.withRelations === true) {
      query
        .leftJoinAndSelect('content.contentType', 'contentType')
        .leftJoinAndSelect('content.category', 'category')
        .leftJoinAndSelect('content.tags', 'tags')
        .leftJoinAndSelect('content.fieldValues', 'fieldValues')
        .leftJoinAndSelect('content.mediaItems', 'mediaItems')
        .leftJoinAndSelect('mediaItems.media', 'media');
    }

    if (params.search) {
      query.andWhere('(content.title ILIKE :search OR content.slug ILIKE :search OR content.excerpt ILIKE :search)', {
        search: `%${params.search}%`,
      });
    }

    if (params.contentTypeId) {
      query.andWhere('content.contentTypeId = :contentTypeId', { contentTypeId: params.contentTypeId });
    }

    if (params.categoryId) {
      query.andWhere('content.categoryId = :categoryId', { categoryId: params.categoryId });
    }

    if (params.status) {
      query.andWhere('content.status = :status', { status: params.status });
    }

    if (params.tagId) {
      query.innerJoin('content.tags', 'filterTag', 'filterTag.id = :tagId', { tagId: params.tagId });
    }

    if (Number.isInteger(page) && Number.isInteger(limit) && page > 0 && limit > 0) {
      query.skip((page - 1) * limit).take(limit);
    }

    const contents = await query
      .orderBy('content.createdAt', 'DESC')
      .getMany();

    return contents.map(content => ContentMapper.toDTO(content));
  }

  async findById(id: string): Promise<ContentDto> {
    const content = await this.findEntityById(id);
    return ContentMapper.toDTO(content);
  }

  async findBySlug(contentTypeId: string, slug: string): Promise<ContentDto> {
    const content = await this.repository.findOne({
      where: { contentTypeId, slug },
      relations: ['contentType', 'category', 'tags', 'fieldValues', 'mediaItems', 'mediaItems.media'],
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return ContentMapper.toDTO(content);
  }

  async findVersions(id: string) {
    await this.ensureExists(id, true);
    return this.contentVersionService.findAll(id);
  }

  async create(dto: CreateContentDto, authorId: string): Promise<ContentDto> {
    const contentType = await this.contentTypesService.findEntityWithFields(dto.contentTypeId);
    await this.ensureSlugAvailable(dto.slug, dto.contentTypeId);
    await this.validateReferences(dto);
    this.fieldValueService.validateValues(contentType.fields ?? [], dto.fieldValues ?? []);
    await this.contentMediaService.validateMediaItems(dto.mediaItems ?? []);

    const savedContent = await this.repository.manager.transaction(async (manager) => {
      const tags = await this.tagsService.findByIds(dto.tagIds ?? [], manager);
      const content = manager.create(Content, {
        title: dto.title,
        slug: dto.slug,
        body: dto.body ?? null,
        seo: dto.seo ?? {},
        config: dto.config ?? {},
        excerpt: dto.excerpt ?? null,
        status: dto.status ?? ContentStatus.DRAFT,
        contentTypeId: dto.contentTypeId,
        contentTypeVersion: contentType.version,
        categoryId: dto.categoryId ?? null,
        authorId,
        coverImageId: dto.coverImageId ?? null,
        metaTitle: dto.metaTitle ?? null,
        metaDescription: dto.metaDescription ?? null,
        publishedAt: this.toDateOrNull(dto.publishedAt),
        tags,
      });

      const saved = await manager.save(Content, content);
      await this.fieldValueService.syncValues(saved.id, contentType.version, contentType.fields ?? [], dto.fieldValues ?? [], manager);
      await this.contentMediaService.syncMedia(saved.id, dto.mediaItems ?? [], manager);
      await this.contentVersionService.createContentSnapshot(saved.id, authorId, manager);
      return saved;
    });

    return this.findById(savedContent.id);
  }

  async update(id: string, dto: UpdateContentDto, savedBy: string): Promise<ContentDto> {
    const content = await this.repository.findOne({ where: { id }, relations: ['tags'] });
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const nextContentTypeId = dto.contentTypeId ?? content.contentTypeId;
    const contentType = await this.contentTypesService.findEntityWithFields(nextContentTypeId);

    if (dto.contentTypeId && dto.contentTypeId !== content.contentTypeId && dto.fieldValues === undefined) {
      throw new BadRequestException('fieldValues es requerido al cambiar contentTypeId');
    }

    if (dto.slug !== undefined || dto.contentTypeId !== undefined) {
      await this.ensureSlugAvailable(dto.slug ?? content.slug, nextContentTypeId, id);
    }

    await this.validateReferences(dto);

    if (dto.fieldValues !== undefined) {
      this.fieldValueService.validateValues(contentType.fields ?? [], dto.fieldValues);
    }

    if (dto.mediaItems !== undefined) {
      await this.contentMediaService.validateMediaItems(dto.mediaItems);
    }

    await this.repository.manager.transaction(async (manager) => {
      const updatePayload: Partial<Content> = {
        title: dto.title ?? content.title,
        slug: dto.slug ?? content.slug,
        body: dto.body !== undefined ? dto.body : content.body,
        seo: dto.seo ?? content.seo ?? {},
        config: dto.config ?? content.config ?? {},
        excerpt: dto.excerpt !== undefined ? dto.excerpt : content.excerpt,
        status: dto.status ?? content.status,
        contentTypeId: nextContentTypeId,
        contentTypeVersion: contentType.version,
        categoryId: dto.categoryId !== undefined ? dto.categoryId : content.categoryId,
        coverImageId: dto.coverImageId !== undefined ? dto.coverImageId : content.coverImageId,
        metaTitle: dto.metaTitle !== undefined ? dto.metaTitle : content.metaTitle,
        metaDescription: dto.metaDescription !== undefined ? dto.metaDescription : content.metaDescription,
        publishedAt: dto.publishedAt !== undefined ? this.toDateOrNull(dto.publishedAt) : content.publishedAt,
      };

      await manager.update(Content, id, updatePayload);

      if (dto.tagIds !== undefined) {
        const tags = await this.tagsService.findByIds(dto.tagIds, manager);
        await manager.createQueryBuilder().relation(Content, 'tags').of(id).set(tags);
      }

      if (dto.fieldValues !== undefined) {
        await this.fieldValueService.syncValues(id, contentType.version, contentType.fields ?? [], dto.fieldValues, manager);
      }

      if (dto.mediaItems !== undefined) {
        await this.contentMediaService.syncMedia(id, dto.mediaItems, manager);
      }

      await this.contentVersionService.createContentSnapshot(id, savedBy, manager);
    });

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.repository.update(id, { deletedAt: new Date() });
  }

  async hardDelete(id: string): Promise<void> {
    await this.ensureExists(id, true);
    await this.repository.delete(id);
  }

  async restore(id: string): Promise<void> {
    const content = await this.ensureExists(id, true);
    await this.ensureSlugAvailable(content.slug, content.contentTypeId, id);
    await this.repository.update(id, { deletedAt: null });
  }

  private async findEntityById(id: string): Promise<Content> {
    const content = await this.repository.findOne({
      where: { id },
      relations: ['contentType', 'category', 'tags', 'fieldValues', 'mediaItems', 'mediaItems.media'],
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return content;
  }

  private async ensureExists(id: string, withDeleted = false): Promise<Content> {
    const content = await this.repository.findOne({ where: { id }, withDeleted });
    if (!content) {
      throw new NotFoundException('Content not found');
    }
    return content;
  }

  private async ensureSlugAvailable(slug: string, contentTypeId: string, currentId?: string): Promise<void> {
    const where = currentId
      ? { slug, contentTypeId, id: Not(currentId), deletedAt: IsNull() }
      : { slug, contentTypeId, deletedAt: IsNull() };
    const content = await this.repository.findOne({ where });
    if (content) {
      throw new ConflictException(`El slug "${slug}" ya está registrado para este content type`);
    }
  }

  private async validateReferences(dto: CreateContentDto | UpdateContentDto): Promise<void> {
    if (dto.categoryId) {
      await this.categoriesService.ensureExistsById(dto.categoryId);
    }

    if (dto.coverImageId) {
      await this.mediaService.ensureExistsById(dto.coverImageId);
    }
  }

  private toDateOrNull(value: Date | string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('publishedAt no es una fecha válida');
    }

    return date;
  }
}
