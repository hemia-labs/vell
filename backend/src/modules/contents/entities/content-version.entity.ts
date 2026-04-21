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
import { Content } from './content.entity';
import { User } from '../../users/entities/user.entity';

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

  @Column({ type: 'jsonb', nullable: true })
  body: Record<string, unknown> | null;

  @Column({ name: 'field_values_snapshot', type: 'jsonb', nullable: true })
  fieldValuesSnapshot: Record<string, unknown> | null;

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