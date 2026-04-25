export interface RolePermission {
  id: string
  slug: string
  description: string
}

export interface Role {
  id: string
  name: string
  slug: string
  description: string | null
  scope: string | null
  permissions: RolePermission[]
}

export interface CreateRole {
  name: string
  slug: string
  description?: string
  scope?: string
  permissionIds: string[]
}

export type UpdateRole = Partial<CreateRole>
