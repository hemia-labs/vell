import type { VActionMenuAction } from '@/components/core/VActionMenu.vue'
import type { VDataTableColumn } from '@/components/core/VDataTable.vue'
import type { TeamUser, UserStatus } from '@/domain/types/user.types'

export const USER_ITEMS_PER_PAGE = 10

export const USER_STATUSES: UserStatus[] = ['Activo', 'Invitado', 'Suspendido']

export const USER_STATUS_OPTIONS = USER_STATUSES.map((status) => ({ label: status, value: status }))

export const USER_AVATAR_CLASSES = [
  'avatar-warm',
  'avatar-blue',
  'avatar-sand',
  'avatar-graphite',
  'avatar-gold',
  'avatar-brown',
  'avatar-earth',
  'avatar-slate'
]

export const USER_EMPTY_LAST_LOGIN = { lastSeen: 'Sin acceso', lastSeenMeta: '-' }

export const USER_COLUMNS: VDataTableColumn[] = [
  { key: 'member', label: 'Miembro' },
  { key: 'role', label: 'Rol' },
  { key: 'scope', label: 'Alcance' },
  { key: 'status', label: 'Estado' },
  { key: 'lastSeen', label: 'Última act.' }
]

export function getUserActions(user: TeamUser): VActionMenuAction[] {
  return [
    { key: 'edit', label: 'Editar usuario' },
    { key: 'roles', label: 'Cambiar roles' },
    {
      key: user.status === 'Suspendido' ? 'activate' : 'suspend',
      label: user.status === 'Suspendido' ? 'Reactivar usuario' : 'Suspender usuario',
      danger: user.status !== 'Suspendido'
    },
    { key: 'delete', label: 'Eliminar usuario', danger: true }
  ]
}
