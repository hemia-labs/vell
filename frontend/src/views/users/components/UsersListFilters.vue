<script setup lang="ts">
import { computed } from 'vue'
import {
  ChevronDown,
  RotateCcw,
  Search,
  SlidersHorizontal
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarMenu,
  MenubarTrigger
} from '@/components/ui/menubar'
import type { FilterOption } from '@/domain/types/filter.types'

const search = defineModel<string>('search', { default: '' })
const selectedRoles = defineModel<string[]>('selectedRoles', { default: () => [] })
const selectedStatuses = defineModel<string[]>('selectedStatuses', { default: () => [] })
const selectedGroups = defineModel<string[]>('selectedGroups', { default: () => [] })

withDefaults(
  defineProps<{
    roleOptions?: FilterOption[]
    statusOptions?: FilterOption[]
    groupOptions?: FilterOption[]
    searchId?: string
    searchLabel?: string
    searchPlaceholder?: string
    roleLabel?: string
    statusLabel?: string
    groupLabel?: string
    columnsLabel?: string
    clearLabel?: string
    showColumnsButton?: boolean
  }>(),
  {
    roleOptions: () => [],
    statusOptions: () => [],
    groupOptions: () => [],
    searchId: 'users-search',
    searchLabel: 'Buscar usuarios',
    searchPlaceholder: 'Buscar por nombre o correo...',
    roleLabel: 'Rol',
    statusLabel: 'Estado',
    groupLabel: 'Grupo',
    columnsLabel: 'Columnas',
    clearLabel: 'Limpiar',
    showColumnsButton: true
  }
)

const activeFilterCount = computed(
  () => selectedRoles.value.length + selectedStatuses.value.length + selectedGroups.value.length
)

function updateOption(collection: string[], value: string, checked: boolean) {
  if (checked) {
    return collection.includes(value) ? collection : [...collection, value]
  }

  return collection.filter((item) => item !== value)
}

function toggleRole(role: string, checked: boolean) {
  selectedRoles.value = updateOption(selectedRoles.value, role, checked)
}

function toggleStatus(status: string, checked: boolean) {
  selectedStatuses.value = updateOption(selectedStatuses.value, status, checked)
}

function toggleGroup(group: string, checked: boolean) {
  selectedGroups.value = updateOption(selectedGroups.value, group, checked)
}

function clearFilters() {
  search.value = ''
  selectedRoles.value = []
  selectedStatuses.value = []
  selectedGroups.value = []
}
</script>

<template>
  <section class="flex flex-wrap items-center gap-2" aria-label="Filtros de usuarios">
    <Field class="min-w-[min(100%,280px)] flex-[1_1_320px]">
      <FieldLabel class="sr-only" :for="searchId">{{ searchLabel }}</FieldLabel>
      <FieldContent class="relative text-[var(--app-muted)]">
        <Search class="absolute left-3 top-1/2 z-[1] -translate-y-1/2" :size="14" />
        <Input
          :id="searchId"
          v-model="search"
          class="h-[34px] border-[var(--app-line)] bg-[var(--app-surface)] pl-[34px] text-[13px] text-[var(--app-ink)]"
          :placeholder="searchPlaceholder"
        />
      </FieldContent>
    </Field>

    <Menubar class="h-[34px] border-[var(--app-line)] bg-[var(--app-surface)] p-0.5 max-[760px]:w-full max-[760px]:justify-start max-[760px]:overflow-x-auto">
      <MenubarMenu v-if="roleOptions.length">
        <MenubarTrigger class="h-7 gap-1.5 text-[12.5px] text-[var(--app-ink-2)]" :class="{ 'text-[var(--app-ink)]': selectedRoles.length }">
          <span>{{ roleLabel }}</span>
          <b v-if="selectedRoles.length" class="rounded-full bg-[var(--app-ink)] px-1.5 py-px text-[10.5px] font-medium text-[var(--app-bg)]">{{ selectedRoles.length }}</b>
          <ChevronDown :size="12" />
        </MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem
            v-for="role in roleOptions"
            :key="role.value"
            :model-value="selectedRoles.includes(role.value)"
            @update:model-value="toggleRole(role.value, Boolean($event))"
          >
            {{ role.label }}
          </MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu v-if="statusOptions.length">
        <MenubarTrigger class="h-7 gap-1.5 text-[12.5px] text-[var(--app-ink-2)]" :class="{ 'text-[var(--app-ink)]': selectedStatuses.length }">
          <span>{{ statusLabel }}</span>
          <b v-if="selectedStatuses.length" class="rounded-full bg-[var(--app-ink)] px-1.5 py-px text-[10.5px] font-medium text-[var(--app-bg)]">{{ selectedStatuses.length }}</b>
          <ChevronDown :size="12" />
        </MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem
            v-for="status in statusOptions"
            :key="status.value"
            :model-value="selectedStatuses.includes(status.value)"
            @update:model-value="toggleStatus(status.value, Boolean($event))"
          >
            {{ status.label }}
          </MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu v-if="groupOptions.length">
        <MenubarTrigger class="h-7 gap-1.5 text-[12.5px] text-[var(--app-ink-2)]" :class="{ 'text-[var(--app-ink)]': selectedGroups.length }">
          <span>{{ groupLabel }}</span>
          <b v-if="selectedGroups.length" class="rounded-full bg-[var(--app-ink)] px-1.5 py-px text-[10.5px] font-medium text-[var(--app-bg)]">{{ selectedGroups.length }}</b>
          <ChevronDown :size="12" />
        </MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem
            v-for="group in groupOptions"
            :key="group.value"
            :model-value="selectedGroups.includes(group.value)"
            @update:model-value="toggleGroup(group.value, Boolean($event))"
          >
            {{ group.label }}
          </MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>

    <Button v-if="showColumnsButton" variant="outline" size="sm" class="h-[34px]">
      <SlidersHorizontal :size="14" />
      {{ columnsLabel }}
    </Button>

    <Button v-if="activeFilterCount || search" variant="ghost" size="sm" class="h-[34px]" @click="clearFilters">
      <RotateCcw :size="14" />
      {{ clearLabel }}
    </Button>
  </section>
</template>
