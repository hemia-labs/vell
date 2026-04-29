import type {
  FilterMediaParams,
  Media,
  MediaReferences,
  UpdateMedia,
} from '@/domain/models/media.model'
import BaseService from '@/services/base/base.services'

const MEDIA_ENDPOINT = '/api/v1/media'

class MediaLibraryService extends BaseService {
  async findAll(params?: FilterMediaParams): Promise<Media[]> {
    const { data } = await this.client.get<Media[]>(MEDIA_ENDPOINT, { params })
    return data
  }

  async findById(id: string): Promise<Media> {
    const { data } = await this.client.get<Media>(`${MEDIA_ENDPOINT}/${id}`)
    return data
  }

  async getPreviewUrl(id: string): Promise<string> {
    const { data } = await this.client.get<{ previewUrl: string }>(`${MEDIA_ENDPOINT}/${id}/preview-url`)
    return data.previewUrl
  }

  async getReferences(id: string): Promise<MediaReferences> {
    const { data } = await this.client.get<MediaReferences>(`${MEDIA_ENDPOINT}/${id}/references`)
    return data
  }

  async update(id: string, data: UpdateMedia): Promise<Media> {
    const response = await this.client.patch<Media>(`${MEDIA_ENDPOINT}/${id}`, data)
    return response.data
  }

  async delete(id: string, mode?: 'hard'): Promise<void> {
    await this.client.delete(`${MEDIA_ENDPOINT}/${id}`, { params: { mode } })
  }

  async restore(id: string): Promise<void> {
    await this.client.post(`${MEDIA_ENDPOINT}/${id}/restore`)
  }
}

export default MediaLibraryService
