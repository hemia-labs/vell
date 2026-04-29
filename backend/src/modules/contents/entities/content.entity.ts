import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';
import { ContentType } from '../../content-types/entities/content-type.entity';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { Media } from '../../media/entities/media.entity';
import { ContentFieldValue } from './content-field-value.entity';
import { ContentMedia } from './content-media.entity';

export enum ContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('contents')
@Index('IDX_contents_slug_type_active_unique', ['slug', 'contentTypeId'], { unique: true, where: '"deleted_at" IS NULL' })
@Index('IDX_contents_status', ['status'])
@Index('IDX_contents_content_type', ['contentTypeId'])
@Index('IDX_contents_category', ['categoryId'])
@Index('IDX_contents_author', ['authorId'])
@Index('IDX_contents_published_at', ['publishedAt'])
@Index('IDX_contents_created_at', ['createdAt'])
@Index('IDX_contents_type_status_published', ['contentTypeId', 'status', 'publishedAt'])
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 255, name: 'slug' })
  slug: string;

  @Column({ type: 'jsonb', nullable: true })
  body: Record<string, unknown> | null;

  @Column({ type: 'jsonb', default: {} })
  seo: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  config: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  excerpt: string | null;

  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.DRAFT })
  status: ContentStatus;

  @Column({ name: 'content_type_id', type: 'uuid' })
  contentTypeId: string;

  @Column({ name: 'content_type_version', default: 1 })
  contentTypeVersion: number;

  @ManyToOne(() => ContentType, (contentType) => contentType.contents, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'content_type_id' })
  contentType: ContentType;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => Category, (category) => category.contents, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'cover_image_id', type: 'uuid', nullable: true })
  coverImageId: string | null;

  @ManyToOne(() => Media, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cover_image_id' })
  coverImage: Media | null;

  @Column({ name: 'meta_title', length: 255, nullable: true })
  metaTitle: string | null;

  @Column({ name: 'meta_description', type: 'text', nullable: true })
  metaDescription: string | null;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'published_version_id', type: 'uuid', nullable: true })
  publishedVersionId: string | null;

  @Column({ name: 'draft_version_id', type: 'uuid', nullable: true })
  draftVersionId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @OneToMany(() => ContentFieldValue, (fieldValue) => fieldValue.content, { cascade: true })
  fieldValues: ContentFieldValue[];

  @OneToMany(() => ContentMedia, (contentMedia) => contentMedia.content, { cascade: true })
  mediaItems: ContentMedia[];

  @ManyToMany(() => Tag, (tag) => tag.contents)
  @JoinTable({
    name: 'content_tags',
    joinColumn: { name: 'content_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' }
  })
  tags: Tag[];
}

export default Content;
