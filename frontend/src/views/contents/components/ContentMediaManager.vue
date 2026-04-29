<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { ExternalLink, Eye, FileText, ImagePlus, Trash2 } from 'lucide-vue-next'
import { VDropzone } from '@/components/core/dropzone'
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
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ContentMediaInput, ContentMediaRole, JsonObject } from '@/domain/models/content.model'

const props = defineProps<{
  mediaItems: ContentMediaInput[]
  roles: ContentMediaRole[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  add: [file: File, meta?: JsonObject]
  update: [index: number, payload: Partial<ContentMediaInput>]
  remove: [index: number]
}>()

const roleLabels: Record<ContentMediaRole, string> = {
  hero: 'Hero',
  gallery: 'Galería',
  attachment: 'Adjunto',
  inline: 'Inline',
  og_image: 'OG image'
}

const mediaAllowedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf']
const previewIndex = ref<number | null>(null)
const removeIndex = ref<number | null>(null)
const objectUrls = new Map<File, string>()

const previewItem = computed(() => {
  if (previewIndex.value === null) {
    return null
  }

  return props.mediaItems[previewIndex.value] ?? null
})

const previewUrl = computed(() => previewItem.value ? getPreviewUrl(previewItem.value) : '')
const previewName = computed(() => previewItem.value ? getFileName(previewItem.value) : 'Archivo')
const previewMimeType = computed(() => previewItem.value ? getStringMeta(previewItem.value, 'mimeType') : '')
const removeItemName = computed(() => {
  if (removeIndex.value === null) {
    return 'este archivo'
  }

  const item = props.mediaItems[removeIndex.value]
  return item ? getFileName(item) : 'este archivo'
})

function addFiles(files: File[]) {
  files.forEach((file) => {
    emit('add', file, {
      originalName: file.name,
      mimeType: file.type,
      size: file.size
    })
  })
}

function getFileName(item: ContentMediaInput) {
  return getStringMeta(item, 'originalName') || item.file?.name || 'Archivo sin nombre'
}

function getStringMeta(item: ContentMediaInput, key: string) {
  const value = item.meta?.[key]
  return typeof value === 'string' ? value : ''
}

function getNumberMeta(item: ContentMediaInput, key: string) {
  const value = item.meta?.[key]
  return typeof value === 'number' ? value : null
}

function formatFileSize(value: number | null) {
  if (value === null) {
    return '-'
  }

  if (value < 1024) {
    return `${value} B`
  }

  const units = ['KB', 'MB', 'GB']
  let size = value / 1024
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`
}

function isImage(item: ContentMediaInput) {
  return getMimeType(item).startsWith('image/')
}

function isVideo(item: ContentMediaInput) {
  return getMimeType(item).startsWith('video/')
}

function isAudio(item: ContentMediaInput) {
  return getMimeType(item).startsWith('audio/')
}

function isPdf(item: ContentMediaInput) {
  return getMimeType(item) === 'application/pdf'
}

function getMimeType(item: ContentMediaInput) {
  return getStringMeta(item, 'mimeType') || item.file?.type || ''
}

function getPreviewUrl(item: ContentMediaInput) {
  if (item.file) {
    const existingUrl = objectUrls.get(item.file)
    if (existingUrl) {
      return existingUrl
    }

    const objectUrl = URL.createObjectURL(item.file)
    objectUrls.set(item.file, objectUrl)
    return objectUrl
  }

  return getStringMeta(item, 'previewUrl') || getStringMeta(item, 'url')
}

function canPreview(item: ContentMediaInput) {
  return Boolean(getPreviewUrl(item))
}

function openMediaPreview(index: number) {
  previewIndex.value = index
}

function requestRemoveItem(index: number) {
  removeIndex.value = index
}

function confirmRemoveItem() {
  if (removeIndex.value === null) {
    return
  }

  removeItem(removeIndex.value)
  removeIndex.value = null
}

function removeItem(index: number) {
  const item = props.mediaItems[index]
  if (item?.file) {
    revokeObjectUrl(item.file)
  }

  if (previewIndex.value === index) {
    previewIndex.value = null
  }

  emit('remove', index)
}

onBeforeUnmount(() => {
  objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl))
  objectUrls.clear()
})

function revokeObjectUrl(file: File) {
  const objectUrl = objectUrls.get(file)
  if (!objectUrl) {
    return
  }

  URL.revokeObjectURL(objectUrl)
  objectUrls.delete(file)
}
</script>

<template>
  <div class="grid gap-4">
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 text-[13px] font-medium text-(--app-ink)">
        <ImagePlus :size="15" />
        Media del contenido
      </div>
    </div>

    <VDropzone
      :allowed-types="mediaAllowedTypes"
      :multiple="true"
      :disabled="disabled"
      title="Adjuntar media"
      helper-text="Imágenes, video, audio o PDF"
      @update:model-value="addFiles"
    />

    <div v-if="!mediaItems.length" class="rounded-md border border-dashed border-(--app-line) bg-(--app-surface-2) p-4 text-[13px] text-(--app-muted)">
      Adjunta media para revisar datos del archivo antes de guardarlo.
    </div>

    <div v-for="(item, index) in mediaItems" :key="`${item.mediaId ?? item.file?.name ?? getStringMeta(item, 'originalName')}-${index}`" class="rounded-md border border-(--app-line) bg-(--app-surface) p-3">
      <div class="grid grid-cols-[minmax(260px,1fr)_160px_82px_92px] items-end gap-3 max-[980px]:grid-cols-[minmax(0,1fr)_150px_82px] max-[760px]:grid-cols-1">
        <div class="flex min-h-[58px] min-w-0 items-center gap-3">
          <button
            type="button"
            class="group relative size-11 shrink-0 overflow-hidden rounded-md border border-(--app-line) bg-(--app-surface-2) text-(--app-muted)"
            :disabled="!canPreview(item)"
            :aria-label="`Previsualizar ${getFileName(item)}`"
            @click="openMediaPreview(index)"
          >
            <img
              v-if="isImage(item) && getPreviewUrl(item)"
              :src="getPreviewUrl(item)"
              :alt="getFileName(item)"
              class="h-full w-full object-cover"
            >
            <span v-else class="grid h-full w-full place-items-center">
              <FileText v-if="isPdf(item)" :size="16" />
              <ImagePlus v-else :size="16" />
            </span>
            <span v-if="canPreview(item)" class="absolute inset-0 hidden place-items-center bg-black/45 text-white group-hover:grid">
              <Eye :size="14" />
            </span>
          </button>
          <div class="min-w-0">
            <div class="truncate text-[13px] font-medium text-(--app-ink)">
              {{ getFileName(item) }}
            </div>
            <div class="mt-1.5 flex flex-wrap gap-1.5 text-[11.5px]">
              <span class="max-w-full truncate rounded-md border border-(--app-line) px-2 py-1 text-(--app-muted)">
                {{ getMimeType(item) || 'Tipo desconocido' }}
              </span>
              <span class="rounded-md border border-(--app-line) px-2 py-1 text-(--app-muted)">
                {{ formatFileSize(getNumberMeta(item, 'size')) }}
              </span>
            </div>
          </div>
        </div>

        <Field class="grid gap-1.5">
          <FieldLabel class="h-4 text-[12px] leading-4">Rol</FieldLabel>
          <FieldContent>
            <Select :model-value="item.role ?? 'gallery'" :disabled="disabled" @update:model-value="emit('update', index, { role: $event as ContentMediaRole })">
              <SelectTrigger class="h-9 w-full border-(--app-line) bg-(--app-surface)">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="role in roles" :key="role" :value="role">
                  {{ roleLabels[role] }}
                </SelectItem>
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>

        <div class="grid gap-1.5">
          <div class="h-4 text-[12px] font-medium leading-4 text-(--app-ink)">Orden</div>
          <div class="flex h-9 items-center justify-center rounded-md border border-(--app-line) px-3 text-[13px] font-medium text-(--app-ink)">
            #{{ index + 1 }}
          </div>
        </div>

        <div class="grid gap-1.5 max-[980px]:col-span-3 max-[760px]:col-span-1">
          <div class="h-4 text-[12px] font-medium leading-4 text-(--app-ink) max-[980px]:sr-only">Acciones</div>
          <div class="flex h-9 justify-end gap-2 max-[980px]:justify-start">
            <Button type="button" variant="outline" size="icon" class="h-9 w-9" :disabled="!canPreview(item)" @click="openMediaPreview(index)">
              <Eye :size="14" />
            </Button>
            <Button type="button" variant="outline" size="icon" class="h-9 w-9 text-destructive" :disabled="disabled" @click="requestRemoveItem(index)">
              <Trash2 :size="14" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <Dialog :open="previewIndex !== null" @update:open="previewIndex = $event ? previewIndex : null">
      <DialogContent class="max-h-[92vh] w-[min(1100px,calc(100vw-2rem))] max-w-none overflow-hidden p-0">
        <DialogHeader class="border-b border-(--app-line) px-4 py-3">
          <DialogTitle class="truncate pr-8 text-[15px]">{{ previewName }}</DialogTitle>
          <DialogDescription class="flex flex-wrap items-center gap-2 text-[12px]">
            <span>{{ previewMimeType || 'Tipo desconocido' }}</span>
            <a
              v-if="previewUrl"
              :href="previewUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 font-medium text-(--app-ink) hover:underline"
            >
              <ExternalLink :size="13" />
              Abrir archivo
            </a>
          </DialogDescription>
        </DialogHeader>

        <div class="grid max-h-[calc(92vh-78px)] min-h-[320px] place-items-center overflow-auto bg-(--app-bg) p-4">
          <img
            v-if="previewItem && isImage(previewItem) && previewUrl"
            :src="previewUrl"
            :alt="previewName"
            class="max-h-[calc(92vh-120px)] max-w-full rounded-md object-contain"
          >
          <video
            v-else-if="previewItem && isVideo(previewItem) && previewUrl"
            :src="previewUrl"
            class="max-h-[calc(92vh-120px)] w-full max-w-5xl rounded-md bg-black"
            controls
          />
          <audio
            v-else-if="previewItem && isAudio(previewItem) && previewUrl"
            :src="previewUrl"
            class="w-full max-w-2xl"
            controls
          />
          <iframe
            v-else-if="previewItem && isPdf(previewItem) && previewUrl"
            :src="previewUrl"
            :title="previewName"
            class="h-[calc(92vh-120px)] w-full rounded-md border border-(--app-line) bg-white"
          />
          <div v-else class="grid gap-2 text-center text-[13px] text-(--app-muted)">
            <FileText class="mx-auto" :size="28" />
            <span>No hay previsualización disponible para este archivo.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog :open="removeIndex !== null" @update:open="removeIndex = $event ? removeIndex : null">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar archivo</AlertDialogTitle>
          <AlertDialogDescription>
            Se quitará {{ removeItemName }} del contenido. El cambio se aplicará al guardar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction class="bg-destructive text-white hover:bg-destructive/90" :disabled="disabled" @click="confirmRemoveItem">
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
