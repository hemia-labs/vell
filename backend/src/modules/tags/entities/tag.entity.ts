import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  DeleteDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Content } from '../../contents/entities/content.entity';

@Entity('tags')
@Index('IDX_tags_name_active_unique', ['name'], { unique: true, where: '"deleted_at" IS NULL' })
@Index('IDX_tags_slug_active_unique', ['slug'], { unique: true, where: '"deleted_at" IS NULL' })
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100 })
  slug: string;

  @ManyToMany(() => Content, (content) => content.tags)
  contents: Content[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}

export default Tag;
