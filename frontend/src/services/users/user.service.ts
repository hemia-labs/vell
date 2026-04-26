import BaseService from '@/services/base/base.services'
import type { CreateUser, UpdateUser, User } from '@/domain/models/user.model'
import type { FilterUserParams } from '@/domain/types/user.types'

const USER_ENDPOINT = '/api/v1/users'

class UserService extends BaseService {
  async findAll(params?: FilterUserParams): Promise<User[]> {
    const { data } = await this.client.get<User[]>(USER_ENDPOINT, { params })
    return data
  }

  async findById(id: string): Promise<User> {
    const { data } = await this.client.get<User>(`${USER_ENDPOINT}/${id}`)
    return data
  }

  async create(data: CreateUser): Promise<User> {
    const response = await this.client.post<User>(USER_ENDPOINT, data)
    return response.data
  }

  async update(id: string, data: UpdateUser): Promise<User> {
    const response = await this.client.put<User>(`${USER_ENDPOINT}/${id}`, data)
    return response.data
  }

  async delete(id: string, mode?: 'hard'): Promise<void> {
    await this.client.delete(`${USER_ENDPOINT}/${id}`, { params: { mode } })
  }

  async restore(id: string): Promise<User> {
    const response = await this.client.post<User>(`${USER_ENDPOINT}/${id}/restore`)
    return response.data
  }
}

export default UserService
