import { computed, ref } from 'vue'

export type DropzoneRejectedReason = 'type' | 'size' | 'max-files' | 'disabled'

export interface DropzoneRejectedFile {
  file: File
  reason: DropzoneRejectedReason
  message: string
}

export interface DropzoneOptions {
  allowedTypes?: string[]
  disabled?: boolean
  maxFiles?: number
  maxSizeBytes?: number
  multiple?: boolean
}

export function useDropzone(options: DropzoneOptions) {
  const isDragging = ref(false)
  const rejectedFiles = ref<DropzoneRejectedFile[]>([])

  const accept = computed(() => options.allowedTypes?.join(',') ?? '')

  function validateFiles(incomingFiles: File[], currentFiles: File[] = []) {
    const acceptedFiles: File[] = []
    const rejected: DropzoneRejectedFile[] = []

    if (options.disabled) {
      rejected.push(...incomingFiles.map((file) => rejectFile(file, 'disabled', 'Carga deshabilitada.')))
      rejectedFiles.value = rejected
      return { acceptedFiles, rejectedFiles: rejected }
    }

    const files = options.multiple ? incomingFiles : incomingFiles.slice(0, 1)
    const maxFiles = options.multiple ? options.maxFiles : 1
    const availableSlots = maxFiles ? Math.max(maxFiles - currentFiles.length, 0) : files.length

    files.forEach((file, index) => {
      if (index >= availableSlots) {
        rejected.push(rejectFile(file, 'max-files', 'Limite de archivos alcanzado.'))
        return
      }

      if (!isAllowedType(file)) {
        rejected.push(rejectFile(file, 'type', 'Tipo de archivo no permitido.'))
        return
      }

      if (options.maxSizeBytes && file.size > options.maxSizeBytes) {
        rejected.push(rejectFile(file, 'size', 'Archivo supera el tamano maximo.'))
        return
      }

      acceptedFiles.push(file)
    })

    rejectedFiles.value = rejected
    return { acceptedFiles, rejectedFiles: rejected }
  }

  function clearRejectedFiles() {
    rejectedFiles.value = []
  }

  function handleDragEnter(event: DragEvent) {
    if (options.disabled) {
      return
    }

    event.preventDefault()
    isDragging.value = true
  }

  function handleDragOver(event: DragEvent) {
    if (options.disabled) {
      return
    }

    event.preventDefault()
  }

  function handleDragLeave(event: DragEvent) {
    if (options.disabled || event.currentTarget === event.relatedTarget) {
      return
    }

    isDragging.value = false
  }

  function handleDrop(event: DragEvent, currentFiles: File[] = []) {
    event.preventDefault()
    isDragging.value = false

    const files = Array.from(event.dataTransfer?.files ?? [])
    return validateFiles(files, currentFiles)
  }

  function isAllowedType(file: File) {
    if (!options.allowedTypes?.length) {
      return true
    }

    const fileName = file.name.toLowerCase()

    return options.allowedTypes.some((allowedType) => {
      const type = allowedType.trim().toLowerCase()

      if (!type) {
        return false
      }

      if (type.startsWith('.')) {
        return fileName.endsWith(type)
      }

      if (type.endsWith('/*')) {
        return file.type.toLowerCase().startsWith(type.slice(0, -1))
      }

      return file.type.toLowerCase() === type
    })
  }

  return {
    accept,
    clearRejectedFiles,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    isDragging,
    rejectedFiles,
    validateFiles
  }
}

function rejectFile(file: File, reason: DropzoneRejectedReason, message: string): DropzoneRejectedFile {
  return { file, reason, message }
}
