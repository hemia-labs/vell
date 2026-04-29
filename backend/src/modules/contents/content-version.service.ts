import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { ContentVersion } from "./entities/content-version.entity";
import { Content, ContentStatus } from "./entities/content.entity";

@Injectable()
export class ContentVersionService {
  constructor(
    @InjectRepository(ContentVersion)
    private repository: Repository<ContentVersion>,
  ) {}

  async findAll(contentId: string): Promise<ContentVersion[]> {
    return this.repository.find({
      where: { contentId },
      order: { version: 'DESC' },
    });
  }

  async createContentSnapshot(contentId: string, savedBy: string, manager?: EntityManager): Promise<ContentVersion> {
    const repository = manager?.getRepository(ContentVersion) ?? this.repository;
    const contentRepository = manager?.getRepository(Content) ?? repository.manager.getRepository(Content);

    const content = await contentRepository.findOne({
      where: { id: contentId },
      relations: ['category', 'tags', 'fieldValues', 'mediaItems', 'mediaItems.media'],
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const latest = await repository
      .createQueryBuilder('version')
      .withDeleted()
      .where('version.contentId = :contentId', { contentId })
      .orderBy('version.version', 'DESC')
      .getOne();

    const version = (latest?.version ?? 0) + 1;
    const snapshot = repository.create({
      contentId,
      title: content.title,
      slug: content.slug,
      body: content.body,
      seo: content.seo ?? {},
      config: content.config ?? {},
      excerpt: content.excerpt,
      status: content.status,
      contentTypeVersion: content.contentTypeVersion,
      categoryId: content.categoryId,
      coverImageId: content.coverImageId,
      metaTitle: content.metaTitle,
      metaDescription: content.metaDescription,
      publishedAt: content.publishedAt,
      fieldValuesSnapshot: (content.fieldValues ?? []).map(fieldValue => ({
        fieldId: fieldValue.fieldId,
        fieldKey: fieldValue.fieldKey,
        fieldType: fieldValue.fieldType,
        contentTypeVersion: fieldValue.contentTypeVersion,
        value: fieldValue.value,
      })),
      tagsSnapshot: (content.tags ?? []).map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })),
      mediaSnapshot: (content.mediaItems ?? []).map(mediaItem => ({
        id: mediaItem.id,
        mediaId: mediaItem.mediaId,
        role: mediaItem.role,
        order: mediaItem.order,
        meta: mediaItem.meta ?? {},
        media: {
          id: mediaItem.media.id,
          filename: mediaItem.media.filename,
          originalName: mediaItem.media.originalName,
          mimeType: mediaItem.media.mimeType,
          size: mediaItem.media.size,
          url: mediaItem.media.url,
        },
      })),
      version,
      savedBy,
    });

    return repository.save(snapshot);
  }

  async saveDraftSnapshot(contentId: string, savedBy: string, manager?: EntityManager): Promise<ContentVersion> {
    const repository = manager?.getRepository(ContentVersion) ?? this.repository;
    const contentRepository = manager?.getRepository(Content) ?? repository.manager.getRepository(Content);
    const content = await contentRepository.findOne({
      where: { id: contentId },
      relations: ['category', 'tags', 'fieldValues', 'mediaItems', 'mediaItems.media'],
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const draft = content.draftVersionId
      ? await repository.findOne({ where: { id: content.draftVersionId, contentId } })
      : null;
    const snapshot = this.toSnapshot(content, savedBy);

    if (draft) {
      repository.merge(draft, snapshot, {
        status: ContentStatus.DRAFT,
        savedBy,
      });
      return repository.save(draft);
    }

    const latest = await repository
      .createQueryBuilder('version')
      .withDeleted()
      .where('version.contentId = :contentId', { contentId })
      .orderBy('version.version', 'DESC')
      .getOne();

    const nextDraft = repository.create({
      ...snapshot,
      status: ContentStatus.DRAFT,
      version: (latest?.version ?? 0) + 1,
      savedBy,
    });
    const savedDraft = await repository.save(nextDraft);
    await contentRepository.update(contentId, { draftVersionId: savedDraft.id });
    return savedDraft;
  }

  async findById(contentId: string, versionId: string, manager?: EntityManager): Promise<ContentVersion> {
    const repository = manager?.getRepository(ContentVersion) ?? this.repository;
    const version = await repository.findOne({ where: { id: versionId, contentId } });

    if (!version) {
      throw new NotFoundException('Content version not found');
    }

    return version;
  }

  async findByVersion(contentId: string, version: number, manager?: EntityManager): Promise<ContentVersion> {
    const repository = manager?.getRepository(ContentVersion) ?? this.repository;
    const snapshot = await repository.findOne({ where: { contentId, version } });

    if (!snapshot) {
      throw new NotFoundException('Content version not found');
    }

    return snapshot;
  }

  async findPublishedBySlug(contentTypeId: string, slug: string): Promise<ContentVersion> {
    const version = await this.repository
      .createQueryBuilder('version')
      .innerJoinAndSelect('version.content', 'content')
      .where('content.contentTypeId = :contentTypeId', { contentTypeId })
      .andWhere('version.slug = :slug', { slug })
      .andWhere('version.status = :status', { status: ContentStatus.PUBLISHED })
      .andWhere('content.deleted_at IS NULL')
      .getOne();

    if (!version) {
      throw new NotFoundException('Content not found');
    }

    return version;
  }

  async markPublished(contentId: string, versionId: string, manager?: EntityManager): Promise<ContentVersion> {
    const repository = manager?.getRepository(ContentVersion) ?? this.repository;
    const draft = await this.findById(contentId, versionId, manager);

    if (draft.status !== ContentStatus.DRAFT) {
      throw new BadRequestException('Solo se puede publicar una versión draft');
    }

    await repository.update({ contentId, status: ContentStatus.PUBLISHED }, { status: ContentStatus.ARCHIVED });
    draft.status = ContentStatus.PUBLISHED;
    draft.publishedAt = new Date();
    return repository.save(draft);
  }

  private toSnapshot(content: Content, savedBy: string): Partial<ContentVersion> {
    return {
      contentId: content.id,
      title: content.title,
      slug: content.slug,
      body: content.body,
      seo: content.seo ?? {},
      config: content.config ?? {},
      excerpt: content.excerpt,
      status: content.status,
      contentTypeVersion: content.contentTypeVersion,
      categoryId: content.categoryId,
      coverImageId: content.coverImageId,
      metaTitle: content.metaTitle,
      metaDescription: content.metaDescription,
      publishedAt: content.publishedAt,
      fieldValuesSnapshot: (content.fieldValues ?? []).map(fieldValue => ({
        fieldId: fieldValue.fieldId,
        fieldKey: fieldValue.fieldKey,
        fieldType: fieldValue.fieldType,
        contentTypeVersion: fieldValue.contentTypeVersion,
        value: fieldValue.value,
      })),
      tagsSnapshot: (content.tags ?? []).map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })),
      mediaSnapshot: (content.mediaItems ?? []).map(mediaItem => ({
        id: mediaItem.id,
        mediaId: mediaItem.mediaId,
        role: mediaItem.role,
        order: mediaItem.order,
        meta: mediaItem.meta ?? {},
        media: {
          id: mediaItem.media.id,
          filename: mediaItem.media.filename,
          originalName: mediaItem.media.originalName,
          mimeType: mediaItem.media.mimeType,
          size: mediaItem.media.size,
          url: mediaItem.media.url,
        },
      })),
      savedBy,
    };
  }
}
