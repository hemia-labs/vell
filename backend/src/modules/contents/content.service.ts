import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, IsNull, Not, Repository } from "typeorm";
import { CategoriesService } from "../categories/category.service";
import { ContentTypesService } from "../content-types/content-type.service";
import { FieldType } from "../content-types/entities/field-type.enum";
import { MediaService } from "../media/media.service";
import { Media } from "../media/entities/media.entity";
import { FileUploadService } from "../file-upload/file-upload.service";
import { TagsService } from "../tags/tag.service";
import { ContentDto } from "./dtos/content.dto";
import { CreateContentDto } from "./dtos/create-content.dto";
import { FilterContentDto } from "./dtos/filter-content.dto";
import { UpdateContentDto } from "./dtos/update-content.dto";
import { Content, ContentStatus } from "./entities/content.entity";
import { ContentVersion } from "./entities/content-version.entity";
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
    private fileUploadService: FileUploadService,
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
        .leftJoinAndSelect('content.coverImage', 'coverImage')
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

    return Promise.all(contents.map(content => this.toDtoWithPreviewUrls(content)));
  }

  async findById(id: string): Promise<ContentDto> {
    const content = await this.findEntityById(id);
    return this.toDtoWithPreviewUrls(content);
  }

  async findBySlug(contentTypeId: string, slug: string): Promise<ContentDto> {
    const version = await this.contentVersionService.findPublishedBySlug(contentTypeId, slug);
    return this.toDtoFromVersion(version);
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
        status: ContentStatus.DRAFT,
        contentTypeId: dto.contentTypeId,
        contentTypeVersion: contentType.version,
        categoryId: dto.categoryId ?? null,
        authorId,
        coverImageId: dto.coverImageId ?? null,
        metaTitle: dto.metaTitle ?? null,
        metaDescription: dto.metaDescription ?? null,
        publishedAt: null,
        tags,
      });

      const saved = await manager.save(Content, content);
      await this.fieldValueService.syncValues(saved.id, contentType.version, contentType.fields ?? [], dto.fieldValues ?? [], manager);
      await this.contentMediaService.syncMedia(saved.id, dto.mediaItems ?? [], manager);
      const draft = await this.contentVersionService.saveDraftSnapshot(saved.id, authorId, manager);

      if (dto.status === ContentStatus.PUBLISHED) {
        await this.publishDraft(saved.id, authorId, manager, draft.id);
      }
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
      const shouldPublish = dto.status === ContentStatus.PUBLISHED;
      const updatePayload: Partial<Content> = {
        title: dto.title ?? content.title,
        slug: dto.slug ?? content.slug,
        body: dto.body !== undefined ? dto.body : content.body,
        seo: dto.seo ?? content.seo ?? {},
        config: dto.config ?? content.config ?? {},
        excerpt: dto.excerpt !== undefined ? dto.excerpt : content.excerpt,
        status: shouldPublish ? ContentStatus.DRAFT : dto.status ?? ContentStatus.DRAFT,
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
        await this.syncTags(id, dto.tagIds, manager);
      }

      if (dto.fieldValues !== undefined) {
        await this.fieldValueService.syncValues(id, contentType.version, contentType.fields ?? [], dto.fieldValues, manager);
      }

      if (dto.mediaItems !== undefined) {
        await this.contentMediaService.syncMedia(id, dto.mediaItems, manager);
      }

      const draft = await this.contentVersionService.saveDraftSnapshot(id, savedBy, manager);

      if (shouldPublish) {
        await this.publishDraft(id, savedBy, manager, draft.id);
      }
    });

    return this.findById(id);
  }

  async publish(id: string, savedBy: string): Promise<ContentDto> {
    await this.repository.manager.transaction(async (manager) => {
      await this.publishDraft(id, savedBy, manager);
    });

    return this.findById(id);
  }

  async restoreVersion(id: string, version: number, savedBy: string): Promise<ContentDto> {
    await this.ensureExists(id, true);

    await this.repository.manager.transaction(async (manager) => {
      const versionSnapshot = await this.contentVersionService.findByVersion(id, version, manager);
      const contentRepository = manager.getRepository(Content);
      const content = await contentRepository.findOne({ where: { id } });

      if (!content) {
        throw new NotFoundException('Content not found');
      }

      const contentType = await this.contentTypesService.findEntityWithFields(content.contentTypeId);

      await contentRepository.update(id, {
        title: versionSnapshot.title,
        slug: versionSnapshot.slug,
        body: versionSnapshot.body,
        seo: versionSnapshot.seo ?? {},
        config: versionSnapshot.config ?? {},
        excerpt: versionSnapshot.excerpt,
        status: ContentStatus.DRAFT,
        contentTypeVersion: contentType.version,
        categoryId: versionSnapshot.categoryId,
        coverImageId: versionSnapshot.coverImageId,
        metaTitle: versionSnapshot.metaTitle,
        metaDescription: versionSnapshot.metaDescription,
        publishedAt: versionSnapshot.publishedAt,
      });

      await this.syncTags(id, versionSnapshot.tagsSnapshot?.map(tag => tag.id) ?? [], manager);
      await this.fieldValueService.syncValues(
        id,
        contentType.version,
        contentType.fields ?? [],
        (versionSnapshot.fieldValuesSnapshot ?? []).map(fieldValue => ({
          fieldKey: fieldValue.fieldKey,
          value: fieldValue.value,
        })),
        manager,
      );
      await this.contentMediaService.syncMedia(
        id,
        (versionSnapshot.mediaSnapshot ?? []).map(mediaItem => ({
          mediaId: mediaItem.mediaId,
          role: mediaItem.role,
          order: mediaItem.order,
          meta: mediaItem.meta ?? {},
        })),
        manager,
      );
      await this.contentVersionService.saveDraftSnapshot(id, savedBy, manager);
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
      relations: ['contentType', 'category', 'tags', 'fieldValues', 'coverImage', 'mediaItems', 'mediaItems.media'],
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return content;
  }

  private async toDtoWithPreviewUrls(content: Content): Promise<ContentDto> {
    const dto = ContentMapper.toDTO(content);

    if (content.coverImage && dto.coverImage) {
      dto.coverImage.previewUrl = await this.fileUploadService.getPreviewUrl(content.coverImage);
    }

    await Promise.all((content.mediaItems ?? []).map(async (mediaItem, index) => {
      if (mediaItem.media && dto.mediaItems?.[index]?.media) {
        dto.mediaItems[index].media.previewUrl = await this.fileUploadService.getPreviewUrl(mediaItem.media);
      }
    }));

    await this.attachFieldValueMediaAssets(dto);

    return dto;
  }

  private async toDtoFromVersion(version: ContentVersion): Promise<ContentDto> {
    const content = version.content;
    const dto = new ContentDto();
    dto.id = version.contentId;
    dto.title = version.title;
    dto.slug = version.slug;
    dto.body = version.body;
    dto.seo = version.seo ?? {};
    dto.config = version.config ?? {};
    dto.excerpt = version.excerpt;
    dto.status = version.status;
    dto.contentTypeId = content.contentTypeId;
    dto.contentTypeVersion = version.contentTypeVersion;
    dto.categoryId = version.categoryId;
    dto.authorId = content.authorId;
    dto.coverImageId = version.coverImageId;
    dto.coverImage = null;
    dto.metaTitle = version.metaTitle;
    dto.metaDescription = version.metaDescription;
    dto.publishedAt = version.publishedAt;
    dto.publishedVersionId = content.publishedVersionId;
    dto.draftVersionId = content.draftVersionId;
    dto.tagIds = version.tagsSnapshot?.map(tag => tag.id) ?? [];
    dto.fieldValues = (version.fieldValuesSnapshot ?? []).map((fieldValue) => ({
      id: `${version.id}:${fieldValue.fieldId}`,
      fieldId: fieldValue.fieldId,
      fieldKey: fieldValue.fieldKey,
      fieldType: fieldValue.fieldType,
      contentTypeVersion: fieldValue.contentTypeVersion,
      value: fieldValue.value,
    }));
    dto.mediaItems = (version.mediaSnapshot ?? []).map((mediaItem) => ({
      id: mediaItem.id,
      mediaId: mediaItem.mediaId,
      role: mediaItem.role,
      order: mediaItem.order,
      meta: mediaItem.meta ?? {},
      media: {
        ...mediaItem.media,
        previewUrl: mediaItem.media.url,
      },
    }));
    dto.createdAt = content.createdAt;
    dto.updatedAt = content.updatedAt;

    await this.attachFieldValueMediaAssets(dto);
    return dto;
  }

  private async publishDraft(contentId: string, savedBy: string, manager: EntityManager, draftVersionId?: string): Promise<void> {
    const contentRepository = manager.getRepository(Content);
    const content = await contentRepository.findOne({
      where: { id: contentId },
      relations: ['tags', 'fieldValues', 'mediaItems', 'mediaItems.media'],
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const draftId = draftVersionId ?? content.draftVersionId ?? (await this.contentVersionService.saveDraftSnapshot(contentId, savedBy, manager)).id;
    const published = await this.contentVersionService.markPublished(contentId, draftId, manager);
    const contentType = await this.contentTypesService.findEntityWithFields(content.contentTypeId);
    const publishedAt = published.publishedAt ?? new Date();

    await contentRepository.update(contentId, {
      title: published.title,
      slug: published.slug,
      body: published.body,
      seo: published.seo ?? {},
      config: published.config ?? {},
      excerpt: published.excerpt,
      status: ContentStatus.PUBLISHED,
      contentTypeVersion: published.contentTypeVersion,
      categoryId: published.categoryId,
      coverImageId: published.coverImageId,
      metaTitle: published.metaTitle,
      metaDescription: published.metaDescription,
      publishedAt,
      publishedVersionId: published.id,
      draftVersionId: null,
    });

    await this.syncTags(contentId, published.tagsSnapshot?.map(tag => tag.id) ?? [], manager);
    await this.fieldValueService.syncValues(
      contentId,
      contentType.version,
      contentType.fields ?? [],
      (published.fieldValuesSnapshot ?? []).map(fieldValue => ({
        fieldId: fieldValue.fieldId,
        fieldKey: fieldValue.fieldKey,
        value: fieldValue.value,
      })),
      manager,
    );
    await this.contentMediaService.syncMedia(
      contentId,
      (published.mediaSnapshot ?? []).map(mediaItem => ({
        mediaId: mediaItem.mediaId,
        role: mediaItem.role,
        order: mediaItem.order,
        meta: mediaItem.meta ?? {},
      })),
      manager,
    );
  }

  private async attachFieldValueMediaAssets(dto: ContentDto): Promise<void> {
    const fieldValues = dto.fieldValues ?? [];
    const mediaIds = [...new Set(fieldValues.flatMap(fieldValue => this.getMediaIdsFromFieldValue(fieldValue.fieldType, fieldValue.value)))];

    if (mediaIds.length === 0) {
      return;
    }

    const media = await this.mediaService.findByIds(mediaIds);
    const mediaById = new Map(media.map(item => [item.id, item]));

    await Promise.all(fieldValues.map(async (fieldValue) => {
      const ids = this.getMediaIdsFromFieldValue(fieldValue.fieldType, fieldValue.value);
      if (ids.length === 0) {
        return;
      }

      const assets = await Promise.all(ids.flatMap((id) => {
        const item = mediaById.get(id);
        return item ? [this.toMediaAssetDto(item)] : [];
      }));

      fieldValue.mediaAssets = assets;
    }));
  }

  private getMediaIdsFromFieldValue(fieldType: string, value: unknown): string[] {
    if (fieldType !== FieldType.IMAGE && fieldType !== FieldType.FILE) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }

    return typeof value === 'string' ? [value] : [];
  }

  private async toMediaAssetDto(media: Media) {
    return {
      id: media.id,
      filename: media.filename,
      originalName: media.originalName,
      mimeType: media.mimeType,
      size: media.size,
      url: media.url,
      previewUrl: await this.fileUploadService.getPreviewUrl(media),
    };
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

  private async syncTags(contentId: string, tagIds: string[], manager: EntityManager): Promise<void> {
    const tags = await this.tagsService.findByIds(tagIds, manager);
    const relation = manager.createQueryBuilder().relation(Content, 'tags').of(contentId);
    const currentTagIds = await this.getCurrentTagIds(contentId, manager);

    if (currentTagIds.length > 0) {
      await relation.remove(currentTagIds);
    }

    if (tags.length > 0) {
      await relation.add(tags.map(tag => tag.id));
    }
  }

  private async getCurrentTagIds(contentId: string, manager: EntityManager): Promise<string[]> {
    const content = await manager.findOne(Content, {
      where: { id: contentId },
      relations: ['tags'],
    });

    return content?.tags?.map(tag => tag.id) ?? [];
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
