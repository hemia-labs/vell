import { ref } from 'vue'
import type { RolePermission } from '@/domain/models/role.model'
import PermissionService from '@/services/permissions/permission.service'

const permissionService = new PermissionService()

export function usePermissions() {
  const permissions = ref<RolePermission[]>([])
  const isLoading = ref(false)
  const errorMessage = ref('')

  async function loadPermissions() {
    isLoading.value = true
    errorMessage.value = ''

    try {
      permissions.value = await permissionService.findAll()
      return permissions.value
    } catch {
      errorMessage.value = 'No se pudieron cargar los permisos.'
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    permissions,
    isLoading,
    errorMessage,
    loadPermissions
  }
}
