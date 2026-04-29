import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, IsNull, Repository } from "typeorm";
import { ContentFieldValue } from "../contents/entities/content-field-value.entity";
import { ContentMedia } from "../contents/entities/content-media.entity";
import { Content } from "../contents/entities/content.entity";
import { FileUploadService } from "../file-upload/file-upload.service";
import { FilterMediaDto, MediaKind } from "./dtos/filter-media.dto";
import { MediaDto, MediaReferencesDto } from "./dtos/media.dto";
import { UpdateMediaDto } from "./dtos/update-media.dto";
import { Media } from "./entities/media.entity";

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private repository: Repository<Media>,
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    @InjectRepository(ContentMedia)
    private contentMediaRepository: Repository<ContentMedia>,
    @InjectRepository(ContentFieldValue)
    private contentFieldValueRepository: Repository<ContentFieldValue>,
    private fileUploadService: FileUploadService,
  ) {}

  async findAll(params: FilterMediaDto = {}): Promise<MediaDto[]> {
    const mediaQuery = this.repository.createQueryBuilder('media');
    const page = Number(params.page);
    const limit = Number(params.limit);

    if (params.withUploader === true) {
      mediaQuery.leftJoinAndSelect('media.uploadedBy', 'uploadedBy');
    }

    if (params.withDeleted === true || params.onlyDeleted === true) {
      mediaQuery.withDeleted();
    }

    if (params.onlyDeleted === true) {
      mediaQuery.andWhere('media.deleted_at IS NOT NULL');
    }

    if (params.search) {
      mediaQuery.andWhere('(media.filename ILIKE :search OR media.originalName ILIKE :search OR media.mimeType ILIKE :search)', {
        search: `%${params.search}%`,
      });
    }

    if (params.mimeType) {
      mediaQuery.andWhere('media.mimeType = :mimeType', { mimeType: params.mimeType });
    }

    if (params.kind) {
      this.applyKindFilter(mediaQuery, params.kind);
    }

    if (params.storage) {
      mediaQuery.andWhere('media.storage = :storage', { storage: params.storage });
    }

    if (params.uploadedById) {
      mediaQuery.andWhere('media.uploadedById = :uploadedById', { uploadedById: params.uploadedById });
    }

    if (Number.isInteger(page) && Number.isInteger(limit) && page > 0 && limit > 0) {
      mediaQuery.skip((page - 1) * limit).take(limit);
    }

    const media = await mediaQuery
      .orderBy('media.createdAt', 'DESC')
      .getMany();

    return Promise.all(media.map(item => this.toDto(item)));
  }

  async findById(id: string): Promise<MediaDto> {
    const media = await this.repository.findOne({ where: { id }, relations: ['uploadedBy'], withDeleted: true });
    if (!media) {
      throw new NotFoundException('Media not found');
    }
    return this.toDto(media);
  }

  async update(id: string, dto: UpdateMediaDto): Promise<MediaDto> {
    const media = await this.ensureExists(id);
    const updatedMedia = this.repository.merge(media, dto);
    const savedMedia = await this.repository.save(updatedMedia);
    return this.toDto(savedMedia);
  }

  async delete(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.ensureNotReferenced(id);
    await this.repository.softDelete(id);
  }

  async hardDelete(id: string): Promise<void> {
    const media = await this.ensureExists(id, true);
    await this.ensureNotReferenced(id);

    if (media.storageKey) {
      await this.fileUploadService.deleteObject(media.storageKey);
    }

    await this.repository.delete(id);
  }

  async restore(id: string): Promise<void> {
    await this.ensureExists(id, true);
    await this.repository.update(id, { deletedAt: null });
  }

  async getPreviewUrl(id: string): Promise<{ previewUrl: string }> {
    const media = await this.ensureExists(id, true);
    return { previewUrl: await this.fileUploadService.getPreviewUrl(media) };
  }

  async getReferences(id: string): Promise<MediaReferencesDto> {
    await this.ensureExists(id, true);
    const [contentMedia, coverImages, fieldValues] = await Promise.all([
      this.contentMediaRepository.count({ where: { mediaId: id, deletedAt: IsNull() } }),
      this.contentRepository.count({ where: { coverImageId: id, deletedAt: IsNull() } }),
      this.countFieldValueReferences(id),
    ]);

    return {
      contentMedia,
      coverImages,
      fieldValues,
      total: contentMedia + coverImages + fieldValues,
    };
  }

  async ensureExistsById(id: string): Promise<Media> {
    return this.ensureExists(id);
  }

  async findByIds(ids: string[], manager?: EntityManager): Promise<Media[]> {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) {
      return [];
    }

    const repository = manager?.getRepository(Media) ?? this.repository;
    const media = await repository.findBy({ id: In(uniqueIds) });
    const foundIds = new Set(media.map(item => item.id));
    const missingIds = uniqueIds.filter(id => !foundIds.has(id));

    if (missingIds.length > 0) {
      throw new NotFoundException(`No existen los siguientes media: ${missingIds.join(', ')}`);
    }

    return media;
  }

  private async ensureExists(id: string, withDeleted = false): Promise<Media> {
    const media = await this.repository.findOne({ where: { id }, withDeleted });
    if (!media) {
      throw new NotFoundException('Media not found');
    }
    return media;
  }

  private async ensureNotReferenced(id: string): Promise<void> {
    const references = await this.getReferences(id);
    if (references.total > 0) {
      throw new BadRequestException('Media is attached to content and cannot be deleted');
    }
  }

  private async countFieldValueReferences(id: string): Promise<number> {
    const fieldValues = await this.contentFieldValueRepository.find({
      select: ['value'],
      where: { deletedAt: IsNull(), fieldType: In(['image', 'file']) },
    });

    return fieldValues.filter(fieldValue => this.valueContainsMediaId(fieldValue.value, id)).length;
  }

  private valueContainsMediaId(value: unknown, id: string): boolean {
    if (Array.isArray(value)) {
      return value.includes(id);
    }

    return value === id;
  }

  private async toDto(media: Media): Promise<MediaDto> {
    return {
      id: media.id,
      filename: media.filename,
      storageKey: media.storageKey,
      originalName: media.originalName,
      mimeType: media.mimeType,
      size: media.size,
      url: media.url,
      previewUrl: await this.fileUploadService.getPreviewUrl(media),
      storage: media.storage,
      uploadedById: media.uploadedById,
      uploadedBy: media.uploadedBy ? {
        id: media.uploadedBy.id,
        name: media.uploadedBy.name,
        email: media.uploadedBy.email,
      } : undefined,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
      deletedAt: media.deletedAt,
    };
  }

  private applyKindFilter(mediaQuery: ReturnType<Repository<Media>['createQueryBuilder']>, kind: MediaKind): void {
    if (kind === MediaKind.IMAGE) {
      mediaQuery.andWhere('media.mimeType LIKE :kind', { kind: 'image/%' });
      return;
    }

    if (kind === MediaKind.VIDEO) {
      mediaQuery.andWhere('media.mimeType LIKE :kind', { kind: 'video/%' });
      return;
    }

    if (kind === MediaKind.AUDIO) {
      mediaQuery.andWhere('media.mimeType LIKE :kind', { kind: 'audio/%' });
      return;
    }

    if (kind === MediaKind.PDF) {
      mediaQuery.andWhere('media.mimeType = :kind', { kind: 'application/pdf' });
    }
  }
}
