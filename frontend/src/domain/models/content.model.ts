import type { FieldType } from './content-type.model'
import type { Media } from './media.model'

export type ContentStatus = 'draft' | 'published' | 'archived'

export type ContentMediaRole = 'hero' | 'gallery' | 'attachment' | 'inline' | 'og_image'

export type JsonObject = Record<string, unknown>

export interface ContentFieldValueInput {
  fieldId?: string
  fieldKey?: string
  value: unknown
  mediaAssets?: Pick<Media, 'id' | 'filename' | 'originalName' | 'mimeType' | 'size' | 'url' | 'previewUrl'>[]
}

export interface ContentMediaInput {
  mediaId?: string
  file?: File
  role?: ContentMediaRole
  order?: number
  meta?: JsonObject
}

export interface ContentFieldValue {
  id: string
  fieldId: string
  fieldKey: string
  fieldType: FieldType
  contentTypeVersion: number
  value: unknown
  mediaAssets?: Pick<Media, 'id' | 'filename' | 'originalName' | 'mimeType' | 'size' | 'url' | 'previewUrl'>[]
}

export interface ContentMedia {
  id: string
  mediaId: string
  role: ContentMediaRole
  order: number
  meta: JsonObject
  media?: Pick<Media, 'id' | 'filename' | 'originalName' | 'mimeType' | 'size' | 'url' | 'previewUrl'>
}

export interface Content {
  id: string
  title: string
  slug: string
  body: JsonObject | null
  seo: JsonObject
  config: JsonObject
  excerpt: string | null
  status: ContentStatus
  contentTypeId: string
  contentTypeVersion: number
  categoryId: string | null
  authorId: string
  coverImageId: string | null
  coverImage?: Pick<Media, 'id' | 'filename' | 'originalName' | 'mimeType' | 'size' | 'url' | 'previewUrl'> | null
  metaTitle: string | null
  metaDescription: string | null
  publishedAt: string | null
  publishedVersionId: string | null
  draftVersionId: string | null
  tagIds?: string[]
  fieldValues?: ContentFieldValue[]
  mediaItems?: ContentMedia[]
  createdAt: string
  updatedAt: string
}

export interface CreateContent {
  title: string
  slug: string
  contentTypeId: string
  categoryId?: string | null
  body?: JsonObject | null
  seo?: JsonObject
  config?: JsonObject
  excerpt?: string | null
  status?: ContentStatus
  coverImageId?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  publishedAt?: string | null
  tagIds?: string[]
  fieldValues?: ContentFieldValueInput[]
  mediaItems?: ContentMediaInput[]
}

export type UpdateContent = Partial<CreateContent>

export interface FilterContentParams {
  search?: string
  contentTypeId?: string
  categoryId?: string
  tagId?: string
  status?: ContentStatus
  withRelations?: boolean
  page?: number
  limit?: number
}

export interface ContentFieldValueSnapshot {
  fieldId: string
  fieldKey: string
  fieldType: FieldType
  contentTypeVersion: number
  value: unknown
}

export interface ContentTagSnapshot {
  id: string
  name: string
  slug: string
}

export interface ContentMediaSnapshot {
  id: string
  mediaId: string
  role: ContentMediaRole
  order: number
  meta: JsonObject
  media: {
    id: string
    filename: string
    originalName: string
    mimeType: string
    size: number
    url: string
  }
}

export interface ContentVersion {
  id: string
  contentId: string
  title: string
  slug: string
  body: JsonObject | null
  seo: JsonObject
  config: JsonObject
  excerpt: string | null
  status: ContentStatus
  contentTypeVersion: number
  categoryId: string | null
  coverImageId: string | null
  metaTitle: string | null
  metaDescription: string | null
  publishedAt: string | null
  fieldValuesSnapshot: ContentFieldValueSnapshot[] | null
  tagsSnapshot: ContentTagSnapshot[] | null
  mediaSnapshot: ContentMediaSnapshot[] | null
  version: number
  savedBy: string
  createdAt: string
}
