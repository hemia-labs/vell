<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { AlertCircleIcon, Braces, Plus, RefreshCw, Search } from 'lucide-vue-next'
import VActionMenu, { type VActionMenuAction } from '@/components/core/VActionMenu.vue'
import VDataTable, { type VDataTableColumn, type VDataTableKey } from '@/components/core/VDataTable.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuthorization } from '@/composables/auth/useAuthorization'
import { useContentTypes } from '@/composables/content-types/useContentTypes'
import type { ContentType, FieldType } from '@/domain/models/content-type.model'
import DeleteContentTypeDialog from './components/DeleteContentTypeDialog.vue'
import ContentTypeVersionsDialog from './components/ContentTypeVersionsDialog.vue'

const ITEMS_PER_PAGE = 10

const {
  contentTypes,
  isLoading,
  errorMessage,
  loadContentTypes,
  loadContentTypeVersions,
  deleteContentType,
  restoreContentTypeVersion,
  versions,
} = useContentTypes()
const { can, filterAllowed } = useAuthorization()
const router = useRouter()

const search = ref('')
const selectedIds = ref<VDataTableKey[]>([])
const currentPage = ref(1)
const isDeleteDialogOpen = ref(false)
const isVersionsDialogOpen = ref(false)
const selectedContentTypeId = ref<string | null>(null)
const selectedAction = ref<string | null>(null)

const fieldLabels: Record<FieldType, string> = {
  text: 'Texto',
  textarea: 'Texto largo',
  number: 'Número',
  boolean: 'Booleano',
  date: 'Fecha',
  image: 'Imagen',
  file: 'Archivo',
  select: 'Select',
  relation: 'Relación',
  json: 'JSON',
  richtext: 'Rich text'
}

const columns: VDataTableColumn[] = [
  { key: 'name', label: 'Tipo' },
  { key: 'slug', label: 'Slug' },
  { key: 'version', label: 'Schema' },
  { key: 'fields', label: 'Campos' },
  { key: 'required', label: 'Requeridos' },
  { key: 'updatedAt', label: 'Actualización' }
]

const actions: VActionMenuAction[] = [
  { key: 'view', label: 'Ver', permission: 'content-types:view' },
  { key: 'edit', label: 'Editar', permission: 'content-types:edit' },
  { key: 'versions', label: 'Versiones', permission: 'content-types:view' },
  { key: 'delete', label: 'Eliminar', permission: 'content-types:delete', danger: true }
]

const normalizedSearch = computed(() => search.value.trim().toLowerCase())
const allowedActions = computed(() => filterAllowed(actions))
const filteredContentTypes = computed(() => {
  return contentTypes.value.filter((contentType) => {
    if (!normalizedSearch.value) {
      return true
    }

    return [
      contentType.name,
      contentType.slug,
      contentType.description,
      ...(contentType.fields ?? []).flatMap(field => [field.name, field.fieldKey, field.fieldType])
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch.value))
  })
})
const pagedContentTypes = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  return filteredContentTypes.value.slice(start, start + ITEMS_PER_PAGE)
})
const selectedContentType = computed(() => {
  return contentTypes.value.find((contentType) => contentType.id === selectedContentTypeId.value) ?? null
})
const hasActions = computed(() => can(['content-types:view', 'content-types:edit', 'content-types:delete']))

watch(search, () => {
  currentPage.value = 1
})

async function loadAll() {
  await loadContentTypes({ withFields: true })
}

function openCreatePage() {
  router.push({ name: 'content-types-create' })
}

function openEditPage(contentType: ContentType) {
  selectedContentTypeId.value = contentType.id
  router.push({ name: 'content-types-edit', params: { id: contentType.id } })
}

function openDetailPage(contentType: ContentType) {
  selectedContentTypeId.value = contentType.id
  router.push({ name: 'content-types-detail', params: { id: contentType.id } })
}

function handleAction(action: VActionMenuAction, contentType: ContentType) {
  if (!can(action.permission)) {
    return
  }

  selectedAction.value = action.key
  selectedContentTypeId.value = contentType.id

  if (action.key === 'view') {
    openDetailPage(contentType)
  }

  if (action.key === 'edit') {
    openEditPage(contentType)
  }

  if (action.key === 'versions') {
    openVersionsDialog(contentType)
  }

  if (action.key === 'delete') {
    isDeleteDialogOpen.value = true
  }
}

async function openVersionsDialog(contentType: ContentType) {
  selectedContentTypeId.value = contentType.id
  isVersionsDialogOpen.value = true
  await loadContentTypeVersions(contentType.id)
}

async function confirmDelete() {
  if (!selectedContentTypeId.value) {
    return
  }

  const result = await deleteContentType(selectedContentTypeId.value)
  if (!result) {
    return
  }

  isDeleteDialogOpen.value = false
  selectedContentTypeId.value = null
  await loadAll()
}

async function restoreVersion(version: number) {
  if (!selectedContentTypeId.value) {
    return
  }

  const result = await restoreContentTypeVersion(selectedContentTypeId.value, version)
  if (!result) {
    return
  }

  await loadAll()
  await loadContentTypeVersions(selectedContentTypeId.value)
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
          Tipos de contenido
        </div>
        <p class="m-0 max-w-2xl text-[13.5px] text-(--app-muted)">
          Define estructuras reutilizables para formularios dinámicos del CMS.
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2 max-[760px]:flex-wrap">
        <Button variant="outline" size="sm" :disabled="isLoading" @click="loadAll">
          <RefreshCw :size="14" :class="{ 'animate-spin': isLoading }" />
          Actualizar
        </Button>
        <Button v-can="'content-types:create'" size="sm" @click="openCreatePage">
          <Plus :size="14" />
          Nuevo tipo
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
        <section class="flex items-center justify-between gap-3 max-[760px]:flex-col max-[760px]:items-stretch" aria-label="Filtros de tipos de contenido">
          <Field class="min-w-[min(100%,320px)] flex-[1_1_420px]">
            <FieldLabel class="sr-only" for="content-types-search">Buscar tipos de contenido</FieldLabel>
            <FieldContent class="relative text-(--app-muted)">
              <Search class="absolute left-3 top-1/2 z-[1] -translate-y-1/2" :size="14" />
              <Input
                id="content-types-search"
                v-model="search"
                class="h-8.5 border-(--app-line) bg-(--app-surface) pl-8.5 text-[13px] text-(--app-ink)"
                placeholder="Buscar por nombre, slug o campo"
              />
            </FieldContent>
          </Field>

          <div class="text-[12.5px] text-(--app-muted)">
            {{ filteredContentTypes.length }} de {{ contentTypes.length }} tipos
          </div>
        </section>

        <section class="overflow-hidden rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) shadow-(--app-shadow)" aria-label="Lista de tipos de contenido">
          <VDataTable
            v-model:selected-keys="selectedIds"
            v-model:page="currentPage"
            :rows="pagedContentTypes"
            :columns="columns"
            row-key="id"
            :actions="hasActions"
            pagination
            :items-per-page="ITEMS_PER_PAGE"
            :total-items="filteredContentTypes.length"
            min-width-class="min-w-[920px]"
            :empty-message="isLoading ? 'Cargando tipos de contenido...' : 'No hay tipos que coincidan con la búsqueda.'"
          >
            <template #cell-name="{ row: contentType }">
              <div class="flex min-w-0 items-center gap-2">
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-(--app-line) bg-(--app-surface-2) text-(--app-muted)">
                  <Braces :size="14" />
                </span>
                <span class="min-w-0">
                  <button
                    type="button"
                    class="block max-w-full truncate text-left font-medium text-(--app-ink) hover:underline"
                    @click="openDetailPage(contentType)"
                  >
                    {{ contentType.name }}
                  </button>
                  <span class="block max-w-[360px] truncate text-[12px] text-(--app-muted)">{{ contentType.description || 'Sin descripción' }}</span>
                </span>
              </div>
            </template>

            <template #cell-slug="{ row: contentType }">
              <Badge variant="outline">{{ contentType.slug }}</Badge>
            </template>

            <template #cell-version="{ row: contentType }">
              <Badge variant="secondary">v{{ contentType.version }}</Badge>
            </template>

            <template #cell-fields="{ row: contentType }">
              <div class="flex max-w-[320px] flex-wrap gap-1.5">
                <Badge v-for="field in contentType.fields?.slice(0, 3)" :key="field.id" variant="secondary">
                  {{ field.fieldKey }} · {{ fieldLabels[field.fieldType] }}
                </Badge>
                <Badge v-if="(contentType.fields?.length ?? 0) > 3" variant="outline">
                  +{{ (contentType.fields?.length ?? 0) - 3 }}
                </Badge>
                <span v-if="!contentType.fields?.length" class="text-[13px] text-(--app-muted)">
                  Sin campos
                </span>
              </div>
            </template>

            <template #cell-required="{ row: contentType }">
              <Badge variant="secondary">
                {{ contentType.fields?.filter((field) => field.isRequired).length ?? 0 }} / {{ contentType.fields?.length ?? 0 }}
              </Badge>
            </template>

            <template #cell-updatedAt="{ row: contentType }">
              <span class="grid gap-0.5 text-[13px]">
                <span class="text-(--app-ink)">{{ formatDate(contentType.updatedAt) }}</span>
                <span class="text-[12px] text-(--app-muted)">{{ formatTime(contentType.updatedAt) }}</span>
              </span>
            </template>

            <template #actions="{ row: contentType }">
              <VActionMenu v-model="selectedAction" :actions="allowedActions" label="Acciones de tipo de contenido" @select="handleAction($event, contentType)" />
            </template>
          </VDataTable>
        </section>
      </div>
    </section>

    <DeleteContentTypeDialog
      v-model:open="isDeleteDialogOpen"
      :content-type="selectedContentType"
      :is-loading="isLoading"
      @confirm="confirmDelete"
    />

    <ContentTypeVersionsDialog
      v-model:open="isVersionsDialogOpen"
      :content-type="selectedContentType"
      :versions="versions"
      :is-loading="isLoading"
      @restore="restoreVersion"
    />
  </div>
</template>
