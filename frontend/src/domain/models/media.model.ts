export type StorageType = 'minio' | 's3' | 'cloudinary' | 'rustfs'

export interface Media {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  storage: StorageType
  uploadedById: string
  createdAt: string
  updatedAt: string
}
