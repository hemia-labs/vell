<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Braces, CalendarClock, GitCompare, Pencil, RotateCcw } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useContentTypes } from '@/composables/content-types/useContentTypes'
import type { ContentTypeVersion, FieldType } from '@/domain/models/content-type.model'
import ContentTypeVersionDiff from './components/ContentTypeVersionDiff.vue'

const route = useRoute()
const router = useRouter()
const {
  currentContentType,
  versions,
  isLoading,
  errorMessage,
  loadContentTypeById,
  loadContentTypeVersions,
  restoreContentTypeVersion
} = useContentTypes()

const contentTypeId = computed(() => String(route.params.id ?? ''))
const activeTab = ref('summary')
const diffVersion = ref<ContentTypeVersion | null>(null)

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

const sortedFields = computed(() => {
  return [...(currentContentType.value?.fields ?? [])].sort((a, b) => a.order - b.order)
})
const currentVersion = computed(() => currentContentType.value?.version ?? null)
const restorableVersions = computed(() => {
  return versions.value.filter((version) => version.version !== currentVersion.value)
})

onMounted(async () => {
  if (!contentTypeId.value) {
    return
  }

  await loadContentTypeById(contentTypeId.value)
  await loadContentTypeVersions(contentTypeId.value)
})

function fieldTypeLabel(value: string) {
  return fieldLabels[value as FieldType] ?? value
}

function formatDateTime(value?: string) {
  if (!value) {
    return 'N/A'
  }

  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function metaText(meta?: Record<string, unknown>) {
  return JSON.stringify(meta ?? {}, null, 2)
}

async function restoreVersion(version: ContentTypeVersion) {
  if (version.version === currentVersion.value) {
    return
  }

  const result = await restoreContentTypeVersion(contentTypeId.value, version.version)

  if (!result) {
    return
  }

  await loadContentTypeById(contentTypeId.value)
  await loadContentTypeVersions(contentTypeId.value)
  diffVersion.value = null
}
</script>

<template>
  <div class="flex w-full flex-col gap-5.5">
    <section class="flex items-start justify-between gap-6 max-[760px]:flex-col max-[760px]:items-stretch">
      <div>
        <div class="mb-1 flex items-center gap-2 text-3xl font-semibold leading-tight text-(--app-ink)">
          <Braces :size="24" />
          {{ currentContentType?.name || 'Tipo de contenido' }}
        </div>
        <p class="m-0 max-w-2xl text-[13.5px] text-(--app-muted)">
          {{ currentContentType?.description || 'Detalle del schema, campos, metadata y versiones.' }}
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2 max-[760px]:flex-wrap">
        <Button type="button" variant="outline" size="sm" @click="router.push({ name: 'content-types' })">
          <ArrowLeft :size="14" />
          Volver
        </Button>
        <Button
          v-if="currentContentType"
          v-can="'content-types:edit'"
          type="button"
          size="sm"
          @click="router.push({ name: 'content-types-edit', params: { id: currentContentType.id } })"
        >
          <Pencil :size="14" />
          Editar
        </Button>
      </div>
    </section>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <Tabs v-if="currentContentType" v-model="activeTab" class="gap-4" default-value="summary">
      <TabsList class="w-full justify-start overflow-x-auto rounded-md border border-(--app-line) bg-(--app-surface) p-1">
        <TabsTrigger value="summary" class="max-w-fit px-3">Resumen</TabsTrigger>
        <TabsTrigger value="fields" class="max-w-fit px-3">Campos y meta</TabsTrigger>
        <TabsTrigger value="versions" class="max-w-fit px-3">Versiones</TabsTrigger>
      </TabsList>

      <TabsContent value="summary" class="grid gap-4">
        <section class="grid gap-3 rounded-md border border-(--app-line) bg-(--app-surface) p-4 shadow-(--app-shadow)">
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div class="grid gap-1">
              <span class="text-[12px] text-(--app-muted)">Slug</span>
              <Badge variant="outline" class="w-fit">{{ currentContentType.slug }}</Badge>
            </div>
            <div class="grid gap-1">
              <span class="text-[12px] text-(--app-muted)">Versión actual</span>
              <Badge variant="secondary" class="w-fit">v{{ currentContentType.version }}</Badge>
            </div>
            <div class="grid gap-1">
              <span class="text-[12px] text-(--app-muted)">Campos</span>
              <span class="text-sm text-(--app-ink)">{{ sortedFields.length }}</span>
            </div>
            <div class="grid gap-1">
              <span class="text-[12px] text-(--app-muted)">Requeridos</span>
              <span class="text-sm text-(--app-ink)">{{ sortedFields.filter((field) => field.isRequired).length }}</span>
            </div>
          </div>

          <div class="grid gap-3 border-t border-(--app-line) pt-3 sm:grid-cols-2">
            <div class="flex items-start gap-2 text-[13px] text-(--app-muted)">
              <CalendarClock :size="15" class="mt-0.5" />
              <span>Creado: <b class="font-medium text-(--app-ink)">{{ formatDateTime(currentContentType.createdAt) }}</b></span>
            </div>
            <div class="flex items-start gap-2 text-[13px] text-(--app-muted)">
              <CalendarClock :size="15" class="mt-0.5" />
              <span>Actualizado: <b class="font-medium text-(--app-ink)">{{ formatDateTime(currentContentType.updatedAt) }}</b></span>
            </div>
          </div>
        </section>
      </TabsContent>

      <TabsContent value="fields" class="grid gap-3">
        <article
          v-for="field in sortedFields"
          :key="field.id"
          class="grid gap-3 rounded-md border border-(--app-line) bg-(--app-surface) p-4 shadow-(--app-shadow)"
        >
          <div class="flex items-start justify-between gap-3 max-[640px]:flex-col">
            <div class="min-w-0">
              <h2 class="m-0 text-sm font-semibold text-(--app-ink)">{{ field.name }}</h2>
              <p class="m-0 text-[12.5px] text-(--app-muted)">{{ field.fieldKey }}</p>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <Badge variant="secondary">{{ fieldTypeLabel(field.fieldType) }}</Badge>
              <Badge :variant="field.isRequired ? 'default' : 'outline'">{{ field.isRequired ? 'Requerido' : 'Opcional' }}</Badge>
              <Badge variant="outline">Orden {{ field.order + 1 }}</Badge>
            </div>
          </div>

          <pre class="max-h-64 overflow-auto rounded-md border border-(--app-line) bg-(--app-surface-2) p-3 text-[12.5px] text-(--app-ink)">{{ metaText(field.meta) }}</pre>
        </article>

        <section
          v-if="sortedFields.length === 0"
          class="rounded-md border border-dashed border-(--app-line) bg-(--app-surface-2) px-4 py-7 text-center text-[13px] text-(--app-muted)"
        >
          Sin campos definidos.
        </section>
      </TabsContent>

      <TabsContent value="versions" class="grid gap-4">
        <section class="overflow-hidden rounded-md border border-(--app-line) bg-(--app-surface) shadow-(--app-shadow)">
          <Table class="min-w-[760px]">
            <TableHeader>
              <TableRow class="bg-(--app-surface-2)">
                <TableHead>Versión</TableHead>
                <TableHead>Snapshot</TableHead>
                <TableHead>Creación</TableHead>
                <TableHead class="w-44 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="version in versions" :key="version.id">
                <TableCell>
                  <div class="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">v{{ version.version }}</Badge>
                    <Badge v-if="version.version === currentVersion" variant="outline">Actual</Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div class="grid gap-1">
                    <span class="text-sm font-medium text-(--app-ink)">{{ version.schemaSnapshot.name }}</span>
                    <span class="text-[12.5px] text-(--app-muted)">
                      {{ version.schemaSnapshot.fields.length }} campos · {{ version.schemaSnapshot.slug }}
                    </span>
                  </div>
                </TableCell>
                <TableCell class="text-[13px] text-(--app-muted)">
                  {{ formatDateTime(version.createdAt) }}
                </TableCell>
                <TableCell class="text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    :disabled="version.version === currentVersion"
                    @click="diffVersion = version"
                  >
                    <GitCompare :size="14" />
                    Diff
                  </Button>
                </TableCell>
              </TableRow>

              <TableRow v-if="versions.length === 0">
                <TableCell colspan="4" class="h-28 text-center text-(--app-muted)">
                  {{ isLoading ? 'Cargando versiones...' : 'Sin versiones guardadas.' }}
                </TableCell>
              </TableRow>
              <TableRow v-else-if="restorableVersions.length === 0">
                <TableCell colspan="4" class="h-20 text-center text-(--app-muted)">
                  Solo existe la versión actual. No hay versiones restaurables para comparar.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        <section
          v-if="diffVersion"
          class="grid gap-3 rounded-md border border-(--app-line) bg-(--app-surface) p-4 shadow-(--app-shadow)"
        >
          <div class="flex items-center justify-between gap-3 max-[640px]:flex-col max-[640px]:items-stretch">
            <div>
              <h2 class="m-0 text-sm font-semibold text-(--app-ink)">
                Restaurar v{{ diffVersion.version }} sobre v{{ currentVersion }} actual
              </h2>
              <p class="m-0 text-[12.5px] text-(--app-muted)">
                Diff entre versión actual y snapshot seleccionado.
              </p>
            </div>
            <div class="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" @click="diffVersion = null">
                Cerrar
              </Button>
              <Button
                type="button"
                size="sm"
                :disabled="isLoading || diffVersion.version === currentVersion"
                @click="restoreVersion(diffVersion)"
              >
                <RotateCcw :size="14" />
                Restaurar
              </Button>
            </div>
          </div>

          <ContentTypeVersionDiff :content-type="currentContentType" :version="diffVersion" />
        </section>
      </TabsContent>
    </Tabs>

    <section
      v-else-if="isLoading"
      class="rounded-md border border-(--app-line) bg-(--app-surface) px-4 py-8 text-center text-[13px] text-(--app-muted)"
    >
      Cargando tipo de contenido...
    </section>
  </div>
</template>
