import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  DeleteDateColumn,
} from 'typeorm';
import { Content, ContentStatus } from './content.entity';
import { User } from '../../users/entities/user.entity';
import { FieldType } from '../../content-types/entities/field-type.enum';
import { ContentMediaRole } from './content-media.entity';

export interface ContentFieldValueSnapshot {
  fieldId: string;
  fieldKey: string;
  fieldType: FieldType;
  contentTypeVersion: number;
  value: unknown;
}

export interface ContentTagSnapshot {
  id: string;
  name: string;
  slug: string;
}

export interface ContentMediaSnapshot {
  id: string;
  mediaId: string;
  role: ContentMediaRole;
  order: number;
  meta: Record<string, unknown>;
  media: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  };
}

@Entity('content_versions')
@Index(['contentId', 'version'], { unique: true })
export class ContentVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'content_id', type: 'uuid' })
  contentId: string;

  @ManyToOne(() => Content, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content: Content;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 255 })
  slug: string;

  @Column({ type: 'jsonb', nullable: true })
  body: Record<string, unknown> | null;

  @Column({ type: 'jsonb', default: {} })
  seo: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  config: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  excerpt: string | null;

  @Column({ type: 'enum', enum: ContentStatus })
  status: ContentStatus;

  @Column({ name: 'content_type_version' })
  contentTypeVersion: number;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @Column({ name: 'cover_image_id', type: 'uuid', nullable: true })
  coverImageId: string | null;

  @Column({ name: 'meta_title', length: 255, nullable: true })
  metaTitle: string | null;

  @Column({ name: 'meta_description', type: 'text', nullable: true })
  metaDescription: string | null;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'field_values_snapshot', type: 'jsonb', nullable: true })
  fieldValuesSnapshot: ContentFieldValueSnapshot[] | null;

  @Column({ name: 'tags_snapshot', type: 'jsonb', nullable: true })
  tagsSnapshot: ContentTagSnapshot[] | null;

  @Column({ name: 'media_snapshot', type: 'jsonb', nullable: true })
  mediaSnapshot: ContentMediaSnapshot[] | null;

  @Column()
  version: number;

  @Column({ name: 'saved_by', type: 'uuid' })
  savedBy: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'saved_by' })
  savedByUser: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

}

export default ContentVersion;
