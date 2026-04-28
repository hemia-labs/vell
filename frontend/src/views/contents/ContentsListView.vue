<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { AlertCircleIcon, FileText, Plus, RefreshCw, Search } from 'lucide-vue-next'
import VActionMenu, { type VActionMenuAction } from '@/components/core/VActionMenu.vue'
import VDataTable, { type VDataTableColumn, type VDataTableKey } from '@/components/core/VDataTable.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuthorization } from '@/composables/auth/useAuthorization'
import { useContentTypes } from '@/composables/content-types/useContentTypes'
import { useContents } from '@/composables/contents/useContents'
import type { Content, ContentStatus } from '@/domain/models/content.model'

const ITEMS_PER_PAGE = 10

const { contents, isLoading, errorMessage, loadContents, deleteContent } = useContents()
const { contentTypes, loadContentTypes } = useContentTypes()
const { can, filterAllowed } = useAuthorization()
const router = useRouter()

const search = ref('')
const selectedIds = ref<VDataTableKey[]>([])
const currentPage = ref(1)
const selectedAction = ref<string | null>(null)

const statusLabels: Record<ContentStatus, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  archived: 'Archivado'
}

const columns: VDataTableColumn[] = [
  { key: 'title', label: 'Contenido' },
  { key: 'type', label: 'Tipo' },
  { key: 'status', label: 'Estado' },
  { key: 'tags', label: 'Tags' },
  { key: 'updatedAt', label: 'Actualización' }
]

const actions: VActionMenuAction[] = [
  { key: 'edit', label: 'Editar', permission: 'content:edit' },
  { key: 'delete', label: 'Eliminar', permission: 'content:delete', danger: true }
]

const normalizedSearch = computed(() => search.value.trim().toLowerCase())
const allowedActions = computed(() => filterAllowed(actions))
const typeNameById = computed(() => new Map(contentTypes.value.map(type => [type.id, type.name])))
const filteredContents = computed(() => {
  return contents.value.filter((content) => {
    if (!normalizedSearch.value) return true
    return [content.title, content.slug, content.excerpt, typeNameById.value.get(content.contentTypeId)]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(normalizedSearch.value))
  })
})
const pagedContents = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  return filteredContents.value.slice(start, start + ITEMS_PER_PAGE)
})
const hasActions = computed(() => can(['content:edit', 'content:delete']))

watch(search, () => {
  currentPage.value = 1
})

async function loadAll() {
  await Promise.all([
    loadContents({ withRelations: true }),
    loadContentTypes()
  ])
}

function openCreatePage() {
  router.push({ name: 'contents-create' })
}

function openEditPage(content: Content) {
  router.push({ name: 'contents-edit', params: { id: content.id } })
}

async function handleAction(action: VActionMenuAction, content: Content) {
  if (!can(action.permission)) return
  selectedAction.value = action.key

  if (action.key === 'edit') {
    openEditPage(content)
  }

  if (action.key === 'delete') {
    await deleteContent(content.id)
    await loadAll()
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

onMounted(loadAll)
</script>

<template>
  <div class="flex w-full flex-col gap-5.5">
    <section class="flex items-start justify-between gap-6 max-[760px]:flex-col max-[760px]:items-stretch">
      <div>
        <div class="mb-1 text-3xl font-semibold leading-tight text-(--app-ink)">Contenidos</div>
        <p class="m-0 max-w-2xl text-[13.5px] text-(--app-muted)">Administra entradas dinámicas, SEO, media y configuración por tipo.</p>
      </div>
      <div class="flex shrink-0 items-center gap-2 max-[760px]:flex-wrap">
        <Button variant="outline" size="sm" :disabled="isLoading" @click="loadAll">
          <RefreshCw :size="14" :class="{ 'animate-spin': isLoading }" />
          Actualizar
        </Button>
        <Button v-can="'content:create'" size="sm" @click="openCreatePage">
          <Plus :size="14" />
          Nuevo contenido
        </Button>
      </div>
    </section>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <section class="flex items-center justify-between gap-3 max-[760px]:flex-col max-[760px]:items-stretch">
      <Field class="min-w-[min(100%,320px)] flex-[1_1_420px]">
        <FieldLabel class="sr-only" for="contents-search">Buscar contenidos</FieldLabel>
        <FieldContent class="relative text-(--app-muted)">
          <Search class="absolute left-3 top-1/2 z-[1] -translate-y-1/2" :size="14" />
          <Input id="contents-search" v-model="search" class="h-8.5 border-(--app-line) bg-(--app-surface) pl-8.5 text-[13px]" placeholder="Buscar por título, slug o tipo" />
        </FieldContent>
      </Field>
      <div class="text-[12.5px] text-(--app-muted)">{{ filteredContents.length }} de {{ contents.length }} contenidos</div>
    </section>

    <section class="overflow-hidden rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) shadow-(--app-shadow)">
      <VDataTable
        v-model:selected-keys="selectedIds"
        v-model:page="currentPage"
        :rows="pagedContents"
        :columns="columns"
        row-key="id"
        :actions="hasActions"
        pagination
        :items-per-page="ITEMS_PER_PAGE"
        :total-items="filteredContents.length"
        min-width-class="min-w-[900px]"
        :empty-message="isLoading ? 'Cargando contenidos...' : 'No hay contenidos que coincidan con la búsqueda.'"
      >
        <template #cell-title="{ row: content }">
          <div class="flex min-w-0 items-center gap-2">
            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-(--app-line) bg-(--app-surface-2) text-(--app-muted)">
              <FileText :size="14" />
            </span>
            <span class="min-w-0">
              <button type="button" class="block truncate text-left font-medium text-(--app-ink) hover:underline" @click="openEditPage(content)">
                {{ content.title }}
              </button>
              <span class="block truncate text-[12px] text-(--app-muted)">/{{ content.slug }}</span>
            </span>
          </div>
        </template>
        <template #cell-type="{ row: content }">
          <Badge variant="outline">{{ typeNameById.get(content.contentTypeId) ?? 'Tipo' }}</Badge>
        </template>
        <template #cell-status="{ row: content }">
          <Badge :variant="content.status === 'published' ? 'default' : 'secondary'">{{ statusLabels[content.status] }}</Badge>
        </template>
        <template #cell-tags="{ row: content }">
          <Badge variant="secondary">{{ content.tagIds?.length ?? 0 }}</Badge>
        </template>
        <template #cell-updatedAt="{ row: content }">
          <span class="grid gap-0.5 text-[13px]">
            <span>{{ formatDate(content.updatedAt) }}</span>
            <span class="text-[12px] text-(--app-muted)">{{ formatTime(content.updatedAt) }}</span>
          </span>
        </template>
        <template #actions="{ row: content }">
          <VActionMenu v-model="selectedAction" :actions="allowedActions" label="Acciones de contenido" @select="handleAction($event, content)" />
        </template>
      </VDataTable>
    </section>
  </div>
</template>
