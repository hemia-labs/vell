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
import { Content } from './content.entity';
import { ContentTypeField } from '../../content-types/entities/content-type-field.entity';
import { FieldType } from '../../content-types/entities/field-type.enum';

@Entity('content_field_values')
@Index('IDX_content_field_values_content_field_active_unique', ['contentId', 'fieldId'], { unique: true, where: '"deleted_at" IS NULL' })
@Index('IDX_content_field_values_content', ['contentId'])
@Index('IDX_content_field_values_field', ['fieldId'])
export class ContentFieldValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'content_id', type: 'uuid' })
  contentId: string;

  @ManyToOne(() => Content, (content) => content.fieldValues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_id' })
  content: Content;

  @Column({ name: 'field_id', type: 'uuid' })
  fieldId: string;

  @ManyToOne(() => ContentTypeField, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'field_id' })
  field: ContentTypeField;

  @Column({ name: 'field_key', length: 100 })
  fieldKey: string;

  @Column({ name: 'field_type', type: 'enum', enum: FieldType })
  fieldType: FieldType;

  @Column({ name: 'content_type_version' })
  contentTypeVersion: number;

  @Index('IDX_content_field_values_value_gin', { synchronize: false })
  @Column({ type: 'jsonb', nullable: true })
  value: unknown;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

}

export default ContentFieldValue;
