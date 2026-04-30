<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { AlertCircleIcon, ClipboardList, Eye, RefreshCw, Search } from 'lucide-vue-next'
import VActionMenu, { type VActionMenuAction } from '@/components/core/VActionMenu.vue'
import VDataTable, { type VDataTableColumn, type VDataTableKey } from '@/components/core/VDataTable.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { AuditLog, AuditResult } from '@/domain/models/audit-log.model'
import { useAuditLogs } from '@/composables/audit-logs/useAuditLogs'

const ITEMS_PER_PAGE = 15
const ALL_RESULTS_VALUE = 'all'

const {
  auditLogs,
  currentAuditLog,
  isLoading,
  errorMessage,
  loadAuditLogs,
  loadAuditLogById,
  resetCurrentAuditLog
} = useAuditLogs()

const search = ref('')
const selectedResult = ref<AuditResult | typeof ALL_RESULTS_VALUE>(ALL_RESULTS_VALUE)
const entity = ref('')
const selectedIds = ref<VDataTableKey[]>([])
const currentPage = ref(1)
const selectedAction = ref<string | null>(null)
const isDetailDialogOpen = ref(false)

const columns: VDataTableColumn[] = [
  { key: 'createdAt', label: 'Fecha', class: 'w-[150px]' },
  { key: 'actor', label: 'Usuario' },
  { key: 'action', label: 'Acción', class: 'w-[160px]' },
  { key: 'entity', label: 'Entidad', class: 'w-[160px]' },
  { key: 'entityId', label: 'ID entidad' },
  { key: 'result', label: 'Resultado', class: 'w-[120px]' },
  { key: 'ipAddress', label: 'IP', class: 'w-[130px]' }
]
const actions: VActionMenuAction[] = [
  { key: 'detail', label: 'Ver detalle', permission: 'audit:view' }
]

const normalizedSearch = computed(() => search.value.trim().toLowerCase())
const normalizedEntity = computed(() => entity.value.trim().toLowerCase())
const filteredAuditLogs = computed(() => {
  return auditLogs.value.filter((item) => {
    if (selectedResult.value !== ALL_RESULTS_VALUE && item.result !== selectedResult.value) {
      return false
    }

    if (normalizedEntity.value && item.entity.toLowerCase() !== normalizedEntity.value) {
      return false
    }

    if (!normalizedSearch.value) {
      return true
    }

    return [
      item.action,
      item.entity,
      item.entityId,
      item.user?.name,
      item.user?.email,
      item.ipAddress
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch.value))
  })
})
const pagedAuditLogs = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  return filteredAuditLogs.value.slice(start, start + ITEMS_PER_PAGE)
})

watch([search, selectedResult, entity], () => {
  currentPage.value = 1
})

async function loadAll() {
  await loadAuditLogs()
}

async function openDetail(item: AuditLog) {
  await loadAuditLogById(item.id)
  isDetailDialogOpen.value = true
}

async function handleAction(action: VActionMenuAction, item: AuditLog) {
  selectedAction.value = action.key

  if (action.key === 'detail') {
    await openDetail(item)
  }
}

function closeDetailDialog(open: boolean) {
  isDetailDialogOpen.value = open

  if (!open) {
    resetCurrentAuditLog()
  }
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

function formatActor(item: AuditLog) {
  return item.user?.name ?? 'Sistema'
}

function formatEntityId(item: AuditLog) {
  return item.entityId ?? '-'
}

function formatJson(value: Record<string, unknown> | null) {
  return value ? JSON.stringify(value, null, 2) : '-'
}

onMounted(loadAll)
</script>

<template>
  <div class="flex w-full flex-col gap-5.5">
    <section class="flex items-start justify-between gap-6 max-[760px]:flex-col max-[760px]:items-stretch">
      <div>
        <div class="mb-1 text-3xl font-semibold leading-tight text-(--app-ink)">
          Audit Log
        </div>
        <p class="m-0 max-w-2xl text-[13.5px] text-(--app-muted)">
          Historial de acciones administrativas y cambios de contenido.
        </p>
      </div>

      <Button variant="outline" size="sm" :disabled="isLoading" @click="loadAll">
        <RefreshCw :size="14" :class="{ 'animate-spin': isLoading }" />
        Actualizar
      </Button>
    </section>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <section class="grid gap-4">
      <section class="flex items-center justify-between gap-3 max-[860px]:flex-col max-[860px]:items-stretch" aria-label="Filtros de audit log">
        <Field class="min-w-[min(100%,320px)] flex-[1_1_420px]">
          <FieldLabel class="sr-only" for="audit-log-search">Buscar registros</FieldLabel>
          <FieldContent class="relative text-(--app-muted)">
            <Search class="absolute left-3 top-1/2 z-[1] -translate-y-1/2" :size="14" />
            <Input
              id="audit-log-search"
              v-model="search"
              class="h-8.5 border-(--app-line) bg-(--app-surface) pl-8.5 text-[13px] text-(--app-ink)"
              placeholder="Buscar acción, usuario, entidad o IP"
            />
          </FieldContent>
        </Field>

        <Field class="min-w-[min(100%,180px)]">
          <FieldLabel class="sr-only" for="audit-log-entity">Entidad</FieldLabel>
          <FieldContent>
            <Input
              id="audit-log-entity"
              v-model="entity"
              class="h-8.5 border-(--app-line) bg-(--app-surface) text-[13px] text-(--app-ink)"
              placeholder="Entidad"
            />
          </FieldContent>
        </Field>

        <Field class="min-w-[150px]">
          <FieldLabel class="sr-only" for="audit-log-result">Resultado</FieldLabel>
          <FieldContent>
            <select
              id="audit-log-result"
              v-model="selectedResult"
              class="h-8.5 w-full rounded-md border border-(--app-line) bg-(--app-surface) px-3 text-[13px] text-(--app-ink)"
            >
              <option :value="ALL_RESULTS_VALUE">Todos</option>
              <option value="success">Exitosos</option>
              <option value="failed">Fallidos</option>
            </select>
          </FieldContent>
        </Field>

        <div class="shrink-0 text-[12.5px] text-(--app-muted)">
          {{ filteredAuditLogs.length }} de {{ auditLogs.length }} registros
        </div>
      </section>

      <section class="overflow-hidden rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) shadow-(--app-shadow)" aria-label="Lista de audit log">
        <VDataTable
          v-model:selected-keys="selectedIds"
          v-model:page="currentPage"
          :rows="pagedAuditLogs"
          :columns="columns"
          row-key="id"
          actions
          pagination
          :items-per-page="ITEMS_PER_PAGE"
          :total-items="filteredAuditLogs.length"
          min-width-class="min-w-[1080px]"
          :empty-message="isLoading ? 'Cargando audit log...' : 'No hay registros que coincidan con los filtros.'"
        >
          <template #cell-createdAt="{ row: item }">
            <span class="grid gap-0.5 text-[13px]">
              <span class="text-(--app-ink)">{{ formatDate(item.createdAt) }}</span>
              <span class="text-[12px] text-(--app-muted)">{{ formatTime(item.createdAt) }}</span>
            </span>
          </template>

          <template #cell-actor="{ row: item }">
            <div class="flex min-w-0 items-center gap-2">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-(--app-line) bg-(--app-surface-2) text-(--app-muted)">
                <ClipboardList :size="14" />
              </span>
              <span class="min-w-0">
                <span class="block truncate font-medium text-(--app-ink)">{{ formatActor(item) }}</span>
                <span class="block truncate text-[12px] text-(--app-muted)">{{ item.user?.email ?? item.userId ?? 'Sin usuario' }}</span>
              </span>
            </div>
          </template>

          <template #cell-action="{ row: item }">
            <Badge variant="outline">{{ item.action }}</Badge>
          </template>

          <template #cell-entity="{ row: item }">
            <span class="font-medium text-(--app-ink)">{{ item.entity }}</span>
          </template>

          <template #cell-entityId="{ row: item }">
            <span class="block max-w-[260px] truncate text-[12.5px] text-(--app-muted)">{{ formatEntityId(item) }}</span>
          </template>

          <template #cell-result="{ row: item }">
            <Badge :variant="item.result === 'failed' ? 'destructive' : 'secondary'">
              {{ item.result === 'failed' ? 'Fallido' : 'Exitoso' }}
            </Badge>
          </template>

          <template #cell-ipAddress="{ row: item }">
            <span class="text-[12.5px] text-(--app-muted)">{{ item.ipAddress ?? '-' }}</span>
          </template>

          <template #actions="{ row: item }">
            <VActionMenu v-model="selectedAction" :actions="actions" label="Acciones de audit log" @select="handleAction($event, item)" />
          </template>
        </VDataTable>
      </section>
    </section>

    <Dialog :open="isDetailDialogOpen" @update:open="closeDetailDialog">
      <DialogContent class="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Eye :size="16" />
            Detalle de audit log
          </DialogTitle>
          <DialogDescription>
            {{ currentAuditLog?.action ?? 'Registro' }} · {{ currentAuditLog?.entity ?? 'Entidad' }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="currentAuditLog" class="grid gap-4">
          <section class="grid grid-cols-2 gap-3 text-[13px] max-[760px]:grid-cols-1">
            <div class="rounded-md border border-(--app-line) bg-(--app-surface-2) p-3">
              <div class="text-[11px] font-semibold uppercase text-(--app-muted)">Usuario</div>
              <div class="mt-1 font-medium text-(--app-ink)">{{ formatActor(currentAuditLog) }}</div>
              <div class="truncate text-[12px] text-(--app-muted)">{{ currentAuditLog.user?.email ?? currentAuditLog.userId ?? 'Sin usuario' }}</div>
            </div>

            <div class="rounded-md border border-(--app-line) bg-(--app-surface-2) p-3">
              <div class="text-[11px] font-semibold uppercase text-(--app-muted)">Fecha</div>
              <div class="mt-1 font-medium text-(--app-ink)">{{ formatDate(currentAuditLog.createdAt) }}</div>
              <div class="text-[12px] text-(--app-muted)">{{ formatTime(currentAuditLog.createdAt) }}</div>
            </div>

            <div class="rounded-md border border-(--app-line) bg-(--app-surface-2) p-3">
              <div class="text-[11px] font-semibold uppercase text-(--app-muted)">Entidad</div>
              <div class="mt-1 font-medium text-(--app-ink)">{{ currentAuditLog.entity }}</div>
              <div class="truncate text-[12px] text-(--app-muted)">{{ formatEntityId(currentAuditLog) }}</div>
            </div>

            <div class="rounded-md border border-(--app-line) bg-(--app-surface-2) p-3">
              <div class="text-[11px] font-semibold uppercase text-(--app-muted)">Contexto</div>
              <div class="mt-1 flex flex-wrap items-center gap-2">
                <Badge :variant="currentAuditLog.result === 'failed' ? 'destructive' : 'secondary'">
                  {{ currentAuditLog.result === 'failed' ? 'Fallido' : 'Exitoso' }}
                </Badge>
                <span class="text-[12px] text-(--app-muted)">{{ currentAuditLog.ipAddress ?? 'Sin IP' }}</span>
              </div>
            </div>
          </section>

          <section class="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
            <div>
              <div class="mb-1.5 text-[12px] font-semibold text-(--app-muted)">Antes</div>
              <pre class="max-h-[280px] overflow-auto rounded-md border border-(--app-line) bg-(--app-surface-2) p-3 text-[12px] leading-relaxed text-(--app-ink)">{{ formatJson(currentAuditLog.before) }}</pre>
            </div>

            <div>
              <div class="mb-1.5 text-[12px] font-semibold text-(--app-muted)">Después</div>
              <pre class="max-h-[280px] overflow-auto rounded-md border border-(--app-line) bg-(--app-surface-2) p-3 text-[12px] leading-relaxed text-(--app-ink)">{{ formatJson(currentAuditLog.after) }}</pre>
            </div>
          </section>

          <section>
            <div class="mb-1.5 text-[12px] font-semibold text-(--app-muted)">User agent</div>
            <div class="rounded-md border border-(--app-line) bg-(--app-surface-2) p-3 text-[12px] text-(--app-muted)">
              {{ currentAuditLog.userAgent ?? '-' }}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
