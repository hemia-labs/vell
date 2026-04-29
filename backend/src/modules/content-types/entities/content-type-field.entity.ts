import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { ContentType } from './content-type.entity';
import { FieldType } from './field-type.enum';

@Entity('content_type_fields')
@Index('IDX_content_type_fields_type_key', ['contentTypeId', 'fieldKey'], { unique: true, where: '"deleted_at" IS NULL' })
@Index('IDX_content_type_fields_type_order', ['contentTypeId', 'order'])
export class ContentTypeField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'content_type_id', type: 'uuid' })
  contentTypeId: string;

  @ManyToOne(() => ContentType, (contentType) => contentType.fields, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_type_id' })
  contentType: ContentType;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'field_key', length: 100 })
  fieldKey: string;

  @Column({ name: 'field_type', type: 'enum', enum: FieldType })
  fieldType: FieldType;

  @Column({ name: 'is_required', default: false })
  isRequired: boolean;

  @Column({ default: false })
  multiple: boolean;

  @Column({ type: 'jsonb', default: {} })
  meta: Record<string, unknown>;

  @Column({ default: 0 })
  order: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}

export default ContentTypeField;
