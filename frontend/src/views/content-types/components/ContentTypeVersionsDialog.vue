<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown, ChevronRight, History, RotateCcw } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import type { ContentType, ContentTypeVersion, FieldType } from '@/domain/models/content-type.model'
import ContentTypeVersionDiff from './ContentTypeVersionDiff.vue'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  contentType: ContentType | null
  versions: ContentTypeVersion[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  restore: [version: number]
}>()

const title = computed(() => props.contentType ? `Versiones de ${props.contentType.name}` : 'Versiones')
const expandedVersion = ref<number | null>(null)
const pendingRestoreVersion = ref<ContentTypeVersion | null>(null)

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

const canRestore = computed(() => pendingRestoreVersion.value && pendingRestoreVersion.value.version !== props.contentType?.version)

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

function toggleVersion(version: number) {
  expandedVersion.value = expandedVersion.value === version ? null : version
}

function requestRestore(version: ContentTypeVersion) {
  pendingRestoreVersion.value = version
  expandedVersion.value = version.version
}

function confirmRestore() {
  if (!pendingRestoreVersion.value) {
    return
  }

  emit('restore', pendingRestoreVersion.value.version)
  pendingRestoreVersion.value = null
}

function fieldTypeLabel(value: string) {
  return fieldLabels[value as FieldType] ?? value
}

</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <History :size="18" />
          {{ title }}
        </DialogTitle>
        <DialogDescription>
          Restaura un snapshot como una nueva versión del schema.
        </DialogDescription>
      </DialogHeader>

      <div class="overflow-hidden rounded-md border border-(--app-line)">
        <Table class="min-w-[680px]">
          <TableHeader>
            <TableRow class="bg-(--app-surface-2)">
              <TableHead>Versión</TableHead>
              <TableHead>Campos</TableHead>
              <TableHead>Creación</TableHead>
              <TableHead class="w-28 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-for="version in versions" :key="version.id">
              <TableRow>
                <TableCell>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 text-left"
                    @click="toggleVersion(version.version)"
                  >
                    <ChevronDown v-if="expandedVersion === version.version" :size="14" />
                    <ChevronRight v-else :size="14" />
                    <Badge variant="secondary">v{{ version.version }}</Badge>
                  </button>
                </TableCell>
                <TableCell>
                  <div class="flex max-w-[320px] flex-wrap gap-1.5">
                    <Badge v-for="field in version.schemaSnapshot.fields.slice(0, 3)" :key="field.id" variant="outline">
                      {{ field.fieldKey }}
                    </Badge>
                    <Badge v-if="version.schemaSnapshot.fields.length > 3" variant="secondary">
                      +{{ version.schemaSnapshot.fields.length - 3 }}
                    </Badge>
                    <span v-if="version.schemaSnapshot.fields.length === 0" class="text-[13px] text-(--app-muted)">
                      Sin campos
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span class="grid gap-0.5 text-[13px]">
                    <span class="text-(--app-ink)">{{ formatDate(version.createdAt) }}</span>
                    <span class="text-[12px] text-(--app-muted)">{{ formatTime(version.createdAt) }}</span>
                  </span>
                </TableCell>
                <TableCell class="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    :disabled="isLoading || version.version === contentType?.version"
                    @click="requestRestore(version)"
                  >
                    <RotateCcw :size="14" />
                    Revisar
                  </Button>
                </TableCell>
              </TableRow>

              <TableRow v-if="expandedVersion === version.version" class="bg-(--app-surface-2)">
                <TableCell colspan="4">
                  <div class="grid gap-4 p-2">
                    <div class="grid gap-1 text-[13px] text-(--app-muted)">
                      <span><b class="text-(--app-ink)">Nombre:</b> {{ version.schemaSnapshot.name }}</span>
                      <span><b class="text-(--app-ink)">Slug:</b> {{ version.schemaSnapshot.slug }}</span>
                      <span><b class="text-(--app-ink)">Descripción:</b> {{ version.schemaSnapshot.description || 'Sin descripción' }}</span>
                    </div>

                    <div class="grid gap-2">
                      <div
                        v-for="field in version.schemaSnapshot.fields"
                        :key="field.id"
                        class="grid gap-2 rounded-md border border-(--app-line) bg-(--app-surface) p-2 text-[13px] sm:grid-cols-[1fr_120px_100px_80px]"
                      >
                        <span>
                          <b class="text-(--app-ink)">{{ field.name }}</b>
                          <span class="ml-1 text-(--app-muted)">({{ field.fieldKey }})</span>
                        </span>
                        <span>{{ fieldTypeLabel(field.fieldType) }}</span>
                        <span>{{ field.isRequired ? 'Requerido' : 'Opcional' }}</span>
                        <span>Orden {{ field.order + 1 }}</span>
                        <span class="text-(--app-muted) sm:col-span-4">Meta {{ JSON.stringify(field.meta ?? {}) }}</span>
                      </div>
                    </div>

                    <ContentTypeVersionDiff
                      v-if="contentType && pendingRestoreVersion?.version === version.version"
                      :content-type="contentType"
                      :version="version"
                    />

                    <div
                      v-if="pendingRestoreVersion?.version === version.version"
                      class="flex justify-end gap-2"
                    >
                      <Button type="button" variant="outline" :disabled="isLoading" @click="pendingRestoreVersion = null">
                        Cancelar
                      </Button>
                      <Button type="button" :disabled="isLoading || !canRestore" @click="confirmRestore">
                        <RotateCcw :size="14" />
                        Confirmar restauración
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </template>

            <TableRow v-if="versions.length === 0">
              <TableCell colspan="4" class="h-28 text-center text-(--app-muted)">
                {{ isLoading ? 'Cargando versiones...' : 'Sin versiones guardadas.' }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </DialogContent>
  </Dialog>
</template>
