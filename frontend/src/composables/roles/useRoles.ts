import { ref } from 'vue'
import type { Role } from '@/domain/models/role.model'
import RoleService from '@/services/rols/role.service'

const roleService = new RoleService()

export function useRoles() {
  const roles = ref<Role[]>([])
  const isLoading = ref(false)
  const errorMessage = ref('')

  async function loadRoles() {
    isLoading.value = true
    errorMessage.value = ''

    try {
      roles.value = await roleService.findAll()
    } catch {
      errorMessage.value = 'No se pudieron cargar los roles.'
    } finally {
      isLoading.value = false
    }
  }

  return {
    roles,
    isLoading,
    errorMessage,
    loadRoles
  }
}
