import BaseService from '@/services/base/base.services'
import type { LoginModel } from '@/domain/models/login.model'
import type { User } from '@/domain/models/auth.model'
import { UnauthorizedError, BadRequestError } from '@/errors/http-errors'

class AuthService extends BaseService {
  async login(data: LoginModel): Promise<void> {
    try {
      await this.client.post('/api/v1/auth/login', data)
    } catch (error: unknown) {
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } }
        const status = axiosError.response?.status
        const message = axiosError.response?.data?.message

        if (status === 401) {
          throw new UnauthorizedError('Credenciales incorrectas')
        }
        if (status === 400) {
          throw new BadRequestError(message || 'Datos incorrectos o malformados')
        }
      }
      throw error
    }
  }

  async logout(): Promise<void> {
    await this.client.post('/api/v1/auth/logout')
  }

  async refresh(): Promise<void> {
    await this.client.post('/api/v1/auth/refresh')
  }

  async me(): Promise<User> {
    const { data } = await this.client.get<User>('/api/v1/auth/me')
    return data
  }
}

export default AuthService
