import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum SettingType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  IMAGE = 'image',
  ARRAY = 'array',
  JSON = 'json',
}

export enum SettingGroup {
  GENERAL = 'general',
  CONTENT = 'content',
  MAIL = 'mail',
  SYSTEM = 'system',
  SEO = 'seo',
}

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  key: string;

  @Column({ type: 'jsonb', nullable: true })
  value: unknown;

  @Column({ type: 'enum', enum: SettingType, default: SettingType.TEXT })
  type: SettingType;

  @Column({ length: 100, default: SettingGroup.GENERAL })
  group: SettingGroup;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_public', default: false })
  isPublic: boolean;

  @Column({ name: 'is_readonly', default: false })
  isReadonly: boolean;

  @CreateDateColumn({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}