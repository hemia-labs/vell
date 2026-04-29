import { ContentStatus } from "../entities/content.entity";
import { ContentMediaRole } from "../entities/content-media.entity";

export class ContentMediaAssetDto {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  previewUrl?: string;
}

export class ContentFieldValueDto {
  id: string;
  fieldId: string;
  fieldKey: string;
  fieldType: string;
  contentTypeVersion: number;
  value: unknown;
  mediaAssets?: ContentMediaAssetDto[];
}

export class ContentMediaDto {
  id: string;
  mediaId: string;
  role: ContentMediaRole;
  order: number;
  meta: Record<string, unknown>;
  media?: ContentMediaAssetDto;
}

export class ContentDto {
  id: string;
  title: string;
  slug: string;
  body: Record<string, unknown> | null;
  seo: Record<string, unknown>;
  config: Record<string, unknown>;
  excerpt: string | null;
  status: ContentStatus;
  contentTypeId: string;
  contentTypeVersion: number;
  categoryId: string | null;
  authorId: string;
  coverImageId: string | null;
  coverImage?: ContentMediaAssetDto | null;
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: Date | null;
  publishedVersionId: string | null;
  draftVersionId: string | null;
  tagIds?: string[];
  fieldValues?: ContentFieldValueDto[];
  mediaItems?: ContentMediaDto[];
  createdAt: Date;
  updatedAt: Date;
}
