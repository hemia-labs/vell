import type {
  Content,
  ContentVersion,
  CreateContent,
  FilterContentParams,
  UpdateContent,
} from '@/domain/models/content.model'
import BaseService from '@/services/base/base.services'

const CONTENT_ENDPOINT = '/api/v1/contents'

class ContentService extends BaseService {
  async findAll(params?: FilterContentParams): Promise<Content[]> {
    const { data } = await this.client.get<Content[]>(CONTENT_ENDPOINT, { params })
    return data
  }

  async findById(id: string): Promise<Content> {
    const { data } = await this.client.get<Content>(`${CONTENT_ENDPOINT}/${id}`)
    return data
  }

  async findBySlug(contentTypeId: string, slug: string): Promise<Content> {
    const { data } = await this.client.get<Content>(`${CONTENT_ENDPOINT}/slug/${contentTypeId}/${slug}`)
    return data
  }

  async findVersions(id: string): Promise<ContentVersion[]> {
    const { data } = await this.client.get<ContentVersion[]>(`${CONTENT_ENDPOINT}/${id}/versions`)
    return data
  }

  async create(data: CreateContent): Promise<Content> {
    const response = await this.client.post<Content>(CONTENT_ENDPOINT, data)
    return response.data
  }

  async update(id: string, data: UpdateContent): Promise<Content> {
    const response = await this.client.put<Content>(`${CONTENT_ENDPOINT}/${id}`, data)
    return response.data
  }

  async delete(id: string, mode?: 'hard'): Promise<void> {
    await this.client.delete(`${CONTENT_ENDPOINT}/${id}`, { params: { mode } })
  }

  async restore(id: string): Promise<void> {
    await this.client.post(`${CONTENT_ENDPOINT}/${id}/restore`)
  }
}

export default ContentService
