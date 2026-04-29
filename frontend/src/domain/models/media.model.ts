export type StorageType = 'minio' | 's3' | 'cloudinary' | 'rustfs'
export type MediaKind = 'image' | 'video' | 'audio' | 'pdf'

export interface MediaUploader {
  id: string
  name: string
  email: string
}

export interface Media {
  id: string
  filename: string
  storageKey?: string | null
  originalName: string
  mimeType: string
  size: number
  url: string
  previewUrl?: string
  storage: StorageType
  uploadedById: string | null
  uploadedBy?: MediaUploader
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface FilterMediaParams {
  search?: string
  mimeType?: string
  kind?: MediaKind
  storage?: StorageType
  uploadedById?: string
  withUploader?: boolean
  withDeleted?: boolean
  onlyDeleted?: boolean
  page?: number
  limit?: number
}

export interface UpdateMedia {
  originalName?: string
}

export interface MediaReferences {
  contentMedia: number
  coverImages: number
  fieldValues: number
  total: number
}
