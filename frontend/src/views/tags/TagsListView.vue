<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { AlertCircleIcon, Hash, Plus, RefreshCw, Search } from 'lucide-vue-next'
import VActionMenu, { type VActionMenuAction } from '@/components/core/VActionMenu.vue'
import VDataTable, { type VDataTableColumn, type VDataTableKey } from '@/components/core/VDataTable.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuthorization } from '@/composables/auth/useAuthorization'
import { useTags } from '@/composables/tags/useTags'
import type { Tag } from '@/domain/models/tag.model'
import DeleteTagDialog from './components/DeleteTagDialog.vue'
import TagFormDialog from './components/TagFormDialog.vue'

const ITEMS_PER_PAGE = 10

const {
  tags,
  v$,
  isLoading,
  errorMessage,
  loadTags,
  loadTagById,
  submitCreateTag,
  submitUpdateTag,
  deleteTag,
  resetForm
} = useTags()
const { can, filterAllowed } = useAuthorization()

const search = ref('')
const selectedIds = ref<VDataTableKey[]>([])
const currentPage = ref(1)
const isFormDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const selectedTagId = ref<string | null>(null)
const selectedAction = ref<string | null>(null)

const columns: VDataTableColumn[] = [
  { key: 'name', label: 'Etiqueta' },
  { key: 'slug', label: 'Slug' },
  { key: 'contents', label: 'Contenidos' },
  { key: 'updatedAt', label: 'Actualización' }
]

const actions: VActionMenuAction[] = [
  { key: 'edit', label: 'Editar', permission: 'tags:edit' },
  { key: 'delete', label: 'Eliminar', permission: 'tags:delete', danger: true }
]

const normalizedSearch = computed(() => search.value.trim().toLowerCase())
const allowedActions = computed(() => filterAllowed(actions))
const filteredTags = computed(() => {
  return tags.value.filter((tag) => {
    if (!normalizedSearch.value) {
      return true
    }

    return [tag.name, tag.slug]
      .some((value) => value.toLowerCase().includes(normalizedSearch.value))
  })
})
const pagedTags = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  return filteredTags.value.slice(start, start + ITEMS_PER_PAGE)
})
const selectedTag = computed(() => {
  return tags.value.find((tag) => tag.id === selectedTagId.value) ?? null
})
const hasActions = computed(() => can(['tags:edit', 'tags:delete']))

watch(search, () => {
  currentPage.value = 1
})

async function loadAll() {
  await loadTags({ withContents: true })
}

function openCreateDialog() {
  formMode.value = 'create'
  selectedTagId.value = null
  resetForm()
  isFormDialogOpen.value = true
}

async function openEditDialog(tag: Tag) {
  formMode.value = 'edit'
  selectedTagId.value = tag.id
  await loadTagById(tag.id)
  isFormDialogOpen.value = true
}

function handleAction(action: VActionMenuAction, tag: Tag) {
  if (!can(action.permission)) {
    return
  }

  selectedAction.value = action.key
  selectedTagId.value = tag.id

  if (action.key === 'edit') {
    openEditDialog(tag)
  }

  if (action.key === 'delete') {
    isDeleteDialogOpen.value = true
  }
}

async function submitForm() {
  const result = formMode.value === 'create'
    ? await submitCreateTag()
    : selectedTagId.value ? await submitUpdateTag(selectedTagId.value) : null

  if (!result) {
    return
  }

  isFormDialogOpen.value = false
  resetForm()
  await loadAll()
}

async function confirmDelete() {
  if (!selectedTagId.value) {
    return
  }

  const result = await deleteTag(selectedTagId.value)
  if (!result) {
    return
  }

  isDeleteDialogOpen.value = false
  selectedTagId.value = null
  await loadAll()
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(loadAll)
</script>

<template>
  <div class="flex w-full flex-col gap-5.5">
    <section class="flex items-start justify-between gap-6 max-[760px]:flex-col max-[760px]:items-stretch">
      <div>
        <div class="mb-1 text-3xl font-semibold leading-tight text-(--app-ink)">
          Etiquetas
        </div>
        <p class="m-0 max-w-2xl text-[13.5px] text-(--app-muted)">
          Administra palabras clave planas para describir y filtrar contenidos.
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2 max-[760px]:flex-wrap">
        <Button variant="outline" size="sm" :disabled="isLoading" @click="loadAll">
          <RefreshCw :size="14" :class="{ 'animate-spin': isLoading }" />
          Actualizar
        </Button>
        <Button v-can="'tags:create'" size="sm" @click="openCreateDialog">
          <Plus :size="14" />
          Nueva etiqueta
        </Button>
      </div>
    </section>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <section class="grid gap-4">
      <div class="flex min-w-0 flex-col gap-4">
        <section class="flex items-center justify-between gap-3 max-[760px]:flex-col max-[760px]:items-stretch" aria-label="Filtros de etiquetas">
          <Field class="min-w-[min(100%,320px)] flex-[1_1_420px]">
            <FieldLabel class="sr-only" for="tags-search">Buscar etiquetas</FieldLabel>
            <FieldContent class="relative text-(--app-muted)">
              <Search class="absolute left-3 top-1/2 z-[1] -translate-y-1/2" :size="14" />
              <Input
                id="tags-search"
                v-model="search"
                class="h-8.5 border-(--app-line) bg-(--app-surface) pl-8.5 text-[13px] text-(--app-ink)"
                placeholder="Buscar por nombre o slug"
              />
            </FieldContent>
          </Field>

          <div class="text-[12.5px] text-(--app-muted)">
            {{ filteredTags.length }} de {{ tags.length }} etiquetas
          </div>
        </section>

        <section class="overflow-hidden rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) shadow-(--app-shadow)" aria-label="Lista de etiquetas">
          <VDataTable
            v-model:selected-keys="selectedIds"
            v-model:page="currentPage"
            :rows="pagedTags"
            :columns="columns"
            row-key="id"
            :actions="hasActions"
            pagination
            :items-per-page="ITEMS_PER_PAGE"
            :total-items="filteredTags.length"
            min-width-class="min-w-[760px]"
            :empty-message="isLoading ? 'Cargando etiquetas...' : 'No hay etiquetas que coincidan con la búsqueda.'"
          >
            <template #cell-name="{ row: tag }">
              <div class="flex min-w-0 items-center gap-2">
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-(--app-line) bg-(--app-surface-2) text-(--app-muted)">
                  <Hash :size="14" />
                </span>
                <span class="min-w-0">
                  <span class="block truncate font-medium text-(--app-ink)">{{ tag.name }}</span>
                  <span class="block truncate text-[12px] text-(--app-muted)">#{{ tag.slug }}</span>
                </span>
              </div>
            </template>

            <template #cell-slug="{ row: tag }">
              <Badge variant="outline">{{ tag.slug }}</Badge>
            </template>

            <template #cell-contents="{ row: tag }">
              <Badge variant="secondary">{{ tag.contents?.length ?? 0 }}</Badge>
            </template>

            <template #cell-updatedAt="{ row: tag }">
              <span class="grid gap-0.5 text-[13px]">
                <span class="text-(--app-ink)">{{ formatDate(tag.updatedAt) }}</span>
                <span class="text-[12px] text-(--app-muted)">{{ formatTime(tag.updatedAt) }}</span>
              </span>
            </template>

            <template #actions="{ row: tag }">
              <VActionMenu v-model="selectedAction" :actions="allowedActions" label="Acciones de etiqueta" @select="handleAction($event, tag)" />
            </template>
          </VDataTable>
        </section>
      </div>
    </section>

    <TagFormDialog
      v-model:open="isFormDialogOpen"
      :mode="formMode"
      :validator="v$"
      :is-loading="isLoading"
      :error-message="errorMessage"
      @submit="submitForm"
      @reset="resetForm"
    />

    <DeleteTagDialog
      v-model:open="isDeleteDialogOpen"
      :tag="selectedTag"
      :is-loading="isLoading"
      @confirm="confirmDelete"
    />
  </div>
</template>
