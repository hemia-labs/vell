export type PermissionRequirement = string | string[] | {
  any?: string[]
  all?: string[]
}

export function can(permissions: string[], requirement?: PermissionRequirement) {
  if (!requirement) {
    return true
  }

  if (permissions.includes('*')) {
    return true
  }

  if (typeof requirement === 'object' && !Array.isArray(requirement)) {
    const matchesAny = !requirement.any?.length || canAny(permissions, requirement.any)
    const matchesAll = !requirement.all?.length || canAll(permissions, requirement.all)

    return matchesAny && matchesAll
  }

  return canAny(permissions, Array.isArray(requirement) ? requirement : [requirement])
}

export function canAny(permissions: string[], requirements: string[]) {
  return requirements.some((requiredPermission) => hasPermission(permissions, requiredPermission))
}

export function canAll(permissions: string[], requirements: string[]) {
  return requirements.every((requiredPermission) => hasPermission(permissions, requiredPermission))
}

export function filterAuthorized<T extends { permission?: PermissionRequirement }>(items: T[], permissions: string[]) {
  return items.filter((item) => can(permissions, item.permission))
}

function hasPermission(permissions: string[], requiredPermission: string) {
  return permissions.some((permission) => {
    if (permission === '*' || permission === requiredPermission) {
      return true
    }

    if (permission.endsWith(':*')) {
      const prefix = permission.slice(0, -1)

      return requiredPermission.startsWith(prefix)
    }

    return false
  })
}
