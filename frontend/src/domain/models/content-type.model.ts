export type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'image' | 'file' | 'select' | 'relation' | 'json' | 'richtext'

export type FieldMeta = Record<string, unknown>

export interface ContentTypeField {
  id: string
  contentTypeId: string
  name: string
  fieldKey: string
  fieldType: FieldType
  isRequired: boolean
  meta: FieldMeta
  order: number
  createdAt: string
  updatedAt: string
}

export interface ContentTypeSchemaSnapshot {
  id: string
  name: string
  slug: string
  description: string | null
  version: number
  fields: Array<{
    id: string
    name: string
    fieldKey: string
    fieldType: FieldType
    isRequired: boolean
    meta: FieldMeta
    order: number
  }>
}

export interface ContentTypeVersion {
  id: string
  contentTypeId: string
  version: number
  schemaSnapshot: ContentTypeSchemaSnapshot
  createdAt: string
}

export interface ContentType {
  id: string
  name: string
  slug: string
  description: string | null
  version: number
  fields?: ContentTypeField[]
  versions?: ContentTypeVersion[]
  createdAt: string
  updatedAt: string
}

export interface CreateContentTypeField {
  id?: string
  name: string
  fieldKey: string
  fieldType: FieldType
  isRequired?: boolean
  meta?: FieldMeta
  order?: number
}

export interface CreateContentType {
  name: string
  slug: string
  description?: string | null
  fields?: CreateContentTypeField[]
}

export type UpdateContentType = Partial<CreateContentType>

export interface FilterContentTypeParams {
  search?: string
  withFields?: boolean
  page?: number
  limit?: number
}
