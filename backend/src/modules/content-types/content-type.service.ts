import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, IsNull, Not, Repository } from "typeorm";
import { ContentFieldValue } from "../contents/entities/content-field-value.entity";
import { Content } from "../contents/entities/content.entity";
import { ContentTypeDto } from "./dtos/content-type.dto";
import { CreateContentTypeDto } from "./dtos/create-content-type.dto";
import { FilterContentTypeDto } from "./dtos/filter-content-type.dto";
import { UpdateContentTypeFieldDto } from "./dtos/update-content-type-field.dto";
import { UpdateContentTypeDto } from "./dtos/update-content-type.dto";
import { ContentTypeField } from "./entities/content-type-field.entity";
import { ContentTypeVersion } from "./entities/content-type-version.entity";
import { ContentType } from "./entities/content-type.entity";
import { ContentTypeVersionsService } from "./content-type-version.service";
import { ContentTypeMapper } from "./mappers/content-type.mapper";

@Injectable()
export class ContentTypesService {
  constructor(
    @InjectRepository(ContentType)
    private repository: Repository<ContentType>,
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    @InjectRepository(ContentFieldValue)
    private fieldValueRepository: Repository<ContentFieldValue>,
    private contentTypeVersionsService: ContentTypeVersionsService,
  ) {}

  async findAll(params: FilterContentTypeDto = {}): Promise<ContentTypeDto[]> {
    const contentTypesQuery = this.repository.createQueryBuilder('contentType');
    const page = Number(params.page);
    const limit = Number(params.limit);

    if (params.withFields === true) {
      contentTypesQuery.leftJoinAndSelect('contentType.fields', 'field');
    }

    if (params.search) {
      contentTypesQuery.andWhere('(contentType.name ILIKE :search OR contentType.slug ILIKE :search)', {
        search: `%${params.search}%`,
      });
    }

    if (Number.isInteger(page) && Number.isInteger(limit) && page > 0 && limit > 0) {
      contentTypesQuery.skip((page - 1) * limit).take(limit);
    }

    contentTypesQuery.orderBy('contentType.name', 'ASC');

    if (params.withFields === true) {
      contentTypesQuery.addOrderBy('field.order', 'ASC');
    }

    const contentTypes = await contentTypesQuery.getMany();

    return contentTypes.map(contentType => ContentTypeMapper.toDTO(contentType));
  }

  async findById(id: string): Promise<ContentTypeDto> {
    const contentType = await this.repository.findOne({
      where: { id },
      relations: ['fields'],
    });
    if (!contentType) {
      throw new NotFoundException('Content type not found');
    }
    return ContentTypeMapper.toDTO(contentType);
  }

  async findBySlug(slug: string): Promise<ContentTypeDto> {
    const contentType = await this.repository.findOne({
      where: { slug },
      relations: ['fields'],
    });
    if (!contentType) {
      throw new NotFoundException('Content type not found');
    }
    return ContentTypeMapper.toDTO(contentType);
  }

  async findVersions(id: string): Promise<ContentTypeVersion[]> {
    await this.ensureExists(id, true);
    return this.contentTypeVersionsService.findAll(id);
  }

  async create(dto: CreateContentTypeDto): Promise<ContentTypeDto> {
    await this.ensureNameAvailable(dto.name);
    await this.ensureSlugAvailable(dto.slug);
    this.validateFields(dto.fields ?? []);

    const entity = ContentTypeMapper.toEntity(dto);
    const savedContentType = await this.repository.manager.transaction(async (manager) => {
      const saved = await manager.save(ContentType, entity);
      const contentTypeWithFields = await manager.findOne(ContentType, {
        where: { id: saved.id },
        relations: ['fields'],
      });

      if (!contentTypeWithFields) {
        throw new NotFoundException('Content type not found');
      }

      await this.contentTypeVersionsService.createSnapshot(contentTypeWithFields, manager);
      return contentTypeWithFields;
    });

    return this.findById(savedContentType.id);
  }

  async update(id: string, dto: UpdateContentTypeDto): Promise<ContentTypeDto> {
    const contentType = await this.repository.findOne({
      where: { id },
      relations: ['fields'],
    });

    if (!contentType) {
      throw new NotFoundException('Content type not found');
    }

    if (dto.name !== undefined) {
      await this.ensureNameAvailable(dto.name, id);
    }

    if (dto.slug !== undefined) {
      await this.ensureSlugAvailable(dto.slug, id);
    }

    if (dto.fields !== undefined) {
      this.validateFields(dto.fields);
    }

    await this.repository.manager.transaction(async (manager) => {
      const contentTypeUpdate = ContentTypeMapper.toUpdateEntity(dto);
      let nextVersion = contentType.version;

      if (dto.fields !== undefined) {
        const fieldsChanged = await this.syncFields(manager, contentType, dto.fields);
        if (fieldsChanged) {
          nextVersion = (contentType.version ?? 1) + 1;
          contentTypeUpdate.version = nextVersion;
        }
      }

      await manager.update(ContentType, id, contentTypeUpdate);

      if (contentTypeUpdate.version !== undefined) {
        const contentTypeWithFields = await manager.findOne(ContentType, {
          where: { id },
          relations: ['fields'],
        });

        if (!contentTypeWithFields) {
          throw new NotFoundException('Content type not found');
        }

        contentTypeWithFields.version = nextVersion;
        await this.contentTypeVersionsService.createSnapshot(contentTypeWithFields, manager);
      }
    });

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.ensureExists(id);
    const deletedAt = new Date();

    await this.repository.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(ContentTypeField)
        .set({ deletedAt })
        .where('content_type_id = :id', { id })
        .andWhere('deleted_at IS NULL')
        .execute();
      await manager
        .createQueryBuilder()
        .update(ContentTypeVersion)
        .set({ deletedAt })
        .where('content_type_id = :id', { id })
        .andWhere('deleted_at IS NULL')
        .execute();
      await manager.update(ContentType, id, { deletedAt });
    });
  }

  async hardDelete(id: string): Promise<void> {
    await this.ensureExists(id, true);
    const contentCount = await this.contentRepository.count({ where: { contentTypeId: id }, withDeleted: true });

    if (contentCount > 0) {
      throw new BadRequestException('No se puede eliminar permanentemente un content type con contenidos asociados');
    }

    await this.repository.delete(id);
  }

  async restore(id: string): Promise<void> {
    const contentType = await this.ensureExists(id, true);
    await this.ensureNameAvailable(contentType.name, id);
    await this.ensureSlugAvailable(contentType.slug, id);

    await this.repository.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(ContentTypeField)
        .set({ deletedAt: null })
        .where('content_type_id = :id', { id })
        .andWhere('deleted_at >= :deletedAt', { deletedAt: contentType.deletedAt })
        .execute();
      await manager
        .createQueryBuilder()
        .update(ContentTypeVersion)
        .set({ deletedAt: null })
        .where('content_type_id = :id', { id })
        .andWhere('deleted_at >= :deletedAt', { deletedAt: contentType.deletedAt })
        .execute();
      await manager.update(ContentType, id, { deletedAt: null });
    });
  }

  async restoreVersion(id: string, version: number): Promise<ContentTypeDto> {
    if (!Number.isInteger(version) || version < 1) {
      throw new BadRequestException('La versión debe ser un número entero válido');
    }

    const contentType = await this.repository.findOne({
      where: { id },
      relations: ['fields'],
    });

    if (!contentType) {
      throw new NotFoundException('Content type not found');
    }

    const contentTypeVersion = await this.contentTypeVersionsService.findByVersion(id, version);
    const snapshot = contentTypeVersion.schemaSnapshot;
    await this.ensureNameAvailable(snapshot.name, id);
    await this.ensureSlugAvailable(snapshot.slug, id);

    const nextVersion = (contentType.version ?? 1) + 1;

    await this.repository.manager.transaction(async (manager) => {
      await this.restoreFieldsFromSnapshot(manager, contentType, snapshot.fields);
      await manager.update(ContentType, id, {
        name: snapshot.name,
        slug: snapshot.slug,
        description: snapshot.description,
        version: nextVersion,
      });

      const restoredContentType = await manager.findOne(ContentType, {
        where: { id },
        relations: ['fields'],
      });

      if (!restoredContentType) {
        throw new NotFoundException('Content type not found');
      }

      restoredContentType.version = nextVersion;
      await this.contentTypeVersionsService.createSnapshot(restoredContentType, manager);
    });

    return this.findById(id);
  }

  private async ensureExists(id: string, withDeleted = false): Promise<ContentType> {
    const contentType = await this.repository.findOne({ where: { id }, withDeleted });
    if (!contentType) {
      throw new NotFoundException('Content type not found');
    }
    return contentType;
  }

  private async ensureNameAvailable(name: string, currentId?: string): Promise<void> {
    const where = currentId ? { name, id: Not(currentId), deletedAt: IsNull() } : { name, deletedAt: IsNull() };
    const contentType = await this.repository.findOne({ where });
    if (contentType) {
      throw new ConflictException(`El nombre "${name}" ya está registrado`);
    }
  }

  private async ensureSlugAvailable(slug: string, currentId?: string): Promise<void> {
    const where = currentId ? { slug, id: Not(currentId), deletedAt: IsNull() } : { slug, deletedAt: IsNull() };
    const contentType = await this.repository.findOne({ where });
    if (contentType) {
      throw new ConflictException(`El slug "${slug}" ya está registrado`);
    }
  }

  private validateFields(fields: CreateContentTypeDto['fields'] | UpdateContentTypeDto['fields']): void {
    const fieldKeys = new Set<string>();
    const fieldIds = new Set<string>();

    for (const field of fields ?? []) {
      const fieldId = 'id' in field && typeof field.id === 'string' ? field.id : undefined;

      if (fieldId) {
        if (fieldIds.has(fieldId)) {
          throw new BadRequestException(`El field id "${fieldId}" está duplicado`);
        }
        fieldIds.add(fieldId);
      }

      if (fieldKeys.has(field.fieldKey)) {
        throw new BadRequestException(`El fieldKey "${field.fieldKey}" está duplicado`);
      }
      fieldKeys.add(field.fieldKey);
    }
  }

  private async syncFields(
    manager: EntityManager,
    contentType: ContentType,
    fields: UpdateContentTypeFieldDto[],
  ): Promise<boolean> {
    const existingFields = await manager.find(ContentTypeField, {
      where: { contentTypeId: contentType.id },
      withDeleted: true,
    });
    const activeFields = existingFields.filter(field => !field.deletedAt);
    const existingById = new Map(existingFields.map(field => [field.id, field]));
    const incomingIds = new Set(fields.filter(field => field.id).map(field => field.id));
    let changed = false;

    for (const field of activeFields) {
      if (incomingIds.has(field.id)) {
        continue;
      }

      if (await this.fieldHasValues(field.id, manager)) {
        throw new BadRequestException(`No se puede eliminar el field "${field.fieldKey}" porque ya tiene valores`);
      }

      await manager.update(ContentTypeField, field.id, { deletedAt: new Date() });
      changed = true;
    }

    for (const fieldDto of fields) {
      if (!fieldDto.id) {
        const field = manager.create(ContentTypeField, {
          contentTypeId: contentType.id,
          name: fieldDto.name,
          fieldKey: fieldDto.fieldKey,
          fieldType: fieldDto.fieldType,
          isRequired: fieldDto.isRequired ?? false,
          meta: fieldDto.meta ?? {},
          order: fieldDto.order ?? fields.indexOf(fieldDto),
        });
        await manager.save(ContentTypeField, field);
        changed = true;
        continue;
      }

      const field = existingById.get(fieldDto.id);
      if (!field || field.contentTypeId !== contentType.id || field.deletedAt) {
        throw new NotFoundException(`Field ${fieldDto.id} not found`);
      }

      const hasValues = await this.fieldHasValues(field.id, manager);
      const fieldKeyChanged = field.fieldKey !== fieldDto.fieldKey;
      const fieldTypeChanged = field.fieldType !== fieldDto.fieldType;

      if (hasValues && fieldKeyChanged) {
        throw new BadRequestException(`No se puede cambiar el fieldKey "${field.fieldKey}" porque ya tiene valores`);
      }

      if (hasValues && fieldTypeChanged) {
        throw new BadRequestException(`No se puede cambiar el fieldType "${field.fieldKey}" porque ya tiene valores`);
      }

      const nextOrder = fieldDto.order ?? field.order;
      const nextIsRequired = fieldDto.isRequired ?? false;
      const nextMeta = fieldDto.meta ?? {};
      const fieldChanged = field.name !== fieldDto.name ||
        field.fieldKey !== fieldDto.fieldKey ||
        field.fieldType !== fieldDto.fieldType ||
        field.isRequired !== nextIsRequired ||
        JSON.stringify(field.meta ?? {}) !== JSON.stringify(nextMeta) ||
        field.order !== nextOrder;

      if (!fieldChanged) {
        continue;
      }

      await manager.save(ContentTypeField, manager.merge(ContentTypeField, field, {
        name: fieldDto.name,
        fieldKey: fieldDto.fieldKey,
        fieldType: fieldDto.fieldType,
        isRequired: nextIsRequired,
        meta: nextMeta,
        order: nextOrder,
      }));
      changed = true;
    }

    return changed;
  }

  private async restoreFieldsFromSnapshot(
    manager: EntityManager,
    contentType: ContentType,
    snapshotFields: Array<{
      id: string;
      name: string;
      fieldKey: string;
      fieldType: string;
      isRequired: boolean;
      meta: Record<string, unknown>;
      order: number;
    }>,
  ): Promise<void> {
    this.validateFields(snapshotFields.map(field => ({
      id: field.id,
      name: field.name,
      fieldKey: field.fieldKey,
      fieldType: field.fieldType as UpdateContentTypeFieldDto['fieldType'],
      isRequired: field.isRequired,
      meta: field.meta ?? {},
      order: field.order,
    })));

    const existingFields = await manager.find(ContentTypeField, {
      where: { contentTypeId: contentType.id },
      withDeleted: true,
    });
    const existingById = new Map(existingFields.map(field => [field.id, field]));
    const snapshotIds = new Set(snapshotFields.map(field => field.id));

    for (const field of existingFields.filter(field => !field.deletedAt)) {
      if (snapshotIds.has(field.id)) {
        continue;
      }

      if (await this.fieldHasValues(field.id, manager)) {
        throw new BadRequestException(`No se puede eliminar el field "${field.fieldKey}" porque ya tiene valores`);
      }

      await manager.update(ContentTypeField, field.id, { deletedAt: new Date() });
    }

    for (const fieldSnapshot of snapshotFields) {
      const field = existingById.get(fieldSnapshot.id);

      if (!field) {
        await manager.save(ContentTypeField, manager.create(ContentTypeField, {
          contentTypeId: contentType.id,
          name: fieldSnapshot.name,
          fieldKey: fieldSnapshot.fieldKey,
          fieldType: fieldSnapshot.fieldType as UpdateContentTypeFieldDto['fieldType'],
          isRequired: fieldSnapshot.isRequired,
          meta: fieldSnapshot.meta ?? {},
          order: fieldSnapshot.order,
        }));
        continue;
      }

      const hasValues = await this.fieldHasValues(field.id, manager);

      if (hasValues && field.fieldKey !== fieldSnapshot.fieldKey) {
        throw new BadRequestException(`No se puede cambiar el fieldKey "${field.fieldKey}" porque ya tiene valores`);
      }

      if (hasValues && field.fieldType !== fieldSnapshot.fieldType) {
        throw new BadRequestException(`No se puede cambiar el fieldType "${field.fieldKey}" porque ya tiene valores`);
      }

      await manager.update(ContentTypeField, field.id, {
        name: fieldSnapshot.name,
        fieldKey: fieldSnapshot.fieldKey,
        fieldType: fieldSnapshot.fieldType as UpdateContentTypeFieldDto['fieldType'],
        isRequired: fieldSnapshot.isRequired,
        meta: fieldSnapshot.meta ?? {},
        order: fieldSnapshot.order,
        deletedAt: null,
      });
    }
  }

  private async fieldHasValues(fieldId: string, manager?: EntityManager): Promise<boolean> {
    const repository = manager?.getRepository(ContentFieldValue) ?? this.fieldValueRepository;
    const count = await repository.count({ where: { fieldId }, withDeleted: true });
    return count > 0;
  }
}
