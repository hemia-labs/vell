import type { PermissionRequirement } from '@/lib/authz'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    title?: string
    permissions?: PermissionRequirement
  }
}
