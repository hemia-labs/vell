import { ContentStatus } from "../entities/content.entity";
import { ContentMediaRole } from "../entities/content-media.entity";

export class ContentFieldValueDto {
  id: string;
  fieldId: string;
  fieldKey: string;
  fieldType: string;
  contentTypeVersion: number;
  value: unknown;
}

export class ContentMediaDto {
  id: string;
  mediaId: string;
  role: ContentMediaRole;
  order: number;
  meta: Record<string, unknown>;
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
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: Date | null;
  tagIds?: string[];
  fieldValues?: ContentFieldValueDto[];
  mediaItems?: ContentMediaDto[];
  createdAt: Date;
  updatedAt: Date;
}
