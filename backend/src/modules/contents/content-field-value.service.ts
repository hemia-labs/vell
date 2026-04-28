import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { isUUID } from "class-validator";
import { ContentTypeField } from "../content-types/entities/content-type-field.entity";
import { FieldType } from "../content-types/entities/field-type.enum";
import { ContentFieldValueInputDto } from "./dtos/content-field-value-input.dto";
import { ContentFieldValue } from "./entities/content-field-value.entity";

@Injectable()
export class ContentFieldValueService {
  constructor(
    @InjectRepository(ContentFieldValue)
    private repository: Repository<ContentFieldValue>,
  ) {}

  async syncValues(
    contentId: string,
    contentTypeVersion: number,
    fields: ContentTypeField[],
    values: ContentFieldValueInputDto[] = [],
    manager?: EntityManager,
  ): Promise<ContentFieldValue[]> {
    const repository = manager?.getRepository(ContentFieldValue) ?? this.repository;
    const fieldsById = new Map(fields.map(field => [field.id, field]));
    const fieldsByKey = new Map(fields.map(field => [field.fieldKey, field]));
    const normalized = this.normalizeValues(values, fieldsById, fieldsByKey);

    this.validateRequiredFields(fields, normalized);

    await repository.update({ contentId }, { deletedAt: new Date() });

    const entities = [...normalized.values()].map(({ field, value }) => repository.create({
      contentId,
      fieldId: field.id,
      fieldKey: field.fieldKey,
      fieldType: field.fieldType,
      contentTypeVersion,
      value,
      deletedAt: null,
    }));

    return repository.save(entities);
  }

  validateValues(fields: ContentTypeField[], values: ContentFieldValueInputDto[] = []): void {
    const fieldsById = new Map(fields.map(field => [field.id, field]));
    const fieldsByKey = new Map(fields.map(field => [field.fieldKey, field]));
    const normalized = this.normalizeValues(values, fieldsById, fieldsByKey);
    this.validateRequiredFields(fields, normalized);
  }

  private normalizeValues(
    values: ContentFieldValueInputDto[],
    fieldsById: Map<string, ContentTypeField>,
    fieldsByKey: Map<string, ContentTypeField>,
  ): Map<string, { field: ContentTypeField; value: unknown }> {
    const normalized = new Map<string, { field: ContentTypeField; value: unknown }>();

    for (const item of values) {
      if (!item.fieldId && !item.fieldKey) {
        throw new BadRequestException('Cada field value debe incluir fieldId o fieldKey');
      }

      const field = item.fieldId ? fieldsById.get(item.fieldId) : fieldsByKey.get(item.fieldKey as string);
      if (!field) {
        throw new BadRequestException(`El campo "${item.fieldId ?? item.fieldKey}" no pertenece al content type`);
      }

      if (normalized.has(field.id)) {
        throw new BadRequestException(`El campo "${field.fieldKey}" está duplicado`);
      }

      this.validateValue(field, item.value);
      normalized.set(field.id, { field, value: item.value });
    }

    return normalized;
  }

  private validateRequiredFields(
    fields: ContentTypeField[],
    normalized: Map<string, { field: ContentTypeField; value: unknown }>,
  ): void {
    for (const field of fields) {
      if (!field.isRequired) {
        continue;
      }

      const item = normalized.get(field.id);
      if (!item || this.isEmpty(item.value)) {
        throw new BadRequestException(`El campo "${field.fieldKey}" es requerido`);
      }
    }
  }

  private validateValue(field: ContentTypeField, value: unknown): void {
    if (this.isEmpty(value)) {
      return;
    }

    const invalid = () => new BadRequestException(`El campo "${field.fieldKey}" debe ser de tipo ${field.fieldType}`);

    switch (field.fieldType) {
      case FieldType.TEXT:
      case FieldType.TEXTAREA:
      case FieldType.RICHTEXT:
      case FieldType.SELECT:
        if (typeof value !== 'string') throw invalid();
        break;
      case FieldType.NUMBER:
        if (typeof value !== 'number' || Number.isNaN(value)) throw invalid();
        break;
      case FieldType.BOOLEAN:
        if (typeof value !== 'boolean') throw invalid();
        break;
      case FieldType.DATE:
        if (typeof value !== 'string' && !(value instanceof Date)) throw invalid();
        if (Number.isNaN(new Date(value as string | Date).getTime())) throw invalid();
        break;
      case FieldType.IMAGE:
      case FieldType.FILE:
      case FieldType.RELATION:
        if (typeof value !== 'string' || !isUUID(value, '4')) throw invalid();
        break;
      case FieldType.JSON:
        if (typeof value !== 'object') throw invalid();
        break;
      default:
        throw invalid();
    }
  }

  private isEmpty(value: unknown): boolean {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
  }
}
