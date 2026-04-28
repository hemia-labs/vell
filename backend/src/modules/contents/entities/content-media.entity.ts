import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Content } from './content.entity';
import { Media } from '../../media/entities/media.entity';

export enum ContentMediaRole {
  HERO = 'hero',
  GALLERY = 'gallery',
  ATTACHMENT = 'attachment',
  INLINE = 'inline',
  OG_IMAGE = 'og_image',
}

@Entity('content_media')
@Index('IDX_content_media_content_role_order', ['contentId', 'role', 'order'])
@Index('IDX_content_media_content_media_role_active_unique', ['contentId', 'mediaId', 'role'], { unique: true, where: '"deleted_at" IS NULL' })
export class ContentMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'content_id', type: 'uuid' })
  contentId: string;

  @ManyToOne(() => Content, (content) => content.mediaItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content: Content;

  @Column({ name: 'media_id', type: 'uuid' })
  mediaId: string;

  @ManyToOne(() => Media, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'media_id' })
  media: Media;

  @Column({ type: 'enum', enum: ContentMediaRole, default: ContentMediaRole.GALLERY })
  role: ContentMediaRole;

  @Column({ default: 0 })
  order: number;

  @Column({ type: 'jsonb', default: {} })
  meta: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}

export default ContentMedia;
