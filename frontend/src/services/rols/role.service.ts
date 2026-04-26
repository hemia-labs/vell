import BaseService from '@/services/base/base.services'
import type { CreateRole, Role, UpdateRole } from '@/domain/models/role.model'

const ROLE_ENDPOINT = '/api/v1/roles'

class RoleService extends BaseService {
  async findAll(): Promise<Role[]> {
    const { data } = await this.client.get<Role[]>(`${ROLE_ENDPOINT}?permissions=true`)
    return data
  }

  async findById(id: string): Promise<Role> {
    const { data } = await this.client.get<Role>(`${ROLE_ENDPOINT}/${id}`)
    return data
  }

  async findBySlug(slug: string): Promise<Role> {
    const { data } = await this.client.get<Role>(`${ROLE_ENDPOINT}/slug/${slug}`)
    return data
  }

  async create(data: CreateRole): Promise<Role> {
    const response = await this.client.post<Role>(ROLE_ENDPOINT, data)
    return response.data
  }

  async update(id: string, data: UpdateRole): Promise<Role> {
    const response = await this.client.put<Role>(`${ROLE_ENDPOINT}/${id}`, data)
    return response.data
  }

  async delete(id: string, mode?: 'hard'): Promise<void> {
    await this.client.delete(`${ROLE_ENDPOINT}/${id}`, { params: { mode } })
  }

  async restore(id: string): Promise<void> {
    await this.client.post(`${ROLE_ENDPOINT}/${id}/restore`)
  }
}

export default RoleService
