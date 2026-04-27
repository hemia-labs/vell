import { FieldType } from "../entities/field-type.enum";

export class ContentTypeFieldDto {
  id: string;
  contentTypeId: string;
  name: string;
  fieldKey: string;
  fieldType: FieldType;
  isRequired: boolean;
  meta: Record<string, unknown>;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
