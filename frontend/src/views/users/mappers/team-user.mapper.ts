import { USER_AVATAR_CLASSES, USER_EMPTY_LAST_LOGIN } from '../config/user-list.config'
import type { User } from '@/domain/models/user.model'
import type { TeamUser } from '@/domain/types/user.types'

export function toTeamUser(user: User, index: number): TeamUser {
  const uniqueRoles = unique(user.roles.map((role) => role.name))
  const uniqueScopes = unique(user.roles.map((role) => role.scope))
  const lastLogin = formatLastLogin(user.lastLogin)

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    initials: getInitials(user.name),
    role: uniqueRoles[0] ?? 'Sin rol',
    roleMeta: uniqueRoles.length > 1 ? `+${uniqueRoles.length - 1}` : undefined,
    roles: uniqueRoles,
    scope: uniqueScopes[0] ?? 'Sin alcance',
    scopeMeta: uniqueScopes.length > 1 ? `+${uniqueScopes.length - 1}` : undefined,
    scopes: uniqueScopes,
    status: user.isActive ? 'Activo' : 'Suspendido',
    lastSeen: lastLogin.lastSeen,
    lastSeenMeta: lastLogin.lastSeenMeta,
    presence: user.isActive ? 'offline' : 'pending',
    avatarClass: getAvatarClass(index)
  }
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatLastLogin(lastLogin: string | null) {
  if (!lastLogin) return USER_EMPTY_LAST_LOGIN
  const date = new Date(lastLogin)

  if (Number.isNaN(date.getTime())) return USER_EMPTY_LAST_LOGIN

  return {
    lastSeen: date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
    lastSeenMeta: date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }
}

function getAvatarClass(index: number) {
  return USER_AVATAR_CLASSES[index % USER_AVATAR_CLASSES.length]
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(isString)))
}

function isString(value: string | null | undefined): value is string {
  return Boolean(value)
}
