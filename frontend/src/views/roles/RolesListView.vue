<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ChevronDown,
  Filter,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  AlertCircleIcon
} from 'lucide-vue-next'
import VDataTable, { type VDataTableColumn, type VDataTableKey } from '@/components/core/VDataTable.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger
} from '@/components/ui/menubar'
import { useRoles } from '@/composables/roles/useRoles'

const { roles, isLoading, errorMessage, loadRoles } = useRoles()
const search = ref('')
const selectedScopes = ref<string[]>([])
const selectedPermissions = ref<string[]>([])
const selectedIds = ref<VDataTableKey[]>([])
const currentPage = ref(1)
const itemsPerPage = 10

const roleTableColumns: VDataTableColumn[] = [
  { key: 'name', label: 'Rol' },
  { key: 'slug', label: 'Slug' },
  { key: 'scope', label: 'Alcance' },
  { key: 'permissions', label: 'Permisos' },
  { key: 'description', label: 'Descripción' }
]

const normalizedSearch = computed(() => search.value.trim().toLowerCase())
const paginationTotal = computed(() => Math.max(roles.value.length, filteredRoles.value.length))
const activeFilterCount = computed(() => selectedScopes.value.length + selectedPermissions.value.length)

const scopeOptions = computed(() => {
  return Array.from(new Set(roles.value.map((role) => role.scope).filter(Boolean)))
    .sort((current, next) => String(current).localeCompare(String(next)))
    .map((scope) => ({ label: String(scope), value: String(scope) }))
})

const permissionOptions = computed(() => {
  const permissions = roles.value.flatMap((role) => role.permissions.map((permission) => permission.slug))

  return Array.from(new Set(permissions))
    .sort((current, next) => current.localeCompare(next))
    .map((permission) => ({ label: permission, value: permission }))
})

const filteredRoles = computed(() => {
  return roles.value.filter((role) => {
    const matchesSearch =
      !normalizedSearch.value ||
      [
        role.name,
        role.slug,
        role.scope,
        role.description,
        ...role.permissions.map((permission) => permission.slug)
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch.value))
    const matchesScope = selectedScopes.value.length === 0 || Boolean(role.scope && selectedScopes.value.includes(role.scope))
    const matchesPermission =
      selectedPermissions.value.length === 0 ||
      role.permissions.some((permission) => selectedPermissions.value.includes(permission.slug))

    return matchesSearch && matchesScope && matchesPermission
  })
})

function updateOption(collection: string[], value: string, checked: boolean) {
  if (checked) {
    return collection.includes(value) ? collection : [...collection, value]
  }

  return collection.filter((item) => item !== value)
}

function toggleScope(scope: string, checked: boolean) {
  selectedScopes.value = updateOption(selectedScopes.value, scope, checked)
}

function togglePermission(permission: string, checked: boolean) {
  selectedPermissions.value = updateOption(selectedPermissions.value, permission, checked)
}

function clearFilters() {
  search.value = ''
  selectedScopes.value = []
  selectedPermissions.value = []
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
        <Button size="sm">
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

    <section class="flex items-center justify-between gap-3 max-[920px]:flex-col max-[920px]:items-stretch" aria-label="Filtros de roles">
      <Field class="min-w-[min(100%,280px)] flex-[1_1_360px]">
        <FieldLabel class="sr-only" for="roles-search">Buscar roles</FieldLabel>
        <FieldContent class="relative text-(--app-muted)">
          <Search class="absolute left-3 top-1/2 z-[1] -translate-y-1/2" :size="14" />
          <Input
            id="roles-search"
            v-model="search"
            class="h-8.5 border-(--app-line) bg-(--app-surface) pl-8.5 text-[13px] text-(--app-ink)"
            placeholder="Buscar por nombre, slug o permiso"
          />
        </FieldContent>
      </Field>

      <div class="flex shrink-0 items-center justify-end gap-2 max-[920px]:justify-between max-[760px]:flex-col max-[760px]:items-stretch">
        <Menubar class="h-8.5 border-(--app-line) bg-(--app-surface) p-0.5 max-[760px]:w-full max-[760px]:justify-start max-[760px]:overflow-x-auto">
          <MenubarMenu v-if="scopeOptions.length">
            <MenubarTrigger class="h-7 gap-1.5 text-[12.5px] text-(--app-ink-2)" :class="{ 'text-(--app-ink)': selectedScopes.length }">
              <span>Alcance</span>
              <b v-if="selectedScopes.length" class="rounded-full bg-(--app-ink) px-1.5 py-px text-[10.5px] font-medium text-(--app-bg)">{{ selectedScopes.length }}</b>
              <ChevronDown :size="12" />
            </MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem
                v-for="scope in scopeOptions"
                :key="scope.value"
                :model-value="selectedScopes.includes(scope.value)"
                @update:model-value="toggleScope(scope.value, Boolean($event))"
              >
                {{ scope.label }}
              </MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu v-if="permissionOptions.length">
            <MenubarTrigger class="h-7 gap-1.5 text-[12.5px] text-(--app-ink-2)" :class="{ 'text-(--app-ink)': selectedPermissions.length }">
              <span>Permiso</span>
              <b v-if="selectedPermissions.length" class="rounded-full bg-(--app-ink) px-1.5 py-px text-[10.5px] font-medium text-(--app-bg)">{{ selectedPermissions.length }}</b>
              <ChevronDown :size="12" />
            </MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem
                v-for="permission in permissionOptions"
                :key="permission.value"
                :model-value="selectedPermissions.includes(permission.value)"
                @update:model-value="togglePermission(permission.value, Boolean($event))"
              >
                {{ permission.label }}
              </MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>

          <div v-if="!permissionOptions.length && !scopeOptions.length" class="px-3 py-1">
            <span class="text-[12.5px] text-(--app-muted)">No hay filtros disponibles</span>
          </div>
        </Menubar>

        <Button v-if="activeFilterCount || search" variant="ghost" size="sm" class="h-[34px]" @click="clearFilters">
          <RotateCcw :size="14" />
          Limpiar
        </Button>

        <div class="min-w-25 text-right text-[12.5px] text-(--app-muted) max-[760px]:text-left">
          {{ filteredRoles.length }} de {{ roles.length }} roles
        </div>
      </div>
    </section>

    <section class="overflow-hidden rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) shadow-(--app-shadow)" aria-label="Lista de roles">
      <div class="flex min-h-11.5 items-center justify-between gap-4 border-b border-(--app-line) bg-(--app-surface-2) px-3.5 py-2 text-[12.5px] text-(--app-muted) max-[760px]:flex-col max-[760px]:items-stretch">
        <div class="inline-flex items-center gap-1.75 font-medium text-(--app-ink-2)">
          <ShieldCheck :size="15" />
          <span>{{ selectedIds.length }} seleccionados</span>
        </div>
        <div class="flex items-center gap-1.5 max-[760px]:flex-wrap">
          <Button variant="outline" size="sm">Duplicar</Button>
          <Button variant="outline" size="sm">Desactivar</Button>
          <Button variant="ghost" size="icon-sm" aria-label="Más acciones">
            <MoreHorizontal :size="15" />
          </Button>
        </div>
      </div>

      <VDataTable
        v-model:selected-keys="selectedIds"
        v-model:page="currentPage"
        :rows="filteredRoles"
        :columns="roleTableColumns"
        row-key="id"
        selectable
        actions
        pagination
        min-width-class="min-w-[900px]"
        :items-per-page="itemsPerPage"
        :total-items="paginationTotal"
        select-all-label="Seleccionar todos los roles visibles"
        :row-select-label="(role) => `Seleccionar rol ${role.name}`"
        :empty-message="isLoading ? 'Cargando roles...' : 'No hay roles que coincidan con la búsqueda.'"
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
          <span class="text-[12.5px] text-(--app-ink-2)">
            {{ role.scope || 'Sin alcance' }}
          </span>
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
          <Button variant="ghost" size="icon-sm" :aria-label="`Acciones para ${role.name}`">
            <MoreHorizontal :size="15" />
          </Button>
        </template>

        <template #empty>
          <RefreshCw v-if="isLoading" class="mx-auto mb-2 animate-spin" :size="18" />
          <Filter v-else class="mx-auto mb-2" :size="18" />
          {{ isLoading ? 'Cargando roles...' : 'No hay roles que coincidan con la búsqueda.' }}
        </template>

        <template #pagination-summary>
          Mostrando <strong>1-{{ filteredRoles.length }}</strong> de <strong>{{ roles.length }}</strong>
        </template>
      </VDataTable>
    </section>
  </div>
</template>
