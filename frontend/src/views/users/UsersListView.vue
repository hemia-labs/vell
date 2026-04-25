<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Filter,
  RefreshCw,
  UserPlus
} from 'lucide-vue-next'
import VActionMenu, { type VActionMenuAction } from '@/components/core/VActionMenu.vue'
import VDataTable, { type VDataTableKey } from '@/components/core/VDataTable.vue'
import CreateUserDialog from './components/CreateUserDialog.vue'
import UpdateUserDialog from './components/UpdateUserDialog.vue'
import UserMemberCell from './components/UserMemberCell.vue'
import UsersListFilters from './components/UsersListFilters.vue'
import {
  getUserActions,
  USER_COLUMNS,
  USER_ITEMS_PER_PAGE,
  USER_STATUS_OPTIONS
} from './config/user-list.config'
import { toTeamUser } from './mappers/team-user.mapper'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUserAdministration } from '@/composables/users/useUserAdministration'
import type { TeamUser } from '@/domain/types/user.types'

const { users, isLoading, errorMessage, loadUsers } = useUserAdministration()
const search = ref('')
const selectedIds = ref<VDataTableKey[]>([])
const selectedRoles = ref<string[]>([])
const selectedStatuses = ref<string[]>([])
const selectedGroups = ref<string[]>([])
const currentPage = ref(1)
const isCreateUserDialogOpen = ref(false)
const isUpdateUserDialogOpen = ref(false)
const updateUserId = ref<string | null>(null)
const selectedUserAction = ref<string | null>(null)

const normalizedSearch = computed(() => search.value.trim().toLowerCase())
const userRows = computed(() => users.value.map(toTeamUser))
const paginationTotal = computed(() => userRows.value.length)
const roleOptions = computed(() => toOptions(users.value.flatMap((user) => user.roles.map((role) => role.name))))
const groupOptions = computed(() => toOptions(users.value.flatMap((user) => user.roles.map((role) => role.scope))))

const filteredUsers = computed(() => {
  return userRows.value.filter((user) =>
    matchesSearch(user) &&
    matchesAny(selectedRoles.value, user.roles) &&
    matchesAny(selectedStatuses.value, [user.status]) &&
    matchesAny(selectedGroups.value, user.scopes)
  )
})

function loadAllUsers() {
  return loadUsers({ all: true })
}

function toOptions(values: Array<string | null | undefined>) {
  return unique(values)
    .sort((current, next) => current.localeCompare(next))
    .map((value) => ({ label: value, value }))
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(isString)))
}

function matchesSearch(user: TeamUser) {
  const searchValue = normalizedSearch.value

  return !searchValue || user.name.toLowerCase().includes(searchValue) || user.email.toLowerCase().includes(searchValue)
}

function matchesAny(selected: string[], values: string[]) {
  return selected.length === 0 || selected.some((value) => values.includes(value))
}

function isString(value: string | null | undefined): value is string {
  return Boolean(value)
}

function handleUserAction(action: VActionMenuAction, user: TeamUser) {
  selectedUserAction.value = action.key
  selectedIds.value = [user.id]

  if (action.key === 'edit') {
    updateUserId.value = user.id
    isUpdateUserDialogOpen.value = true
  }
}

onMounted(loadAllUsers)
</script>

<template>
  <div class="flex w-full flex-col gap-5.5">
    <Tabs default-value="members" class="gap-0 border-b border-(--app-line)">
      <TabsList class="h-auto w-fit rounded-none bg-transparent p-0 text-(--app-muted)">
        <TabsTrigger
          value="members"
          class="h-10.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-3.5 text-[13px] shadow-none data-[state=active]:border-(--app-ink) data-[state=active]:bg-transparent data-[state=active]:text-(--app-ink) data-[state=active]:shadow-none"
        >
          Miembros
          <span class="rounded-full border border-(--app-line) bg-(--app-surface-2) px-1.5 py-px text-[10.5px] text-(--app-muted)">
            {{ users.length }}
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="audit"
          class="h-10.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-3.5 text-[13px] shadow-none data-[state=active]:border-(--app-ink) data-[state=active]:bg-transparent data-[state=active]:text-(--app-ink) data-[state=active]:shadow-none"
        >
          Auditoría
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <section class="flex items-start justify-between gap-6 max-[760px]:flex-col max-[760px]:items-stretch">
      <div>
        <div class="mb-1 text-3xl font-semibold leading-tight tracking-[-0.02em] text-(--app-ink)">
          Usuarios
        </div>
        <p class="m-0 max-w-2xl text-[13.5px] text-(--app-muted)">
          Administra los usuarios del sistema, su acceso, estado y actividad.
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2 max-[760px]:flex-wrap">
        <Button variant="outline" size="sm" :disabled="isLoading" @click="loadAllUsers">
          <RefreshCw :size="14" :class="{ 'animate-spin': isLoading }" />
          Actualizar
        </Button>
        <Button size="sm" @click="isCreateUserDialogOpen = true">
          <UserPlus :size="14" />
          Nuevo usuario
        </Button>
      </div>
    </section>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <UsersListFilters
      v-model:search="search"
      v-model:selected-roles="selectedRoles"
      v-model:selected-statuses="selectedStatuses"
      v-model:selected-groups="selectedGroups"
      :role-options="roleOptions"
      :status-options="USER_STATUS_OPTIONS"
      :group-options="groupOptions"
    />

    <section class="overflow-hidden rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) shadow-(--app-shadow)" aria-label="Lista de usuarios">

      <VDataTable
        v-model:selected-keys="selectedIds"
        v-model:page="currentPage"
        :rows="filteredUsers"
        :columns="USER_COLUMNS"
        row-key="id"
        actions
        pagination
        :items-per-page="USER_ITEMS_PER_PAGE"
        :total-items="paginationTotal"
        select-all-label="Seleccionar todos los usuarios visibles"
        :row-select-label="(user) => `Seleccionar a ${user.name}`"
        :empty-message="isLoading ? 'Cargando usuarios...' : 'No hay usuarios que coincidan con los filtros.'"
      >
        <template #cell-member="{ row: user }">
          <UserMemberCell :user="user" />
        </template>
        <template #cell-role="{ row: user }">
          <Badge :variant="user.role === 'Owner' ? 'default' : 'secondary'">
            {{ user.role }}
          </Badge>
          <Badge v-if="user.roleMeta" variant="outline" class="ml-1.5">
            {{ user.roleMeta }}
          </Badge>
        </template>
        <template #cell-scope="{ row: user }">
          <Badge variant="secondary">
            {{ user.scope }}
          </Badge>
          <Badge v-if="user.scopeMeta" variant="outline" class="ml-1.5">
            {{ user.scopeMeta }}
          </Badge>
        </template>
        <template #cell-status="{ row: user }">
          <Badge
            :variant="user.status === 'Suspendido' ? 'destructive' : user.status === 'Invitado' ? 'outline' : 'default'"
            :class="'status-' + user.status.toLowerCase()"
          >
            {{ user.status }}
          </Badge>
        </template>
        <template #cell-lastSeen="{ row: user }">
          <span class="flex min-w-0 flex-col text-xs text-(--app-ink-2)">
            {{ user.lastSeen }}
            <small class="text-[11px] text-(--app-muted)">{{ user.lastSeenMeta }}</small>
          </span>
        </template>

        <template #actions="{ row: user }">
          <VActionMenu
            v-model="selectedUserAction"
            :actions="getUserActions(user)"
            :label="`Acciones para ${user.name}`"
            @select="handleUserAction($event, user)"
          />
        </template>

        <template #empty>
          <RefreshCw v-if="isLoading" class="mx-auto mb-2 animate-spin" :size="18" />
          <Filter v-else class="mx-auto mb-2" :size="18" />
          {{ isLoading ? 'Cargando usuarios...' : 'No hay usuarios que coincidan con los filtros.' }}
        </template>

        <template #pagination-summary>
          Mostrando <strong>1-{{ filteredUsers.length }}</strong> de <strong>{{ userRows.length }}</strong>
        </template>
      </VDataTable>
    </section>

    <CreateUserDialog
      v-model:open="isCreateUserDialogOpen"
      @created="loadAllUsers"
    />
    <UpdateUserDialog
      v-model:open="isUpdateUserDialogOpen"
      :user-id="updateUserId"
      @updated="loadAllUsers"
    />
  </div>
</template>

<style scoped>
.status-pill {
  gap: 5px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  text-transform: uppercase;
}

.status-pill::before {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: currentColor;
  content: '';
}

.status-activo {
  background: #e8f2ec;
  color: #1f7a4c;
}

.status-invitado {
  background: #f6efdd;
  color: #8a6a1e;
}

.status-suspendido {
  background: #f4e5e5;
  color: #8b2f2f;
}
</style>
