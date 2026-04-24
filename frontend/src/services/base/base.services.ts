import axios, { type AxiosInstance } from 'axios'
import { env } from '@/config/env'
import { useAuthStore } from '@/stores'

class BaseService {
  private static instance: AxiosInstance | null = null
  protected readonly client: AxiosInstance

  constructor() {
    this.client = BaseService.getInstance()
  }

  public static getInstance(): AxiosInstance {
    if (!BaseService.instance) {
      BaseService.instance = axios.create({
        baseURL: env.VITE_API_URL,
        timeout: env.VITE_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      })

      BaseService.instance.interceptors.response.use(
        (response) => response,
        async (error) => {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            const authStore = useAuthStore()
            authStore.clearUser()
            const requestUrl = error.config?.url ?? ''
            const isAuthMeRequest = requestUrl.includes('/api/v1/auth/me')

            const { default: router } = await import('@/router')
            const isLoginRoute = router.currentRoute.value.name === 'login'

            if (!isLoginRoute && !isAuthMeRequest) {
              await router.replace({ name: 'login' })
            }
          }

          return Promise.reject(error)
        }
      )
    }

    return BaseService.instance
  }
}

export const api = BaseService.getInstance()
export default BaseService
