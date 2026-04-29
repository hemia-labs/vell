<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  AlertCircleIcon,
  ArchiveRestore,
  File,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from 'lucide-vue-next'
import VActionMenu, { type VActionMenuAction } from '@/components/core/VActionMenu.vue'
import VDropzone from '@/components/core/dropzone/VDropzone.vue'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useAuthorization } from '@/composables/auth/useAuthorization'
import { useMediaLibrary } from '@/composables/media/useMediaLibrary'
import type { Media, MediaKind } from '@/domain/models/media.model'

const ITEMS_PER_PAGE = 12
const ALL_KINDS_VALUE = 'all'
const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024
const MEDIA_ALLOWED_TYPES = ['image/*', 'video/*', 'audio/*', 'application/pdf']

const {
  media,
  currentReferences,
  v$,
  isLoading,
  errorMessage,
  loadMedia,
  loadMediaById,
  loadMediaReferences,
  deleteMedia,
  restoreMedia,
  uploadMedia,
  submitUpdateMedia,
  resetForm
} = useMediaLibrary()
const { can, filterAllowed } = useAuthorization()

const search = ref('')
const selectedKind = ref<string>(ALL_KINDS_VALUE)
const includeDeleted = ref(false)
const currentPage = ref(1)
const selectedMediaId = ref<string | null>(null)
const selectedAction = ref<string | null>(null)
const isDetailDialogOpen = ref(false)
const isUploadDialogOpen = ref(false)
const isEditDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const deleteMode = ref<'soft' | 'hard'>('soft')
const detailDeleteMode = ref<'soft' | 'hard'>('soft')
const showDetailDeleteConfirm = ref(false)
const showDetailRenameForm = ref(false)
const pendingUploadFiles = ref<File[]>([])
const objectUrls = new Map<File, string>()

const actions: VActionMenuAction[] = [
  { key: 'detail', label: 'Ver detalle', permission: 'media:view' },
  { key: 'edit', label: 'Renombrar', permission: 'media:edit' },
  { key: 'restore', label: 'Restaurar', permission: 'media:restore' },
  { key: 'delete', label: 'Eliminar', permission: 'media:delete', danger: true },
  { key: 'hard-delete', label: 'Eliminar permanente', permission: 'media:delete', danger: true }
]

const normalizedSearch = computed(() => search.value.trim().toLowerCase())
const selectedMedia = computed(() => media.value.find((item) => item.id === selectedMediaId.value) ?? null)
const filteredMedia = computed(() => {
  return media.value.filter((item) => {
    if (!includeDeleted.value && item.deletedAt) {
      return false
    }

    if (selectedKind.value !== ALL_KINDS_VALUE && getMediaKind(item) !== selectedKind.value) {
      return false
    }

    if (!normalizedSearch.value) {
      return true
    }

    return [item.originalName, item.filename, item.mimeType, item.uploadedBy?.name, item.uploadedBy?.email]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch.value))
  })
})
const pagedMedia = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  return filteredMedia.value.slice(start, start + ITEMS_PER_PAGE)
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredMedia.value.length / ITEMS_PER_PAGE)))
const paginationStart = computed(() => filteredMedia.value.length ? (currentPage.value - 1) * ITEMS_PER_PAGE + 1 : 0)
const paginationEnd = computed(() => Math.min(currentPage.value * ITEMS_PER_PAGE, filteredMedia.value.length))
const activeMediaCount = computed(() => media.value.filter((item) => !item.deletedAt).length)
const deletedMediaCount = computed(() => media.value.filter((item) => item.deletedAt).length)

watch([search, selectedKind], () => {
  currentPage.value = 1
})

watch(includeDeleted, async () => {
  currentPage.value = 1
  await loadAll()
})

watch(filteredMedia, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

async function loadAll() {
  await loadMedia({
    withUploader: true,
    withDeleted: includeDeleted.value,
    onlyDeleted: includeDeleted.value
  })
}

function openUploadDialog() {
  pendingUploadFiles.value = []
  isUploadDialogOpen.value = true
}

async function submitUpload() {
  if (pendingUploadFiles.value.length === 0) {
    return
  }

  const uploaded = await uploadMedia(pendingUploadFiles.value)
  if (uploaded) {
    pendingUploadFiles.value = []
    isUploadDialogOpen.value = false
    await loadAll()
  }
}

async function handleAction(action: VActionMenuAction, item: Media) {
  if (!can(action.permission)) {
    return
  }

  selectedAction.value = action.key
  selectedMediaId.value = item.id

  if (action.key === 'detail') {
    await openDetail(item)
  }

  if (action.key === 'edit') {
    await loadMediaById(item.id)
    isEditDialogOpen.value = true
  }

  if (action.key === 'restore') {
    const result = await restoreMedia(item.id)
    if (result) {
      await loadAll()
    }
  }

  if (action.key === 'delete' || action.key === 'hard-delete') {
    deleteMode.value = action.key === 'hard-delete' ? 'hard' : 'soft'
    isDeleteDialogOpen.value = true
  }
}

async function openDetail(item: Media) {
  selectedMediaId.value = item.id
  currentReferences.value = null
  showDetailDeleteConfirm.value = false
  showDetailRenameForm.value = false
  isDetailDialogOpen.value = true
  await loadMediaReferences(item.id)
}

async function requestDetailRename(item: Media) {
  await loadMediaById(item.id)
  showDetailDeleteConfirm.value = false
  showDetailRenameForm.value = true
}

function requestDetailDelete(mode: 'soft' | 'hard' = 'soft') {
  detailDeleteMode.value = mode
  showDetailDeleteConfirm.value = true
}

async function confirmDetailDelete() {
  if (!selectedMediaId.value) {
    return
  }

  const result = await deleteMedia(selectedMediaId.value, detailDeleteMode.value === 'hard' ? 'hard' : undefined)
  if (!result) {
    return
  }

  showDetailDeleteConfirm.value = false
  isDetailDialogOpen.value = false
  selectedMediaId.value = null
  await loadAll()
}

async function submitEdit() {
  if (!selectedMediaId.value) {
    return
  }

  const result = await submitUpdateMedia(selectedMediaId.value)
  if (!result) {
    return
  }

  isEditDialogOpen.value = false
  resetForm()
  await loadAll()
}

async function submitDetailRename() {
  if (!selectedMediaId.value) {
    return
  }

  const result = await submitUpdateMedia(selectedMediaId.value)
  if (!result) {
    return
  }

  showDetailRenameForm.value = false
  await loadAll()
}

async function confirmDelete() {
  if (!selectedMediaId.value) {
    return
  }

  const result = await deleteMedia(selectedMediaId.value, deleteMode.value === 'hard' ? 'hard' : undefined)
  if (!result) {
    return
  }

  isDeleteDialogOpen.value = false
  selectedMediaId.value = null
  await loadAll()
}

function getMediaKind(item: Media): MediaKind | 'file' {
  if (item.mimeType.startsWith('image/')) return 'image'
  if (item.mimeType.startsWith('video/')) return 'video'
  if (item.mimeType.startsWith('audio/')) return 'audio'
  if (item.mimeType === 'application/pdf') return 'pdf'
  return 'file'
}

function getMediaIcon(item: Media) {
  const kind = getMediaKind(item)
  if (kind === 'image') return FileImage
  if (kind === 'video') return FileVideo
  if (kind === 'audio') return FileAudio
  if (kind === 'pdf') return FileText
  return File
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
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

function isImage(item: Media | null) {
  return Boolean(item?.mimeType.startsWith('image/'))
}

function isVideo(item: Media | null) {
  return Boolean(item?.mimeType.startsWith('video/'))
}

function isAudio(item: Media | null) {
  return Boolean(item?.mimeType.startsWith('audio/'))
}

function isPdf(item: Media | null) {
  return item?.mimeType === 'application/pdf'
}

function isImageFile(file: File) {
  return file.type.startsWith('image/')
}

function getLocalPreviewUrl(file: File) {
  const existingUrl = objectUrls.get(file)
  if (existingUrl) {
    return existingUrl
  }

  const objectUrl = URL.createObjectURL(file)
  objectUrls.set(file, objectUrl)
  return objectUrl
}

function removePendingUploadFile(index: number) {
  const file = pendingUploadFiles.value[index]
  if (file) {
    revokeObjectUrl(file)
  }
  pendingUploadFiles.value = pendingUploadFiles.value.filter((_, currentIndex) => currentIndex !== index)
}

function revokeObjectUrl(file: File) {
  const objectUrl = objectUrls.get(file)
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
    objectUrls.delete(file)
  }
}

function getAllowedActions(item: Media) {
  return filterAllowed(actions).filter((action) => {
    if (item.deletedAt) {
      return action.key !== 'edit' && action.key !== 'delete'
    }

    return action.key !== 'restore'
  })
}

function goToPreviousPage() {
  currentPage.value = Math.max(1, currentPage.value - 1)
}

function goToNextPage() {
  currentPage.value = Math.min(totalPages.value, currentPage.value + 1)
}

onMounted(loadAll)
onBeforeUnmount(() => {
  objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl))
  objectUrls.clear()
})
</script>

<template>
  <div class="flex w-full flex-col gap-5.5">
    <section class="flex items-start justify-between gap-6 max-[760px]:flex-col max-[760px]:items-stretch">
      <div>
        <div class="mb-1 text-3xl font-semibold leading-tight text-(--app-ink)">
          Media Library
        </div>
        <p class="m-0 max-w-2xl text-[13.5px] text-(--app-muted)">
          Administra imágenes, videos, audios, PDFs y archivos usados por contenido.
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2 max-[760px]:flex-wrap">
        <Button variant="outline" size="sm" :disabled="isLoading" @click="loadAll">
          <RefreshCw :size="14" :class="{ 'animate-spin': isLoading }" />
          Actualizar
        </Button>
        <Button v-can="'media:upload'" size="sm" :disabled="isLoading" @click="openUploadDialog">
          <Upload :size="14" />
          Subir archivos
        </Button>
      </div>
    </section>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <section class="grid gap-4">
      <div class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-md border border-(--app-line) bg-(--app-surface) p-3">
          <span class="block text-[12px] text-(--app-muted)">Activos</span>
          <strong class="text-2xl text-(--app-ink)">{{ activeMediaCount }}</strong>
        </div>
        <div class="rounded-md border border-(--app-line) bg-(--app-surface) p-3">
          <span class="block text-[12px] text-(--app-muted)">Papelera</span>
          <strong class="text-2xl text-(--app-ink)">{{ deletedMediaCount }}</strong>
        </div>
        <div class="rounded-md border border-(--app-line) bg-(--app-surface) p-3">
          <span class="block text-[12px] text-(--app-muted)">Mostrados</span>
          <strong class="text-2xl text-(--app-ink)">{{ filteredMedia.length }}</strong>
        </div>
      </div>

      <section class="flex items-end justify-between gap-3 max-[860px]:flex-col max-[860px]:items-stretch" aria-label="Filtros de media">
        <Field class="min-w-[min(100%,320px)] flex-[1_1_420px]">
          <FieldLabel class="sr-only" for="media-search">Buscar archivos</FieldLabel>
          <FieldContent class="relative text-(--app-muted)">
            <Search class="absolute left-3 top-1/2 z-[1] -translate-y-1/2" :size="14" />
            <Input
              id="media-search"
              v-model="search"
              class="h-8.5 border-(--app-line) bg-(--app-surface) pl-8.5 text-[13px] text-(--app-ink)"
              placeholder="Buscar por nombre, tipo o usuario"
            />
          </FieldContent>
        </Field>

        <div class="flex items-center gap-3 max-[520px]:flex-col max-[520px]:items-stretch">
          <Field class="min-w-[180px]">
            <FieldLabel class="sr-only">Tipo</FieldLabel>
            <Select v-model="selectedKind">
              <SelectTrigger class="h-8.5 border-(--app-line) bg-(--app-surface) text-[13px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="ALL_KINDS_VALUE">Todos</SelectItem>
                <SelectItem value="image">Imágenes</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <label class="flex h-8.5 items-center gap-2 rounded-md border border-(--app-line) bg-(--app-surface) px-3 text-[13px] text-(--app-ink)">
            <Checkbox v-model:checked="includeDeleted" />
            Papelera
          </label>
        </div>
      </section>

      <section class="grid gap-3" aria-label="Galería de media">
        <div
          v-if="pagedMedia.length"
          class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3"
        >
          <article
            v-for="item in pagedMedia"
            :key="item.id"
            class="group grid min-w-0 overflow-hidden rounded-md border border-(--app-line) bg-(--app-surface) shadow-(--app-shadow) transition hover:border-(--app-ink)"
          >
            <button
              type="button"
              class="relative block aspect-square w-full overflow-hidden bg-(--app-surface-2) text-(--app-muted)"
              :aria-label="`Ver detalle de ${item.originalName}`"
              @click="openDetail(item)"
            >
              <img
                v-if="isImage(item)"
                :src="item.previewUrl || item.url"
                :alt="item.originalName"
                class="h-full w-full object-cover transition group-hover:scale-[1.02]"
              >
              <span v-else class="flex h-full w-full items-center justify-center">
                <component :is="getMediaIcon(item)" :size="42" />
              </span>
              <span class="absolute left-2 top-2">
                <Badge :variant="item.deletedAt ? 'destructive' : 'secondary'">
                  {{ item.deletedAt ? 'Papelera' : getMediaKind(item) }}
                </Badge>
              </span>
            </button>

            <div class="grid gap-2 p-3">
              <div class="flex min-w-0 items-start justify-between gap-2">
                <div class="min-w-0">
                  <button
                    type="button"
                    class="block max-w-full truncate text-left text-[13px] font-medium text-(--app-ink) hover:underline"
                    @click="openDetail(item)"
                  >
                    {{ item.originalName }}
                  </button>
                  <span class="block truncate text-[12px] text-(--app-muted)">{{ item.mimeType }}</span>
                </div>

                <VActionMenu
                  v-model="selectedAction"
                  :actions="getAllowedActions(item)"
                  label="Acciones de archivo"
                  @select="handleAction($event, item)"
                />
              </div>

              <div class="flex items-center justify-between gap-2 text-[12px] text-(--app-muted)">
                <span>{{ formatFileSize(item.size) }}</span>
                <span>{{ formatDate(item.updatedAt) }}</span>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="rounded-md border border-dashed border-(--app-line) bg-(--app-surface) p-10 text-center text-[13px] text-(--app-muted)">
          {{ isLoading ? 'Cargando archivos...' : 'No hay archivos que coincidan con los filtros.' }}
        </div>

        <div class="flex min-h-10 items-center justify-between gap-3 rounded-md border border-(--app-line) bg-(--app-surface) px-3 py-2 text-[12.5px] text-(--app-muted) max-[640px]:flex-col max-[640px]:items-stretch">
          <p class="m-0">
            Mostrando <strong class="text-(--app-ink)">{{ paginationStart }}-{{ paginationEnd }}</strong> de <strong class="text-(--app-ink)">{{ filteredMedia.length }}</strong>
          </p>
          <div class="flex justify-end gap-2">
            <Button variant="outline" size="sm" :disabled="currentPage <= 1" @click="goToPreviousPage">
              Anterior
            </Button>
            <Button variant="outline" size="sm" :disabled="currentPage >= totalPages" @click="goToNextPage">
              Siguiente
            </Button>
          </div>
        </div>
      </section>
    </section>

    <Dialog v-model:open="isDetailDialogOpen">
      <DialogContent class="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle class="truncate pr-8">{{ selectedMedia?.originalName ?? 'Archivo' }}</DialogTitle>
          <DialogDescription>Detalle del archivo y uso dentro del CMS.</DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
          <div class="flex min-h-[280px] items-center justify-center overflow-hidden rounded-md border border-(--app-line) bg-(--app-surface-2)">
            <img v-if="isImage(selectedMedia)" :src="selectedMedia?.previewUrl || selectedMedia?.url" :alt="selectedMedia?.originalName" class="max-h-[60vh] w-full object-contain">
            <video v-else-if="isVideo(selectedMedia)" :src="selectedMedia?.previewUrl || selectedMedia?.url" class="max-h-[60vh] w-full" controls />
            <audio v-else-if="isAudio(selectedMedia)" :src="selectedMedia?.previewUrl || selectedMedia?.url" class="w-full max-w-xl" controls />
            <iframe v-else-if="isPdf(selectedMedia)" :src="selectedMedia?.previewUrl || selectedMedia?.url" class="h-[60vh] w-full" title="PDF preview" />
            <div v-else class="grid justify-items-center gap-2 text-(--app-muted)">
              <File :size="34" />
              <span class="text-[13px]">{{ selectedMedia?.originalName }}</span>
            </div>
          </div>

          <div class="grid content-start gap-3">
            <section class="grid gap-2 rounded-md border border-(--app-line) bg-(--app-surface) p-3 text-[13px]">
              <div class="flex items-center justify-between gap-2">
                <span class="font-medium text-(--app-ink)">Datos</span>
                <Badge :variant="selectedMedia?.deletedAt ? 'destructive' : 'secondary'">
                  {{ selectedMedia?.deletedAt ? 'Papelera' : 'Activo' }}
                </Badge>
              </div>
              <dl v-if="selectedMedia" class="grid gap-2 text-[12.5px]">
                <div class="grid gap-0.5">
                  <dt class="text-(--app-muted)">Nombre</dt>
                  <dd class="m-0 break-words text-(--app-ink)">{{ selectedMedia.originalName }}</dd>
                </div>
                <div class="grid gap-0.5">
                  <dt class="text-(--app-muted)">Archivo</dt>
                  <dd class="m-0 break-all text-(--app-ink)">{{ selectedMedia.filename }}</dd>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <dt class="text-(--app-muted)">Tipo</dt>
                    <dd class="m-0 text-(--app-ink)">{{ selectedMedia.mimeType }}</dd>
                  </div>
                  <div>
                    <dt class="text-(--app-muted)">Tamaño</dt>
                    <dd class="m-0 text-(--app-ink)">{{ formatFileSize(selectedMedia.size) }}</dd>
                  </div>
                </div>
                <div class="grid gap-0.5">
                  <dt class="text-(--app-muted)">Subido por</dt>
                  <dd class="m-0 text-(--app-ink)">{{ selectedMedia.uploadedBy?.name ?? 'Sistema' }}</dd>
                  <dd class="m-0 text-(--app-muted)">{{ selectedMedia.uploadedBy?.email ?? selectedMedia.uploadedById ?? 'Sin usuario' }}</dd>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <dt class="text-(--app-muted)">Creado</dt>
                    <dd class="m-0 text-(--app-ink)">{{ formatDate(selectedMedia.createdAt) }}</dd>
                  </div>
                  <div>
                    <dt class="text-(--app-muted)">Actualizado</dt>
                    <dd class="m-0 text-(--app-ink)">{{ formatDate(selectedMedia.updatedAt) }}</dd>
                  </div>
                </div>
              </dl>
            </section>

            <section class="grid gap-2 rounded-md border border-(--app-line) bg-(--app-surface) p-3 text-[13px]">
              <div class="font-medium text-(--app-ink)">Referencias</div>
              <div v-if="currentReferences" class="grid grid-cols-2 gap-2 text-[12.5px]">
                <span>Contenido: {{ currentReferences.contentMedia }}</span>
                <span>Portadas: {{ currentReferences.coverImages }}</span>
                <span>Campos: {{ currentReferences.fieldValues }}</span>
                <span>Total: {{ currentReferences.total }}</span>
              </div>
              <div v-else class="text-[12.5px] text-(--app-muted)">Cargando referencias...</div>
            </section>

            <section class="grid gap-2">
              <div class="flex flex-wrap gap-2">
                <Button v-if="can('media:edit') && selectedMedia && !selectedMedia.deletedAt" variant="outline" size="sm" @click="requestDetailRename(selectedMedia)">
                  <Pencil :size="14" />
                  Renombrar
                </Button>
                <Button v-if="can('media:restore') && selectedMedia?.deletedAt" variant="outline" size="sm" @click="selectedMedia && handleAction({ key: 'restore', label: 'Restaurar', permission: 'media:restore' }, selectedMedia)">
                  <ArchiveRestore :size="14" />
                  Restaurar
                </Button>
                <Button
                  v-if="can('media:delete') && selectedMedia"
                  variant="destructive"
                  size="sm"
                  @click="requestDetailDelete('soft')"
                >
                  <Trash2 :size="14" />
                  Eliminar
                </Button>
              </div>

              <form v-if="showDetailRenameForm" class="grid gap-3 rounded-md border border-(--app-line) bg-(--app-surface-2) p-3 text-[13px]" @submit.prevent="submitDetailRename">
                <div class="grid gap-1">
                  <strong class="font-medium text-(--app-ink)">Renombrar archivo</strong>
                  <span class="text-(--app-muted)">Actualiza el nombre visible sin salir del detalle.</span>
                </div>

                <Field>
                  <FieldLabel for="media-detail-original-name">Nombre</FieldLabel>
                  <FieldContent>
                    <Input id="media-detail-original-name" v-model="v$.originalName.$model" placeholder="archivo.webp" />
                    <FieldError :errors="v$.originalName.$errors.map((error) => String(error.$message))" />
                  </FieldContent>
                </Field>

                <div class="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" :disabled="isLoading" @click="showDetailRenameForm = false">
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" :disabled="isLoading">
                    <Pencil :size="14" />
                    Guardar
                  </Button>
                </div>
              </form>

              <div v-if="showDetailDeleteConfirm" class="grid gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-[13px]">
                <div class="grid gap-1">
                  <strong class="font-medium text-destructive">
                    {{ detailDeleteMode === 'hard' ? 'Eliminar permanente' : 'Enviar a papelera' }}
                  </strong>
                  <span class="text-(--app-ink)">
                    {{ detailDeleteMode === 'hard'
                      ? 'Esta acción eliminará el archivo del storage y no se podrá restaurar.'
                      : 'El archivo dejará de aparecer en la librería activa y podrás restaurarlo desde papelera.' }}
                  </span>
                </div>

                <div class="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" :disabled="isLoading" @click="showDetailDeleteConfirm = false">
                    Cancelar
                  </Button>
                  <Button type="button" variant="destructive" size="sm" :disabled="isLoading" @click="confirmDetailDelete">
                    <Trash2 :size="14" />
                    Confirmar
                  </Button>
                  <Button
                    v-if="detailDeleteMode === 'soft' && can('media:delete')"
                    type="button"
                    variant="outline"
                    size="sm"
                    :disabled="isLoading"
                    @click="detailDeleteMode = 'hard'"
                  >
                    Permanente
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="isUploadDialogOpen">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Subir archivos</DialogTitle>
          <DialogDescription>Prepara la cola antes de cargar a la librería.</DialogDescription>
        </DialogHeader>

        <div class="grid gap-4">
          <VDropzone
            v-model="pendingUploadFiles"
            input-id="media-library-upload"
            multiple
            :max-files="10"
            :max-size-bytes="MAX_UPLOAD_FILE_SIZE_BYTES"
            :allowed-types="MEDIA_ALLOWED_TYPES"
            :disabled="isLoading"
            title="Selecciona o arrastra archivos"
            helper-text="Imágenes, video, audio o PDF. Máximo 10 MB por archivo."
          />

          <div v-if="pendingUploadFiles.length" class="grid gap-2">
            <div class="text-[12.5px] font-medium text-(--app-ink)">Cola de carga</div>
            <div class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
              <article
                v-for="(file, index) in pendingUploadFiles"
                :key="`${file.name}-${file.size}-${file.lastModified}`"
                class="overflow-hidden rounded-md border border-(--app-line) bg-(--app-surface)"
              >
                <div class="flex aspect-square items-center justify-center bg-(--app-surface-2) text-(--app-muted)">
                  <img v-if="isImageFile(file)" :src="getLocalPreviewUrl(file)" :alt="file.name" class="h-full w-full object-cover">
                  <File v-else :size="32" />
                </div>
                <div class="grid gap-2 p-2">
                  <div class="min-w-0">
                    <p class="m-0 truncate text-[12.5px] font-medium text-(--app-ink)">{{ file.name }}</p>
                    <p class="m-0 text-[11.5px] text-(--app-muted)">{{ file.type || 'Tipo desconocido' }} · {{ formatFileSize(file.size) }}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" :disabled="isLoading" @click="removePendingUploadFile(index)">
                    Quitar
                  </Button>
                </div>
              </article>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" :disabled="isLoading" @click="isUploadDialogOpen = false">
            Cancelar
          </Button>
          <Button type="button" :disabled="isLoading || pendingUploadFiles.length === 0" @click="submitUpload">
            <Upload :size="14" />
            Subir {{ pendingUploadFiles.length || '' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Renombrar archivo</DialogTitle>
          <DialogDescription>Actualiza el nombre visible en la librería.</DialogDescription>
        </DialogHeader>

        <form class="grid gap-4" @submit.prevent="submitEdit">
          <Field>
            <FieldLabel for="media-original-name">Nombre</FieldLabel>
            <FieldContent>
              <Input id="media-original-name" v-model="v$.originalName.$model" placeholder="archivo.webp" />
              <FieldError :errors="v$.originalName.$errors.map((error) => String(error.$message))" />
            </FieldContent>
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" :disabled="isLoading" @click="isEditDialogOpen = false">
              Cancelar
            </Button>
            <Button type="submit" :disabled="isLoading">
              <Pencil :size="14" />
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="flex items-center gap-2">
            <Trash2 v-if="deleteMode === 'hard'" :size="18" />
            <ArchiveRestore v-else :size="18" />
            {{ deleteMode === 'hard' ? 'Eliminar permanente' : 'Enviar a papelera' }}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {{ deleteMode === 'hard'
              ? `Se eliminará "${selectedMedia?.originalName}" de forma permanente.`
              : `Se enviará "${selectedMedia?.originalName}" a papelera.` }}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isLoading">Cancelar</AlertDialogCancel>
          <AlertDialogAction class="bg-destructive text-white hover:bg-destructive/90" :disabled="isLoading" @click="confirmDelete">
            {{ deleteMode === 'hard' ? 'Eliminar permanente' : 'Enviar a papelera' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
