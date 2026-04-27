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
import { ContentType } from './content-type.entity';

export interface ContentTypeSchemaSnapshot {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  version: number;
  fields: Array<{
    id: string;
    name: string;
    fieldKey: string;
    fieldType: string;
    isRequired: boolean;
    meta: Record<string, unknown>;
    order: number;
  }>;
}

@Entity('content_type_versions')
@Index(['contentTypeId', 'version'], { unique: true })
export class ContentTypeVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'content_type_id', type: 'uuid' })
  contentTypeId: string;

  @ManyToOne(() => ContentType, (contentType) => contentType.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_type_id' })
  contentType: ContentType;

  @Column()
  version: number;

  @Column({ name: 'schema_snapshot', type: 'jsonb' })
  schemaSnapshot: ContentTypeSchemaSnapshot;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}

export default ContentTypeVersion;
