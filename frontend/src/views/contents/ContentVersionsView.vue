<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CalendarClock, GitCompare, History, Pencil } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useContents } from '@/composables/contents/useContents'
import type { ContentStatus, ContentVersion } from '@/domain/models/content.model'

type DiffRow = {
  key: string
  label: string
  selected: string
  published: string
  changed: boolean
  lines: DiffLine[]
}

type DiffLine = {
  type: 'same' | 'added' | 'removed'
  text: string
}

type DiffSection = {
  key: string
  title: string
  rows: DiffRow[]
  changedCount: number
}

const route = useRoute()
const router = useRouter()
const {
  currentContent,
  versions,
  isLoading,
  errorMessage,
  loadContentById,
  loadContentVersions,
  restoreContentVersion
} = useContents()

const contentId = computed(() => String(route.params.id ?? ''))
const selectedVersionId = ref<string>('')
const restoreDialogOpen = ref(false)

const statusLabels: Record<ContentStatus, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  archived: 'Archivado'
}

const sortedVersions = computed(() => [...versions.value].sort((a, b) => b.version - a.version))
const publishedVersion = computed(() => sortedVersions.value.find(version => version.status === 'published') ?? null)
const selectedVersion = computed(() => sortedVersions.value.find(version => version.id === selectedVersionId.value) ?? sortedVersions.value[0] ?? null)
const canRestoreSelectedVersion = computed(() => selectedVersion.value?.status === 'archived')
const diffSections = computed<DiffSection[]>(() => {
  const selected = selectedVersion.value
  const published = publishedVersion.value

  if (!selected || !published) {
    return []
  }

  const contentRows: DiffRow[] = [
    row('title', 'Título', selected.title, published.title),
    row('slug', 'Slug', selected.slug, published.slug)
  ]

  const metaRows: DiffRow[] = [
    row('status', 'Estado', statusLabels[selected.status], statusLabels[published.status]),
    row('publishedAt', 'Fecha publicación', formatDateTime(selected.publishedAt), formatDateTime(published.publishedAt)),
    row('categoryId', 'Categoría', selected.categoryId, published.categoryId),
    row('coverImageId', 'Cover image', selected.coverImageId, published.coverImageId),
    row('metaTitle', 'Meta title', selected.metaTitle, published.metaTitle),
    row('metaDescription', 'Meta description', selected.metaDescription, published.metaDescription),
    row('tags', 'Tags', selected.tagsSnapshot?.map(tag => tag.slug), published.tagsSnapshot?.map(tag => tag.slug))
  ]

  const seoRows: DiffRow[] = [
    row('seo', 'SEO JSON', selected.seo, published.seo),
    row('config', 'Config JSON', selected.config, published.config)
  ]

  const mediaRows: DiffRow[] = [
    row('media', 'Media', selected.mediaSnapshot?.map(media => `${media.role}:${media.media.originalName || media.media.filename}`), published.mediaSnapshot?.map(media => `${media.role}:${media.media.originalName || media.media.filename}`))
  ]

  const selectedFields = new Map((selected.fieldValuesSnapshot ?? []).map(field => [field.fieldKey, field.value]))
  const publishedFields = new Map((published.fieldValuesSnapshot ?? []).map(field => [field.fieldKey, field.value]))
  const fieldKeys = [...new Set([...selectedFields.keys(), ...publishedFields.keys()])].sort()
  const fieldRows = fieldKeys.map(fieldKey => row(`field:${fieldKey}`, fieldKey, selectedFields.get(fieldKey), publishedFields.get(fieldKey)))

  return [
    section('content', 'Contenido', contentRows),
    section('fields', 'Campos dinámicos', fieldRows),
    section('meta', 'Meta editorial', metaRows),
    section('seo', 'SEO y configuración', seoRows),
    section('media', 'Media', mediaRows)
  ]
})

const changedRows = computed(() => diffSections.value.flatMap(section => section.rows).filter(row => row.changed))

function section(key: string, title: string, rows: DiffRow[]): DiffSection {
  return {
    key,
    title,
    rows,
    changedCount: rows.filter(row => row.changed).length
  }
}

watch(sortedVersions, (items) => {
  if (selectedVersionId.value || items.length === 0) {
    return
  }

  selectedVersionId.value = items.find(version => version.status === 'draft')?.id
    ?? items.find(version => version.status === 'archived')?.id
    ?? items[0].id
}, { immediate: true })

onMounted(async () => {
  if (!contentId.value) {
    return
  }

  await Promise.all([
    loadContentById(contentId.value),
    loadContentVersions(contentId.value)
  ])
})

function row(key: string, label: string, selectedValue: unknown, publishedValue: unknown): DiffRow {
  const selected = valuePreview(selectedValue)
  const published = valuePreview(publishedValue)

  return {
    key,
    label,
    selected,
    published,
    changed: selected !== published,
    lines: diffLines(selected, published)
  }
}

function diffLines(selected: string, published: string): DiffLine[] {
  if (selected === published) {
    return selected.split('\n').map(text => ({ type: 'same', text }))
  }

  return [
    ...published.split('\n').map(text => ({ type: 'removed' as const, text })),
    ...selected.split('\n').map(text => ({ type: 'added' as const, text }))
  ]
}

function linePrefix(type: DiffLine['type']) {
  if (type === 'added') return '+'
  if (type === 'removed') return '-'
  return ' '
}

function valuePreview(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return 'Sin valor'
  }

  if (typeof value === 'string') {
    return stripHtml(value)
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return stableStringify(value)
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function stableStringify(value: unknown) {
  return JSON.stringify(sortJson(value), null, 2)
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJson)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, sortJson(item)])
    )
  }

  return value
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Sin fecha'
  }

  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function versionBadgeVariant(status: ContentStatus) {
  return status === 'published' ? 'default' : status === 'draft' ? 'secondary' : 'outline'
}

async function confirmRestoreVersion() {
  if (!selectedVersion.value) {
    return
  }

  const restored = await restoreContentVersion(contentId.value, selectedVersion.value.version)

  if (!restored) {
    return
  }

  await Promise.all([
    loadContentById(contentId.value),
    loadContentVersions(contentId.value)
  ])
  restoreDialogOpen.value = false
}
</script>

<template>
  <div class="flex w-full flex-col gap-5.5">
    <section class="flex items-start justify-between gap-6 max-[760px]:flex-col max-[760px]:items-stretch">
      <div>
        <div class="mb-1 flex items-center gap-2 text-3xl font-semibold leading-tight text-(--app-ink)">
          <History :size="24" />
          Versiones
        </div>
        <p class="m-0 max-w-2xl text-[13.5px] text-(--app-muted)">
          {{ currentContent?.title || 'Contenido' }} · compara cualquier versión contra la publicada.
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2 max-[760px]:flex-wrap">
        <Button type="button" variant="outline" size="sm" @click="router.push({ name: 'contents-edit', params: { id: contentId } })">
          <ArrowLeft :size="14" />
          Editor
        </Button>
        <Button v-can="'content:edit'" type="button" size="sm" @click="router.push({ name: 'contents-edit', params: { id: contentId } })">
          <Pencil :size="14" />
          Editar
        </Button>
      </div>
    </section>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <section v-if="!publishedVersion && !isLoading" class="rounded-md border border-dashed border-(--app-line) px-4 py-8 text-center text-[13px] text-(--app-muted)">
      Este contenido todavía no tiene versión publicada para comparar.
    </section>

    <div class="grid items-start gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <section class="overflow-hidden rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) shadow-(--app-shadow)">
        <div class="border-b border-(--app-line) px-4 py-3">
          <div class="flex items-center gap-2 text-[13px] font-semibold text-(--app-ink)">
            <CalendarClock :size="15" />
            Historial
          </div>
        </div>
        <div class="grid gap-2 p-3">
          <button
            v-for="version in sortedVersions"
            :key="version.id"
            type="button"
            class="grid gap-2 rounded-md border p-3 text-left transition-colors"
            :class="selectedVersion?.id === version.id ? 'border-(--app-ink)' : 'border-(--app-line) hover:border-(--app-ink)'"
            @click="selectedVersionId = version.id"
          >
            <span class="flex items-center justify-between gap-3">
              <span class="flex items-center gap-2">
                <Badge variant="secondary">v{{ version.version }}</Badge>
                <Badge :variant="versionBadgeVariant(version.status)">{{ statusLabels[version.status] }}</Badge>
              </span>
              <span v-if="publishedVersion?.id === version.id" class="text-[11px] font-medium text-(--app-muted)">Actual publicada</span>
            </span>
            <span class="truncate text-[13px] font-medium text-(--app-ink)">{{ version.title }}</span>
            <span class="text-[12px] text-(--app-muted)">{{ formatDateTime(version.createdAt) }}</span>
          </button>

          <div v-if="sortedVersions.length === 0" class="rounded-md border border-dashed border-(--app-line) p-4 text-center text-[13px] text-(--app-muted)">
            {{ isLoading ? 'Cargando versiones...' : 'Sin versiones guardadas.' }}
          </div>
        </div>
      </section>

      <section class="overflow-hidden rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) shadow-(--app-shadow)">
        <div class="flex items-start justify-between gap-3 border-b border-(--app-line) px-4 py-3 max-[760px]:flex-col">
          <div>
            <div class="flex items-center gap-2 text-[13px] font-semibold text-(--app-ink)">
              <GitCompare :size="15" />
              Comparación
            </div>
            <p class="m-0 mt-1 text-[12px] text-(--app-muted)">
              v{{ selectedVersion?.version ?? '-' }} contra v{{ publishedVersion?.version ?? '-' }} publicada.
            </p>
          </div>
          <Badge :variant="changedRows.length > 0 ? 'secondary' : 'outline'">
            {{ changedRows.length }} cambios
          </Badge>
        </div>

        <div class="flex items-center justify-end gap-2 border-b border-(--app-line) px-4 py-3">
          <Button
            v-if="canRestoreSelectedVersion"
            v-can="'content:edit'"
            type="button"
            :disabled="!selectedVersion || isLoading"
            @click="restoreDialogOpen = true"
          >
            Restaurar como borrador
          </Button>
        </div>

        <div v-if="diffSections.length" class="grid gap-4 p-4">
          <section
            v-for="section in diffSections"
            :key="section.key"
            class="overflow-hidden rounded-md border border-(--app-line)"
          >
            <div class="flex items-center justify-between gap-3 border-b border-(--app-line) px-3 py-2">
              <div class="text-[13px] font-semibold text-(--app-ink)">{{ section.title }}</div>
              <Badge :variant="section.changedCount > 0 ? 'secondary' : 'outline'">
                {{ section.changedCount }} cambios
              </Badge>
            </div>

            <div class="grid divide-y divide-(--app-line)">
              <article
                v-for="item in section.rows"
                :key="item.key"
                class="grid gap-3 p-3"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="text-[13px] font-medium text-(--app-ink)">{{ item.label }}</div>
                  <Badge :variant="item.changed ? 'default' : 'outline'">{{ item.changed ? 'Cambió' : 'Igual' }}</Badge>
                </div>

                <div v-if="item.changed" class="overflow-hidden rounded-md border border-(--app-line)">
                  <pre
                    v-for="(line, index) in item.lines"
                    :key="`${item.key}-${index}`"
                    class="m-0 whitespace-pre-wrap break-words px-3 py-1 font-mono text-[12px] leading-5"
                    :class="{
                      'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200': line.type === 'removed',
                      'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200': line.type === 'added',
                      'text-(--app-ink)': line.type === 'same'
                    }"
                  >{{ linePrefix(line.type) }} {{ line.text }}</pre>
                </div>

                <pre v-else class="m-0 max-h-28 overflow-auto whitespace-pre-wrap break-words rounded-md border border-(--app-line) p-3 text-[12px] text-(--app-ink)">{{ item.selected }}</pre>
              </article>
            </div>
          </section>
        </div>

        <div v-else class="grid h-36 place-items-center p-4 text-center text-[13px] text-(--app-muted)">
          {{ isLoading ? 'Cargando comparación...' : 'No hay versión publicada o seleccionada.' }}
        </div>
      </section>
    </div>

    <AlertDialog v-model:open="restoreDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restaurar versión</AlertDialogTitle>
          <AlertDialogDescription>
            Se copiará v{{ selectedVersion?.version }} como borrador actual. La versión publicada no cambia hasta que publiques el borrador.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction :disabled="isLoading" @click="confirmRestoreVersion">
            Restaurar borrador
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
