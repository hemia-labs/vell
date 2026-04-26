import type {
  Category,
  CreateCategory,
  FilterCategoryParams,
  UpdateCategory,
} from '@/domain/models/category.model'
import BaseService from '@/services/base/base.services'

const CATEGORY_ENDPOINT = '/api/v1/categories'

class CategoryService extends BaseService {
  async findAll(params?: FilterCategoryParams): Promise<Category[]> {
    const { data } = await this.client.get<Category[]>(CATEGORY_ENDPOINT, { params })
    return data
  }

  async findById(id: string): Promise<Category> {
    const { data } = await this.client.get<Category>(`${CATEGORY_ENDPOINT}/${id}`)
    return data
  }

  async findBySlug(slug: string): Promise<Category> {
    const { data } = await this.client.get<Category>(`${CATEGORY_ENDPOINT}/slug/${slug}`)
    return data
  }

  async findChildren(id: string): Promise<Category[]> {
    const { data } = await this.client.get<Category[]>(`${CATEGORY_ENDPOINT}/${id}/children`)
    return data
  }

  async create(data: CreateCategory): Promise<Category> {
    const response = await this.client.post<Category>(CATEGORY_ENDPOINT, data)
    return response.data
  }

  async update(id: string, data: UpdateCategory): Promise<Category> {
    const response = await this.client.put<Category>(`${CATEGORY_ENDPOINT}/${id}`, data)
    return response.data
  }

  async delete(id: string, mode?: 'hard'): Promise<void> {
    await this.client.delete(`${CATEGORY_ENDPOINT}/${id}`, { params: { mode } })
  }

  async restore(id: string): Promise<void> {
    await this.client.post(`${CATEGORY_ENDPOINT}/${id}/restore`)
  }
}

export default CategoryService
