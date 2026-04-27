import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { ContentTypeField } from './content-type-field.entity';
import { Content } from '../../contents/entities/content.entity';
import { ContentTypeVersion } from './content-type-version.entity';

@Entity('content_types')
@Index('IDX_content_types_slug_active_unique', ['slug'], { unique: true, where: '"deleted_at" IS NULL' })
@Index('IDX_content_types_name_active_unique', ['name'], { unique: true, where: '"deleted_at" IS NULL' })
export class ContentType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: 1 })
  version: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @OneToMany(() => ContentTypeField, (field) => field.contentType, { cascade: true })
  fields: ContentTypeField[];

  @OneToMany(() => Content, (content) => content.contentType)
  contents: Content[];

  @OneToMany(() => ContentTypeVersion, (version) => version.contentType)
  versions: ContentTypeVersion[];
}

export default ContentType;
