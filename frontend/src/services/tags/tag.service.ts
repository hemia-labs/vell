import type {
  CreateTag,
  FilterTagParams,
  Tag,
  UpdateTag,
} from '@/domain/models/tag.model'
import BaseService from '@/services/base/base.services'

const TAG_ENDPOINT = '/api/v1/tags'

class TagService extends BaseService {
  async findAll(params?: FilterTagParams): Promise<Tag[]> {
    const { data } = await this.client.get<Tag[]>(TAG_ENDPOINT, { params })
    return data
  }

  async findById(id: string): Promise<Tag> {
    const { data } = await this.client.get<Tag>(`${TAG_ENDPOINT}/${id}`)
    return data
  }

  async findBySlug(slug: string): Promise<Tag> {
    const { data } = await this.client.get<Tag>(`${TAG_ENDPOINT}/slug/${slug}`)
    return data
  }

  async create(data: CreateTag): Promise<Tag> {
    const response = await this.client.post<Tag>(TAG_ENDPOINT, data)
    return response.data
  }

  async update(id: string, data: UpdateTag): Promise<Tag> {
    const response = await this.client.put<Tag>(`${TAG_ENDPOINT}/${id}`, data)
    return response.data
  }

  async delete(id: string, mode?: 'hard'): Promise<void> {
    await this.client.delete(`${TAG_ENDPOINT}/${id}`, { params: { mode } })
  }

  async restore(id: string): Promise<void> {
    await this.client.post(`${TAG_ENDPOINT}/${id}/restore`)
  }
}

export default TagService
