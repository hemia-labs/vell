import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Content } from './content.entity';
import { ContentTypeField } from '../../content-types/entities/content-type-field.entity';

@Entity('content_field_values')
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