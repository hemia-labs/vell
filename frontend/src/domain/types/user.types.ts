export interface FilterUserParams {
  all?: boolean
  search?: string
  roleId?: string
  page?: number
  limit?: number
  withRoles?: boolean
  withRoleId?: boolean
  withPermissions?: boolean
}

export interface UpdateUserForm {
  name: string
  email: string
  roles: string[]
  isActive: boolean
}

export type UserStatus = 'Activo' | 'Invitado' | 'Suspendido' | 'Eliminado'

export type UserPresence = 'online' | 'away' | 'offline' | 'pending'

export interface TeamUser {
  id: string
  name: string
  email: string
  initials: string
  role: string
  roleMeta?: string
  roles: string[]
  scope: string
  scopeMeta?: string
  scopes: string[]
  status: UserStatus
  deletedAt: string | null
  lastSeen: string
  lastSeenMeta: string
  presence: UserPresence
  avatarClass: string
}
