import { ref } from 'vue'
import type { CreateRole, Role, UpdateRole } from '@/domain/models/role.model'
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

  async function createRole(payload: CreateRole) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const role = await roleService.create(payload)
      roles.value = [role, ...roles.value]
      return role
    } catch {
      errorMessage.value = 'No se pudo crear el rol.'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function updateRole(id: string, payload: UpdateRole) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const role = await roleService.update(id, payload)
      roles.value = roles.value.map((current) => current.id === role.id ? role : current)
      return role
    } catch {
      errorMessage.value = 'No se pudo actualizar el rol.'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function deleteRole(id: string) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      await roleService.delete(id)
      roles.value = roles.value.filter((role) => role.id !== id)
      return true
    } catch {
      errorMessage.value = 'No se pudo eliminar el rol.'
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    roles,
    isLoading,
    errorMessage,
    loadRoles,
    createRole,
    updateRole,
    deleteRole
  }
}
