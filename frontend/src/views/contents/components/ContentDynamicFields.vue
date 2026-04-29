<script setup lang="ts">
import { computed, ref } from 'vue'
import { ExternalLink, Eye, FileText, Trash2 } from 'lucide-vue-next'
import { VDropzone } from '@/components/core/dropzone'
import VDateTimePicker from '@/components/core/VDateTimePicker.vue'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea'
import type { ContentFieldValueInput } from '@/domain/models/content.model'
import type { ContentTypeField } from '@/domain/models/content-type.model'
import type { Media } from '@/domain/models/media.model'
import RichTextEditor from './RichTextEditor.vue'

type FieldMediaAsset = Pick<Media, 'id' | 'filename' | 'originalName' | 'mimeType' | 'size' | 'url' | 'previewUrl'>
type PendingRemoval = {
  field: ContentTypeField
  asset: FieldMediaAsset
}

const props = defineProps<{
  fields: ContentTypeField[]
  values: ContentFieldValueInput[]
  fieldErrors?: Record<string, string[]>
  disabled?: boolean
}>()

const emit = defineEmits<{
  updateValue: [fieldKey: string, value: unknown, fieldId?: string]
}>()

const sortedFields = computed(() => [...props.fields].sort((a, b) => a.order - b.order))
const previewAsset = ref<FieldMediaAsset | null>(null)
const pendingRemoval = ref<PendingRemoval | null>(null)
const previewAssetUrl = computed(() => previewAsset.value ? getAssetUrl(previewAsset.value) : '')

function getFieldValue(field: ContentTypeField) {
  return props.values.find((item) => item.fieldId === field.id || item.fieldKey === field.fieldKey)
}

function getValue(field: ContentTypeField) {
  return getFieldValue(field)?.value
}

function getMediaAssets(field: ContentTypeField) {
  return getFieldValue(field)?.mediaAssets ?? []
}

function toText(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

function getSelectOptions(field: ContentTypeField) {
  const options = field.meta?.options

  if (!Array.isArray(options)) {
    return []
  }

  return options
    .map((option) => {
      if (typeof option === 'string') {
        return { label: option, value: option }
      }

      if (!option || typeof option !== 'object') {
        return null
      }

      const optionRecord = option as Record<string, unknown>
      const label = String(optionRecord.text ?? optionRecord.label ?? optionRecord.value ?? '')
      const value = String(optionRecord.value ?? optionRecord.text ?? optionRecord.label ?? '')

      return label || value ? { label: label || value, value: value || label } : null
    })
    .filter((option): option is { label: string; value: string } => option !== null)
}

function shouldRenderSelect(field: ContentTypeField) {
  return field.fieldType === 'select' || (field.fieldType === 'text' && getSelectOptions(field).length > 0)
}

function toFiles(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is File => item instanceof File)
  }

  return value instanceof File ? [value] : []
}

function getAllowedTypes(field: ContentTypeField) {
  const allowedTypes = field.meta?.allowedTypes

  return Array.isArray(allowedTypes)
    ? allowedTypes.filter((item): item is string => typeof item === 'string')
    : []
}

function getNumberMeta(field: ContentTypeField, key: string) {
  const value = field.meta?.[key]
  return typeof value === 'number' ? value : undefined
}

function getTextMaxLength(field: ContentTypeField) {
  const maxLength = getNumberMeta(field, 'maxLength')

  if (maxLength && maxLength > 0) {
    return maxLength
  }

  if (field.fieldType === 'richtext') {
    return 20000
  }

  if (field.fieldType === 'textarea') {
    return 5000
  }

  if (field.fieldType === 'json') {
    return 10000
  }

  return 255
}

function getMaxSizeBytes(field: ContentTypeField) {
  return getNumberMeta(field, 'maxSizeBytes') ?? getNumberMeta(field, 'maxSize')
}

function updateFiles(field: ContentTypeField, files: File[]) {
  if (!isMultiple(field)) {
    emit('updateValue', field.fieldKey, files[0] ?? null, field.id)
    return
  }

  emit('updateValue', field.fieldKey, [...getMediaIds(getValue(field)), ...files], field.id)
}

function isMultiple(field: ContentTypeField) {
  return field.multiple === true || field.meta?.multiple === true
}

function updateJson(field: ContentTypeField, value: string) {
  try {
    emit('updateValue', field.fieldKey, value.trim() ? JSON.parse(value) : null, field.id)
  } catch {
    emit('updateValue', field.fieldKey, value, field.id)
  }
}

function removeMediaAsset(field: ContentTypeField, assetId: string) {
  if (!isMultiple(field)) {
    emit('updateValue', field.fieldKey, null, field.id)
    return
  }

  emit('updateValue', field.fieldKey, getMediaIds(getValue(field)).filter(id => id !== assetId), field.id)
}

function requestRemoveMediaAsset(field: ContentTypeField, asset: FieldMediaAsset) {
  pendingRemoval.value = { field, asset }
}

function confirmRemoveMediaAsset() {
  if (!pendingRemoval.value) {
    return
  }

  removeMediaAsset(pendingRemoval.value.field, pendingRemoval.value.asset.id)
  pendingRemoval.value = null
}

function getMediaIds(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  return typeof value === 'string' ? [value] : []
}

function isImageAsset(asset: FieldMediaAsset) {
  return asset.mimeType.startsWith('image/')
}

function isVideoAsset(asset: FieldMediaAsset) {
  return asset.mimeType.startsWith('video/')
}

function isAudioAsset(asset: FieldMediaAsset) {
  return asset.mimeType.startsWith('audio/')
}

function isPdfAsset(asset: FieldMediaAsset) {
  return asset.mimeType === 'application/pdf'
}

function getAssetUrl(asset: FieldMediaAsset) {
  return asset.previewUrl || asset.url
}

function openAssetPreview(asset: FieldMediaAsset) {
  previewAsset.value = asset
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  const units = ['KB', 'MB', 'GB']
  let size = bytes / 1024
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`
}
</script>

<template>
  <div class="grid gap-4">
    <div v-if="!sortedFields.length" class="rounded-md border border-dashed border-(--app-line) bg-(--app-surface-2) p-4 text-[13px] text-(--app-muted)">
      Este tipo de contenido no tiene campos personalizados.
    </div>

    <Field v-for="field in sortedFields" :key="field.id">
      <FieldLabel :for="`content-field-${field.id}`">
        {{ field.name }}
        <span v-if="field.isRequired" class="text-destructive">*</span>
      </FieldLabel>
      <FieldContent>
        <RichTextEditor
          v-if="field.fieldType === 'richtext'"
          :id="`content-field-${field.id}`"
          :model-value="toText(getValue(field))"
          :disabled="disabled"
          :maxlength="getTextMaxLength(field)"
          @update:model-value="emit('updateValue', field.fieldKey, $event, field.id)"
        />

        <Textarea
          v-else-if="field.fieldType === 'textarea'"
          :id="`content-field-${field.id}`"
          :model-value="toText(getValue(field))"
          class="min-h-28"
          :disabled="disabled"
          :maxlength="getTextMaxLength(field)"
          @update:model-value="emit('updateValue', field.fieldKey, String($event), field.id)"
        />

        <Select
          v-else-if="shouldRenderSelect(field)"
          :model-value="toText(getValue(field))"
          :disabled="disabled"
          @update:model-value="emit('updateValue', field.fieldKey, String($event), field.id)"
        >
          <SelectTrigger :id="`content-field-${field.id}`" class="h-9 w-full border-(--app-line) bg-(--app-surface)">
            <SelectValue placeholder="Selecciona una opción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in getSelectOptions(field)"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <template v-else-if="field.fieldType === 'image' || field.fieldType === 'file'">
          <VDropzone
            :input-id="`content-field-${field.id}`"
            :model-value="toFiles(getValue(field))"
            :allowed-types="getAllowedTypes(field)"
            :multiple="isMultiple(field)"
            :disabled="disabled"
            :max-files="getNumberMeta(field, 'maxFiles')"
            :max-size-bytes="getMaxSizeBytes(field)"
            :title="field.fieldType === 'image' ? 'Adjuntar imagen' : 'Adjuntar archivo'"
            @update:model-value="updateFiles(field, $event)"
          >
            <template v-if="getMediaAssets(field).length" #description>
              <span>{{ isMultiple(field) ? 'Agrega mas archivos o revisa los existentes abajo.' : 'Selecciona un archivo para reemplazar el actual.' }}</span>
            </template>
          </VDropzone>

          <div
            v-if="getMediaAssets(field).length"
            class="mt-2 grid gap-2"
          >
            <div class="text-[12px] font-medium text-(--app-muted)">Archivos guardados</div>
            <ul class="grid gap-2">
              <li
                v-for="asset in getMediaAssets(field)"
                :key="asset.id"
                class="rounded-md border border-(--app-line) bg-(--app-surface) p-3"
              >
                <div class="grid grid-cols-[minmax(260px,1fr)_92px] items-end gap-3 max-[760px]:grid-cols-1">
                  <div class="flex min-h-[58px] min-w-0 items-center gap-3">
                    <button
                      type="button"
                      class="group relative size-11 shrink-0 overflow-hidden rounded-md border border-(--app-line) bg-(--app-surface-2) text-(--app-muted)"
                      :aria-label="`Previsualizar ${asset.originalName || asset.filename}`"
                      @click="openAssetPreview(asset)"
                    >
                      <img
                        v-if="isImageAsset(asset)"
                        :src="getAssetUrl(asset)"
                        :alt="asset.originalName"
                        class="h-full w-full object-cover"
                      >
                      <span v-else class="grid h-full w-full place-items-center">
                        <FileText :size="16" />
                      </span>
                      <span class="absolute inset-0 hidden place-items-center bg-black/45 text-white group-hover:grid">
                        <Eye :size="14" />
                      </span>
                    </button>
                    <div class="min-w-0">
                      <button
                        type="button"
                        class="block max-w-full truncate text-left text-[13px] font-medium text-(--app-ink) hover:underline"
                        @click="openAssetPreview(asset)"
                      >
                        {{ asset.originalName || asset.filename }}
                      </button>
                      <div class="mt-1.5 flex flex-wrap gap-1.5 text-[11.5px]">
                        <span class="max-w-full truncate rounded-md border border-(--app-line) px-2 py-1 text-(--app-muted)">
                          {{ asset.mimeType || 'Tipo desconocido' }}
                        </span>
                        <span class="rounded-md border border-(--app-line) px-2 py-1 text-(--app-muted)">
                          {{ formatFileSize(asset.size) }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="grid gap-1.5">
                    <div class="h-4 text-[12px] font-medium leading-4 text-(--app-ink) max-[760px]:sr-only">Acciones</div>
                    <div class="flex h-9 justify-end gap-2 max-[760px]:justify-start">
                      <button
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-(--app-line) bg-transparent text-(--app-ink) shadow-xs transition-colors hover:bg-(--app-surface-2)"
                        aria-label="Ver archivo guardado"
                        @click="openAssetPreview(asset)"
                      >
                        <Eye :size="14" />
                      </button>
                      <button
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-(--app-line) bg-transparent text-destructive shadow-xs transition-colors hover:bg-(--app-surface-2)"
                        aria-label="Quitar archivo guardado"
                        :disabled="disabled"
                        @click="requestRemoveMediaAsset(field, asset)"
                      >
                        <Trash2 :size="14" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </template>

        <Checkbox
          v-else-if="field.fieldType === 'boolean'"
          :id="`content-field-${field.id}`"
          :model-value="Boolean(getValue(field))"
          :disabled="disabled"
          @update:model-value="emit('updateValue', field.fieldKey, Boolean($event), field.id)"
        />

        <Textarea
          v-else-if="field.fieldType === 'json'"
          :id="`content-field-${field.id}`"
          :model-value="JSON.stringify(getValue(field) ?? {}, null, 2)"
          class="min-h-28 font-mono text-xs"
          :disabled="disabled"
          :maxlength="getTextMaxLength(field)"
          @update:model-value="updateJson(field, String($event))"
        />

        <Input
          v-else-if="field.fieldType === 'number'"
          :id="`content-field-${field.id}`"
          type="number"
          :model-value="toText(getValue(field))"
          :disabled="disabled"
          @update:model-value="emit('updateValue', field.fieldKey, Number($event), field.id)"
        />

        <VDateTimePicker
          v-else-if="field.fieldType === 'date'"
          :id="`content-field-${field.id}`"
          :model-value="toText(getValue(field)) || null"
          :disabled="disabled"
          :include-time="field.meta?.format === 'datetime'"
          placeholder="Selecciona fecha"
          @update:model-value="emit('updateValue', field.fieldKey, $event, field.id)"
        />

        <Input
          v-else
          :id="`content-field-${field.id}`"
          type="text"
          :model-value="toText(getValue(field))"
          :disabled="disabled"
          :maxlength="field.fieldType === 'text' ? getTextMaxLength(field) : undefined"
          @update:model-value="emit('updateValue', field.fieldKey, String($event), field.id)"
        />

        <FieldError :errors="fieldErrors?.[field.fieldKey] ?? []" />
      </FieldContent>
    </Field>

    <Dialog :open="previewAsset !== null" @update:open="previewAsset = $event ? previewAsset : null">
      <DialogContent class="max-h-[92vh] w-[min(1100px,calc(100vw-2rem))] max-w-none overflow-hidden p-0">
        <DialogHeader class="border-b border-(--app-line) px-4 py-3">
          <DialogTitle class="truncate pr-8 text-[15px]">{{ previewAsset?.originalName || previewAsset?.filename || 'Archivo' }}</DialogTitle>
          <DialogDescription class="flex flex-wrap items-center gap-2 text-[12px]">
            <span>{{ previewAsset?.mimeType || 'Tipo desconocido' }}</span>
            <a
              v-if="previewAssetUrl"
              :href="previewAssetUrl"
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
            v-if="previewAsset && isImageAsset(previewAsset) && previewAssetUrl"
            :src="previewAssetUrl"
            :alt="previewAsset.originalName || previewAsset.filename"
            class="max-h-[calc(92vh-120px)] max-w-full rounded-md object-contain"
          >
          <video
            v-else-if="previewAsset && isVideoAsset(previewAsset) && previewAssetUrl"
            :src="previewAssetUrl"
            class="max-h-[calc(92vh-120px)] w-full max-w-5xl rounded-md bg-black"
            controls
          />
          <audio
            v-else-if="previewAsset && isAudioAsset(previewAsset) && previewAssetUrl"
            :src="previewAssetUrl"
            class="w-full max-w-2xl"
            controls
          />
          <iframe
            v-else-if="previewAsset && isPdfAsset(previewAsset) && previewAssetUrl"
            :src="previewAssetUrl"
            :title="previewAsset.originalName || previewAsset.filename"
            class="h-[calc(92vh-120px)] w-full rounded-md border border-(--app-line) bg-white"
          />
          <div v-else class="grid gap-2 text-center text-[13px] text-(--app-muted)">
            <FileText class="mx-auto" :size="28" />
            <span>No hay previsualización disponible para este archivo.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog :open="pendingRemoval !== null" @update:open="pendingRemoval = $event ? pendingRemoval : null">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar archivo</AlertDialogTitle>
          <AlertDialogDescription>
            Se quitará {{ pendingRemoval?.asset.originalName || pendingRemoval?.asset.filename || 'este archivo' }} del contenido. El cambio se aplicará al guardar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction class="bg-destructive text-white hover:bg-destructive/90" @click="confirmRemoveMediaAsset">
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
