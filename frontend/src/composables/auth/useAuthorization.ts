import { computed } from 'vue'
import { can as checkPermission, canAll, canAny, filterAuthorized, type PermissionRequirement } from '@/lib/authz'
import { useAuthStore } from '@/stores'

export function useAuthorization() {
  const authStore = useAuthStore()
  const permissions = computed(() => authStore.currentUser?.authorization.permissions ?? [])
  const roles = computed(() => authStore.currentUser?.authorization.roles ?? [])

  function can(requirement?: PermissionRequirement) {
    return checkPermission(permissions.value, requirement)
  }

  function cannot(requirement?: PermissionRequirement) {
    return !can(requirement)
  }

  function hasAny(requirements: string[]) {
    return canAny(permissions.value, requirements)
  }

  function hasAll(requirements: string[]) {
    return canAll(permissions.value, requirements)
  }

  function filterAllowed<T extends { permission?: PermissionRequirement }>(items: T[]) {
    return filterAuthorized(items, permissions.value)
  }

  return {
    permissions,
    roles,
    can,
    cannot,
    hasAny,
    hasAll,
    filterAllowed
  }
}
