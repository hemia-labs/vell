import type { Role } from '@/domain/models/role.model'

export interface User {
  id: string
  name: string
  email: string
  avatar: string | null
  roles: Role[]
  lastLogin: string | null
  isActive: boolean
}

export interface CreateUser {
  name: string
  email: string
  password: string
  roles: string[]
}

export interface UpdateUser {
  name?: string
  email?: string
  roles?: string[]
  isActive?: boolean
  avatar?: string | null
}
