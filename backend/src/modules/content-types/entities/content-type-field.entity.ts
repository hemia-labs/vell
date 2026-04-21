import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ContentType } from './content-type.entity';
import { FieldType } from './field-type.enum';

@Entity('content_type_fields')
export class ContentTypeField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'content_type_id' })
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

  @Column({ default: 0 })
  order: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}

export default ContentTypeField;