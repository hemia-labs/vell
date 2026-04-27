import type {
  ContentType,
  ContentTypeVersion,
  CreateContentType,
  FilterContentTypeParams,
  UpdateContentType,
} from '@/domain/models/content-type.model'
import BaseService from '@/services/base/base.services'

const CONTENT_TYPE_ENDPOINT = '/api/v1/content-types'

class ContentTypeService extends BaseService {
  async findAll(params?: FilterContentTypeParams): Promise<ContentType[]> {
    const { data } = await this.client.get<ContentType[]>(CONTENT_TYPE_ENDPOINT, { params })
    return data
  }

  async findById(id: string): Promise<ContentType> {
    const { data } = await this.client.get<ContentType>(`${CONTENT_TYPE_ENDPOINT}/${id}`)
    return data
  }

  async findBySlug(slug: string): Promise<ContentType> {
    const { data } = await this.client.get<ContentType>(`${CONTENT_TYPE_ENDPOINT}/slug/${slug}`)
    return data
  }

  async findVersions(id: string): Promise<ContentTypeVersion[]> {
    const { data } = await this.client.get<ContentTypeVersion[]>(`${CONTENT_TYPE_ENDPOINT}/${id}/versions`)
    return data
  }

  async create(data: CreateContentType): Promise<ContentType> {
    const response = await this.client.post<ContentType>(CONTENT_TYPE_ENDPOINT, data)
    return response.data
  }

  async update(id: string, data: UpdateContentType): Promise<ContentType> {
    const response = await this.client.put<ContentType>(`${CONTENT_TYPE_ENDPOINT}/${id}`, data)
    return response.data
  }

  async delete(id: string, mode?: 'hard'): Promise<void> {
    await this.client.delete(`${CONTENT_TYPE_ENDPOINT}/${id}`, { params: { mode } })
  }

  async restore(id: string): Promise<void> {
    await this.client.post(`${CONTENT_TYPE_ENDPOINT}/${id}/restore`)
  }

  async restoreVersion(id: string, version: number): Promise<ContentType> {
    const { data } = await this.client.post<ContentType>(`${CONTENT_TYPE_ENDPOINT}/${id}/versions/${version}/restore`)
    return data
  }
}

export default ContentTypeService
