import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { ContentType } from "./entities/content-type.entity";
import { ContentTypeVersion } from "./entities/content-type-version.entity";

@Injectable()
export class ContentTypeVersionsService {
  constructor(
    @InjectRepository(ContentTypeVersion)
    private repository: Repository<ContentTypeVersion>,
  ) {}

  async findAll(contentTypeId: string): Promise<ContentTypeVersion[]> {
    return this.repository.find({
      where: { contentTypeId },
      order: { version: 'DESC' },
    });
  }

  async findByVersion(contentTypeId: string, version: number): Promise<ContentTypeVersion> {
    const contentTypeVersion = await this.repository.findOne({
      where: { contentTypeId, version },
    });

    if (!contentTypeVersion) {
      throw new NotFoundException('Content type version not found');
    }

    return contentTypeVersion;
  }

  async createSnapshot(contentType: ContentType, manager?: EntityManager): Promise<ContentTypeVersion> {
    const repository = manager?.getRepository(ContentTypeVersion) ?? this.repository;
    const schemaSnapshot = this.buildSnapshot(contentType);
    const existingVersion = await repository.findOne({
      where: {
        contentTypeId: contentType.id,
        version: contentType.version,
      },
      withDeleted: true,
    });

    if (existingVersion) {
      existingVersion.schemaSnapshot = schemaSnapshot;
      existingVersion.deletedAt = null;
      return repository.save(existingVersion);
    }

    const version = repository.create({
      contentTypeId: contentType.id,
      version: contentType.version,
      schemaSnapshot,
    });

    return repository.save(version);
  }

  private buildSnapshot(contentType: ContentType) {
    return {
      id: contentType.id,
      name: contentType.name,
      slug: contentType.slug,
      description: contentType.description,
      version: contentType.version,
      fields: (contentType.fields ?? [])
        .filter(field => !field.deletedAt)
        .sort((a, b) => a.order - b.order)
        .map(field => ({
          id: field.id,
          name: field.name,
          fieldKey: field.fieldKey,
          fieldType: field.fieldType,
          isRequired: field.isRequired,
          multiple: field.multiple ?? Boolean(field.meta?.multiple),
          meta: field.meta ?? {},
          order: field.order,
        })),
    };
  }
}
