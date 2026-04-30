<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Filter,
  Plus,
  RefreshCw,
  AlertCircleIcon
} from 'lucide-vue-next'
import VActionMenu, { type VActionMenuAction } from '@/components/core/VActionMenu.vue'
import VDataTable, { type VDataTableColumn } from '@/components/core/VDataTable.vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger
} from '@/components/ui/menubar'
import { useAuthorization } from '@/composables/auth/useAuthorization'
import { useRoles } from '@/composables/roles/useRoles'
import { env } from '@/config/env'
import RoleFormDialog from './components/RoleFormDialog.vue'
import type { Role } from '@/domain/models/role.model'

const { roles, isLoading, errorMessage, loadRoles, deleteRole } = useRoles()
const { can, filterAllowed } = useAuthorization()
const currentPage = ref(1)
const isCreateRoleDialogOpen = ref(false)
const isEditRoleDialogOpen = ref(false)
const isDeleteRoleDialogOpen = ref(false)
const editRoleId = ref<string | null>(null)
const deleteRoleId = ref<string | null>(null)
const selectedRoleAction = ref<string | null>(null)
const itemsPerPage = 10

const roleTableColumns: VDataTableColumn[] = [
  { key: 'name', label: 'Rol' },
  { key: 'slug', label: 'Slug' },
  { key: 'scope', label: 'Alcance' },
  { key: 'level', label: 'Nivel' },
  { key: 'permissions', label: 'Permisos' },
  { key: 'description', label: 'Descripción' }
]

const paginationTotal = computed(() => roles.value.length)
const canWriteRoles = computed(() => env.VITE_ROLES_WRITE_ENABLED === true)
const hasRoleActions = computed(() => canWriteRoles.value && can(['roles:edit', 'roles:delete']))
const editRole = computed(() => roles.value.find((role) => role.id === editRoleId.value) ?? null)
const deletingRole = computed(() => roles.value.find((role) => role.id === deleteRoleId.value) ?? null)

function getRoleActions(role: Role): VActionMenuAction[] {
  if (!canWriteRoles.value) {
    return []
  }

  return [
    { key: 'edit', label: 'Editar rol', permission: 'roles:edit' },
    { key: 'delete', label: 'Eliminar rol', permission: 'roles:delete', danger: true, disabled: role.slug === 'super-admin' }
  ]
}

function handleRoleAction(action: VActionMenuAction, role: Role) {
  if (!can(action.permission)) {
    return
  }

  selectedRoleAction.value = action.key

  if (action.key === 'edit') {
    editRoleId.value = role.id
    isEditRoleDialogOpen.value = true
  }

  if (action.key === 'delete') {
    deleteRoleId.value = role.id
    isDeleteRoleDialogOpen.value = true
  }
}

async function submitRoleDelete() {
  if (!deletingRole.value) {
    return
  }

  const result = await deleteRole(deletingRole.value.id)
  if (!result) {
    return
  }

  isDeleteRoleDialogOpen.value = false
  deleteRoleId.value = null
}

onMounted(loadRoles)
</script>

<template>
  <div class="flex w-full flex-col gap-5.5">
    <section class="flex items-start justify-between gap-6 max-[760px]:flex-col max-[760px]:items-stretch">
      <div>
        <div class="mb-1 text-3xl font-semibold leading-tight tracking-[-0.02em] text-(--app-ink)">
          Roles
        </div>
        <p class="m-0 max-w-2xl text-[13.5px] text-(--app-muted)">
          Administra roles del sistema, alcance y permisos asociados.
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2 max-[760px]:flex-wrap">
        <Button variant="outline" size="sm" :disabled="isLoading" @click="loadRoles">
          <RefreshCw :size="14" :class="{ 'animate-spin': isLoading }" />
          Actualizar
        </Button>
        <Button v-if="canWriteRoles" v-can="'roles:create'" size="sm" @click="isCreateRoleDialogOpen = true">
          <Plus :size="14" />
          Nuevo rol
        </Button>
      </div>
    </section>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Lo sentimos, se produjo un error</AlertTitle>
      <AlertDescription>
        <p>{{ errorMessage }}</p>
        <ul class="mt-2 list-inside list-disc space-y-1">
          <li>Verifica tu conexión a internet</li>
          <li>Intenta nuevamente más tarde</li>
        </ul>
      </AlertDescription>
    </Alert>

    <section class="overflow-hidden rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) shadow-(--app-shadow)" aria-label="Lista de roles">
      <VDataTable
        v-model:page="currentPage"
        :rows="roles"
        :columns="roleTableColumns"
        row-key="id"
        :actions="hasRoleActions"
        pagination
        min-width-class="min-w-[900px]"
        :items-per-page="itemsPerPage"
        :total-items="paginationTotal"
        :empty-message="isLoading ? 'Cargando roles...' : 'No hay roles registrados.'"
      >
        <template #cell-name="{ row: role }">
          <span class="flex min-w-0 flex-col text-sm font-medium text-(--app-ink)">
            {{ role.name }}
          </span>
        </template>

        <template #cell-slug="{ row: role }">
          <Badge variant="secondary">{{ role.slug }}</Badge>
        </template>

        <template #cell-scope="{ row: role }">
          <Badge variant="secondary">{{ role.scope || 'Sin alcance' }}</Badge>
        </template>

        <template #cell-level="{ row: role }">
          <Badge variant="outline">Nivel {{ role.level }}</Badge>
        </template>

        <template #cell-permissions="{ row: role }">
          <div class="flex max-w-[360px] flex-wrap gap-1.5">
            <Badge
              v-for="permission in role.permissions.slice(0, 2)"
              :key="permission.id"
              variant="outline"
            >
              {{ permission.slug }}
            </Badge>
            <Menubar
              v-if="role.permissions.length > 2"
              class="h-auto border-0 bg-transparent p-0"
              @click.stop
            >
              <MenubarMenu>
                <MenubarTrigger class="h-auto rounded-full border border-(--app-line) bg-(--app-surface-2) px-2 py-0.5 text-[11px] font-medium text-(--app-ink-2)">
                  +{{ role.permissions.length - 2 }}
                </MenubarTrigger>
                <MenubarContent align="end" class="max-h-72 min-w-56 overflow-y-auto">
                  <MenubarItem
                    v-for="permission in role.permissions"
                    :key="permission.id"
                    class="flex-col items-start gap-0.5"
                    @select.prevent
                  >
                    <span class="text-[12.5px] font-medium text-(--app-ink)">{{ permission.slug }}</span>
                    <small class="text-[11px] text-(--app-muted)">{{ permission.description }}</small>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
            <span v-if="role.permissions.length === 0" class="text-[12.5px] text-(--app-muted)">
              Sin permisos
            </span>
          </div>
        </template>

        <template #cell-description="{ row: role }">
          <span class="line-clamp-2 text-[12.5px] text-(--app-ink-2)">
            {{ role.description || 'Sin descripción' }}
          </span>
        </template>

        <template #actions="{ row: role }">
          <VActionMenu
            v-if="filterAllowed(getRoleActions(role)).length"
            v-model="selectedRoleAction"
            :actions="filterAllowed(getRoleActions(role))"
            :label="`Acciones para ${role.name}`"
            @select="handleRoleAction($event, role)"
          />
        </template>

        <template #empty>
          <RefreshCw v-if="isLoading" class="mx-auto mb-2 animate-spin" :size="18" />
          <Filter v-else class="mx-auto mb-2" :size="18" />
          {{ isLoading ? 'Cargando roles...' : 'No hay roles registrados.' }}
        </template>

        <template #pagination-summary>
          Mostrando <strong>1-{{ roles.length }}</strong> de <strong>{{ roles.length }}</strong>
        </template>
      </VDataTable>
    </section>

    <RoleFormDialog
      v-model:open="isCreateRoleDialogOpen"
      mode="create"
      @saved="loadRoles"
    />
    <RoleFormDialog
      v-model:open="isEditRoleDialogOpen"
      mode="edit"
      :role="editRole"
      @saved="loadRoles"
    />

    <AlertDialog v-model:open="isDeleteRoleDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar rol</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará {{ deletingRole?.name || 'este rol' }}. Los usuarios con este rol perderán esos permisos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction class="bg-destructive text-white hover:bg-destructive/90" :disabled="isLoading" @click="submitRoleDelete">
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
