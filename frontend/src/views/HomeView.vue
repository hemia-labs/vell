<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  AlertCircleIcon,
  ArrowRight,
  Clock3,
  Database,
  FileText,
  FolderTree,
  Image,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
} from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthorization } from '@/composables/auth/useAuthorization'
import type { AuditLog } from '@/domain/models/audit-log.model'
import type { Content, ContentStatus } from '@/domain/models/content.model'
import type { ContentType } from '@/domain/models/content-type.model'
import type { Media } from '@/domain/models/media.model'
import AuditLogService from '@/services/audit-logs/audit-log.service'
import ContentTypeService from '@/services/content-types/content-type.service'
import ContentService from '@/services/contents/content.service'
import MediaLibraryService from '@/services/media/media-library.service'

const contentService = new ContentService()
const contentTypeService = new ContentTypeService()
const mediaService = new MediaLibraryService()
const auditLogService = new AuditLogService()

const { can } = useAuthorization()

const contents = ref<Content[]>([])
const contentTypes = ref<ContentType[]>([])
const media = ref<Media[]>([])
const auditLogs = ref<AuditLog[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const contentCounts = computed(() => {
  return contents.value.reduce<Record<ContentStatus, number>>((counts, content) => {
    counts[content.status] += 1
    return counts
  }, { draft: 0, published: 0, archived: 0 })
})

const metrics = computed(() => [
  {
    label: 'Contenidos',
    value: contents.value.length,
    detail: `${contentCounts.value.published} publicados`,
    icon: FileText,
    to: { name: 'contents' },
    permission: 'content:view',
  },
  {
    label: 'Tipos',
    value: contentTypes.value.length,
    detail: 'modelos activos',
    icon: FolderTree,
    to: { name: 'content-types' },
    permission: 'content-types:view',
  },
  {
    label: 'Media',
    value: media.value.length,
    detail: 'archivos en biblioteca',
    icon: Image,
    to: { name: 'media-library' },
    permission: 'media:view',
  },
  {
    label: 'Auditoría',
    value: auditLogs.value.length,
    detail: 'eventos recientes',
    icon: ShieldCheck,
    to: { name: 'audit-log' },
    permission: 'audit:view',
  },
].filter((metric) => can(metric.permission)))

const recentContents = computed(() => {
  return [...contents.value]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
})

const recentActivity = computed(() => {
  return [...auditLogs.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
})

const quickActions = computed(() => [
  {
    label: 'Nuevo contenido',
    detail: 'Crear entrada',
    icon: Plus,
    to: { name: 'contents-create' },
    permission: 'content:create',
  },
  {
    label: 'Tipos de contenido',
    detail: 'Editar estructura',
    icon: Database,
    to: { name: 'content-types' },
    permission: 'content-types:view',
  },
  {
    label: 'Media Library',
    detail: 'Gestionar assets',
    icon: Image,
    to: { name: 'media-library' },
    permission: 'media:view',
  },
  {
    label: 'Ajustes',
    detail: 'Configurar CMS',
    icon: Settings,
    to: { name: 'settings' },
    permission: 'settings:view',
  },
].filter((action) => can(action.permission)))

async function loadDashboard() {
  isLoading.value = true
  errorMessage.value = ''

  const tasks = [
    can('content:view') ? contentService.findAll({ limit: 200, withRelations: true }) : Promise.resolve([]),
    can('content-types:view') ? contentTypeService.findAll({ limit: 200 }) : Promise.resolve([]),
    can('media:view') ? mediaService.findAll({ limit: 200 }) : Promise.resolve([]),
    can('audit:view') ? auditLogService.findAll({ limit: 10 }) : Promise.resolve([]),
  ] as const

  const [contentResult, contentTypeResult, mediaResult, auditResult] = await Promise.allSettled(tasks)

  if (contentResult.status === 'fulfilled') {
    contents.value = contentResult.value
  }

  if (contentTypeResult.status === 'fulfilled') {
    contentTypes.value = contentTypeResult.value
  }

  if (mediaResult.status === 'fulfilled') {
    media.value = mediaResult.value
  }

  if (auditResult.status === 'fulfilled') {
    auditLogs.value = auditResult.value
  }

  if ([contentResult, contentTypeResult, mediaResult, auditResult].some((result) => result.status === 'rejected')) {
    errorMessage.value = 'No se pudo cargar todo el resumen.'
  }

  isLoading.value = false
}

function statusLabel(status: ContentStatus) {
  const labels: Record<ContentStatus, string> = {
    draft: 'Borrador',
    published: 'Publicado',
    archived: 'Archivado',
  }

  return labels[status]
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Sin fecha'
  }

  return new Date(value).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(loadDashboard)
</script>

<template>
  <div class="flex w-full flex-col gap-5.5">
    <section class="flex items-start justify-between gap-6 max-[760px]:flex-col max-[760px]:items-stretch">
      <div>
        <div class="mb-1 text-3xl font-semibold leading-tight text-(--app-ink)">
          Inicio
        </div>
        <p class="m-0 max-w-2xl text-[13.5px] text-(--app-muted)">
          Resumen operativo de contenido, modelos, archivos y actividad reciente.
        </p>
      </div>

      <Button variant="outline" size="sm" :disabled="isLoading" @click="loadDashboard">
        <RefreshCw :size="14" :class="{ 'animate-spin': isLoading }" />
        Actualizar
      </Button>
    </section>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <section class="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2 max-[640px]:grid-cols-1" aria-label="Métricas principales">
      <RouterLink
        v-for="metric in metrics"
        :key="metric.label"
        :to="metric.to"
        class="group rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) p-4 shadow-(--app-shadow) transition hover:border-(--app-ink)"
      >
        <div class="flex items-start justify-between gap-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-(--app-line) bg-(--app-surface-2) text-(--app-muted)">
            <component :is="metric.icon" :size="16" />
          </span>
          <ArrowRight class="mt-1 text-(--app-muted) opacity-0 transition group-hover:opacity-100" :size="15" />
        </div>
        <div class="mt-4 text-2xl font-semibold leading-none text-(--app-ink)">
          {{ metric.value }}
        </div>
        <div class="mt-1 text-[12.5px] text-(--app-muted)">
          {{ metric.label }} · {{ metric.detail }}
        </div>
      </RouterLink>
    </section>

    <section class="grid grid-cols-[1.35fr_0.85fr] gap-4 max-[1000px]:grid-cols-1">
      <div class="rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) shadow-(--app-shadow)">
        <div class="flex items-center justify-between gap-3 border-b border-(--app-line) px-4 py-3">
          <div>
            <div class="text-[13.5px] font-medium text-(--app-ink)">Contenido reciente</div>
            <div class="text-[12.5px] text-(--app-muted)">Últimos cambios editoriales</div>
          </div>
          <Button v-if="can('content:view')" as-child variant="ghost" size="sm">
            <RouterLink :to="{ name: 'contents' }">
              Ver todo
              <ArrowRight :size="14" />
            </RouterLink>
          </Button>
        </div>

        <div v-if="isLoading" class="px-4 py-8 text-center text-[13px] text-(--app-muted)">
          Cargando contenido...
        </div>

        <div v-else-if="recentContents.length === 0" class="px-4 py-8 text-center text-[13px] text-(--app-muted)">
          Aún no hay contenido para mostrar.
        </div>

        <div v-else class="divide-y divide-(--app-line)">
          <RouterLink
            v-for="content in recentContents"
            :key="content.id"
            :to="{ name: 'contents-edit', params: { id: content.id } }"
            class="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 transition hover:bg-(--app-surface-2) max-[640px]:grid-cols-1"
          >
            <div class="min-w-0">
              <div class="truncate text-[13.5px] font-medium text-(--app-ink)">
                {{ content.title }}
              </div>
              <div class="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-[12.5px] text-(--app-muted)">
                <span class="truncate">/{{ content.slug }}</span>
                <span>·</span>
                <span>{{ formatDate(content.updatedAt) }}</span>
              </div>
            </div>
            <div class="flex items-center justify-end gap-2 max-[640px]:justify-start">
              <Badge :variant="content.status === 'published' ? 'default' : 'outline'">
                {{ statusLabel(content.status) }}
              </Badge>
            </div>
          </RouterLink>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <div class="rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) p-4 shadow-(--app-shadow)">
          <div class="text-[13.5px] font-medium text-(--app-ink)">Estado editorial</div>
          <div class="mt-4 grid gap-3">
            <div class="flex items-center justify-between gap-3">
              <span class="text-[12.5px] text-(--app-muted)">Publicados</span>
              <strong class="text-[13.5px] text-(--app-ink)">{{ contentCounts.published }}</strong>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-[12.5px] text-(--app-muted)">Borradores</span>
              <strong class="text-[13.5px] text-(--app-ink)">{{ contentCounts.draft }}</strong>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-[12.5px] text-(--app-muted)">Archivados</span>
              <strong class="text-[13.5px] text-(--app-ink)">{{ contentCounts.archived }}</strong>
            </div>
          </div>
        </div>

        <div class="rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) p-4 shadow-(--app-shadow)">
          <div class="text-[13.5px] font-medium text-(--app-ink)">Accesos rápidos</div>
          <div class="mt-3 grid gap-2">
            <RouterLink
              v-for="action in quickActions"
              :key="action.label"
              :to="action.to"
              class="flex items-center justify-between gap-3 rounded-md border border-(--app-line) px-3 py-2 transition hover:border-(--app-ink)"
            >
              <span class="flex min-w-0 items-center gap-2">
                <component :is="action.icon" class="shrink-0 text-(--app-muted)" :size="15" />
                <span class="min-w-0">
                  <span class="block truncate text-[13px] font-medium text-(--app-ink)">{{ action.label }}</span>
                  <span class="block truncate text-[12px] text-(--app-muted)">{{ action.detail }}</span>
                </span>
              </span>
              <ArrowRight class="shrink-0 text-(--app-muted)" :size="14" />
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <section v-if="can('audit:view')" class="rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) shadow-(--app-shadow)" aria-label="Actividad reciente">
      <div class="flex items-center justify-between gap-3 border-b border-(--app-line) px-4 py-3">
        <div>
          <div class="text-[13.5px] font-medium text-(--app-ink)">Actividad reciente</div>
          <div class="text-[12.5px] text-(--app-muted)">Eventos de auditoría</div>
        </div>
        <Button as-child variant="ghost" size="sm">
          <RouterLink :to="{ name: 'audit-log' }">
            Ver log
            <ArrowRight :size="14" />
          </RouterLink>
        </Button>
      </div>

      <div v-if="recentActivity.length === 0" class="px-4 py-8 text-center text-[13px] text-(--app-muted)">
        Sin actividad reciente.
      </div>

      <div v-else class="divide-y divide-(--app-line)">
        <div
          v-for="entry in recentActivity"
          :key="entry.id"
          class="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 max-[640px]:grid-cols-1"
        >
          <div class="min-w-0">
            <div class="flex min-w-0 flex-wrap items-center gap-2">
              <Badge :variant="entry.result === 'success' ? 'outline' : 'destructive'">
                {{ entry.result }}
              </Badge>
              <span class="truncate text-[13px] font-medium text-(--app-ink)">
                {{ entry.action }} · {{ entry.entity }}
              </span>
            </div>
            <div class="mt-1 truncate text-[12.5px] text-(--app-muted)">
              {{ entry.user?.name ?? 'Sistema' }}
            </div>
          </div>
          <div class="flex items-center justify-end gap-1 text-[12.5px] text-(--app-muted) max-[640px]:justify-start">
            <Clock3 :size="13" />
            {{ formatTime(entry.createdAt) }}
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
