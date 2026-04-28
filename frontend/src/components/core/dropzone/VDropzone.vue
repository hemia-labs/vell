<script setup lang="ts">
import { computed, ref } from 'vue'
import { FileIcon, UploadCloud, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useDropzone, type DropzoneRejectedFile } from './useDropzone'

const props = withDefaults(
  defineProps<{
    accept?: string
    modelValue?: File[]
    allowedTypes?: string[]
    disabled?: boolean
    helperText?: string
    inputId?: string
    maxFiles?: number
    maxSizeBytes?: number
    multiple?: boolean
    showFileList?: boolean
    title?: string
  }>(),
  {
    accept: '',
    modelValue: () => [],
    allowedTypes: () => [],
    disabled: false,
    helperText: '',
    inputId: 'v-dropzone-input',
    multiple: false,
    showFileList: true,
    title: 'Adjuntar archivos'
  }
)

const emit = defineEmits<{
  'update:modelValue': [files: File[]]
  change: [files: File[]]
  reject: [files: DropzoneRejectedFile[]]
}>()

const fileInput = ref<HTMLInputElement | null>(null)

const {
  clearRejectedFiles,
  handleDragEnter,
  handleDragLeave,
  handleDragOver,
  handleDrop,
  isDragging,
  rejectedFiles,
  validateFiles
} = useDropzone(props)

const inputAccept = computed(() => props.accept || acceptFromAllowedTypes.value)
const acceptFromAllowedTypes = computed(() => props.allowedTypes.join(','))

const fileCountText = computed(() => {
  const count = props.modelValue.length

  if (count === 0) {
    return props.multiple ? 'Sin archivos seleccionados' : 'Sin archivo seleccionado'
  }

  return `${count} ${count === 1 ? 'archivo seleccionado' : 'archivos seleccionados'}`
})

const limitText = computed(() => {
  const details = [
    props.allowedTypes.length ? props.allowedTypes.join(', ') : null,
    props.maxSizeBytes ? `Max. ${formatFileSize(props.maxSizeBytes)}` : null,
    props.maxFiles && props.multiple ? `Hasta ${props.maxFiles} archivos` : null
  ].filter(Boolean)

  return details.join(' | ')
})

function openFileDialog() {
  if (props.disabled) {
    return
  }

  fileInput.value?.click()
}

function addFiles(files: File[]) {
  const { acceptedFiles, rejectedFiles: rejected } = validateFiles(files, props.multiple ? props.modelValue : [])
  const nextFiles = props.multiple ? [...props.modelValue, ...acceptedFiles] : acceptedFiles

  if (acceptedFiles.length > 0) {
    emit('update:modelValue', nextFiles)
    emit('change', nextFiles)
  }

  if (rejected.length > 0) {
    emit('reject', rejected)
  }
}

function onInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  addFiles(Array.from(input.files ?? []))
  input.value = ''
}

function onDrop(event: DragEvent) {
  const result = handleDrop(event, props.multiple ? props.modelValue : [])

  if (!result) {
    return
  }

  const nextFiles = props.multiple ? [...props.modelValue, ...result.acceptedFiles] : result.acceptedFiles

  if (result.acceptedFiles.length > 0) {
    emit('update:modelValue', nextFiles)
    emit('change', nextFiles)
  }

  if (result.rejectedFiles.length > 0) {
    emit('reject', result.rejectedFiles)
  }
}

function removeFile(index: number) {
  const nextFiles = props.modelValue.filter((_, fileIndex) => fileIndex !== index)
  emit('update:modelValue', nextFiles)
  emit('change', nextFiles)
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
  <div class="grid gap-2">
    <div
      class="group grid min-h-36 cursor-pointer place-items-center rounded-lg border border-dashed border-(--app-line) bg-(--app-surface) p-5 text-center transition hover:border-(--app-accent) hover:bg-(--app-surface-2) data-[dragging=true]:border-(--app-accent) data-[dragging=true]:bg-(--app-surface-2) data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60"
      :data-disabled="disabled"
      :data-dragging="isDragging"
      :aria-disabled="disabled"
      role="button"
      :tabindex="disabled ? -1 : 0"
      @click="openFileDialog"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @drop="onDrop"
      @keydown.enter.prevent="openFileDialog"
      @keydown.space.prevent="openFileDialog"
    >
      <input
        :id="inputId"
        ref="fileInput"
        class="sr-only"
        type="file"
        :accept="inputAccept"
        :disabled="disabled"
        :multiple="multiple"
        @change="onInputChange"
      >

      <div class="grid max-w-md justify-items-center gap-2">
        <div class="grid size-11 place-items-center rounded-full border border-(--app-line) bg-(--app-bg) text-(--app-muted) transition group-hover:text-(--app-ink)">
          <UploadCloud :size="20" />
        </div>
        <div class="grid gap-1">
          <p class="m-0 text-[13px] font-semibold text-(--app-ink)">{{ title }}</p>
          <p class="m-0 text-[12.5px] text-(--app-muted)">
            <slot name="description">
              Arrastra archivos aqui o haz clic para seleccionar.
            </slot>
          </p>
        </div>
        <p v-if="helperText || limitText" class="m-0 text-[11.5px] text-(--app-muted)">
          {{ helperText || limitText }}
        </p>
      </div>
    </div>

    <div v-if="showFileList" class="grid gap-2">
      <div class="flex items-center justify-between gap-3 text-[12px] text-(--app-muted)">
        <span>{{ fileCountText }}</span>
        <button
          v-if="rejectedFiles.length"
          class="text-(--app-ink) underline-offset-2 hover:underline"
          type="button"
          @click="clearRejectedFiles"
        >
          Limpiar errores
        </button>
      </div>

      <ul v-if="modelValue.length" class="grid gap-1.5">
        <li
          v-for="(file, index) in modelValue"
          :key="`${file.name}-${file.size}-${file.lastModified}`"
          class="flex min-h-11 items-center justify-between gap-3 rounded-md border border-(--app-line) bg-(--app-bg) px-3 py-2"
        >
          <div class="flex min-w-0 items-center gap-2">
            <FileIcon class="shrink-0 text-(--app-muted)" :size="15" />
            <div class="min-w-0">
              <p class="m-0 truncate text-[12.5px] font-medium text-(--app-ink)">{{ file.name }}</p>
              <p class="m-0 text-[11.5px] text-(--app-muted)">{{ formatFileSize(file.size) }}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            class="shrink-0"
            :disabled="disabled"
            aria-label="Quitar archivo"
            @click.stop="removeFile(index)"
          >
            <X :size="14" />
          </Button>
        </li>
      </ul>

      <ul v-if="rejectedFiles.length" class="grid gap-1 text-[12px] text-red-600">
        <li v-for="rejectedFile in rejectedFiles" :key="`${rejectedFile.file.name}-${rejectedFile.reason}`">
          {{ rejectedFile.file.name }}: {{ rejectedFile.message }}
        </li>
      </ul>
    </div>
  </div>
</template>
