import { StorageType } from "../entities/media.entity";

export class MediaUploaderDto {
  id: string;
  name: string;
  email: string;
}

export class MediaDto {
  id: string;
  filename: string;
  storageKey: string | null;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  previewUrl?: string;
  storage: StorageType;
  uploadedById: string | null;
  uploadedBy?: MediaUploaderDto;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class MediaReferencesDto {
  contentMedia: number;
  coverImages: number;
  fieldValues: number;
  total: number;
}
