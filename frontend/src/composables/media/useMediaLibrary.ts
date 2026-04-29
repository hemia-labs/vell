import { computed, ref } from 'vue'
import useVuelidate from '@vuelidate/core'
import { helpers, maxLength, required } from '@vuelidate/validators'
import type {
  FilterMediaParams,
  Media,
  MediaReferences,
  UpdateMedia,
} from '@/domain/models/media.model'
import FileUploadService from '@/services/media/file-upload.service'
import MediaLibraryService from '@/services/media/media-library.service'

const mediaLibraryService = new MediaLibraryService()
const fileUploadService = new FileUploadService()

const createInitialForm = (): UpdateMedia => ({
  originalName: ''
})

const rules = {
  originalName: {
    required: helpers.withMessage('El nombre es requerido', required),
    maxLength: helpers.withMessage('Máximo 255 caracteres', maxLength(255))
  }
}

export function useMediaLibrary() {
  const media = ref<Media[]>([])
  const form = ref<UpdateMedia>(createInitialForm())
  const currentMedia = ref<Media | null>(null)
  const currentReferences = ref<MediaReferences | null>(null)
  const previewUrl = ref('')
  const isLoading = ref(false)
  const errorMessage = ref('')
  const v$ = useVuelidate(rules, form)
  const isFormValid = computed(() => !v$.value.$invalid)

  async function runAction<T>(message: string, action: () => Promise<T>): Promise<T | null> {
    isLoading.value = true
    errorMessage.value = ''

    try {
      return await action()
    } catch {
      errorMessage.value = message
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function loadMedia(params?: FilterMediaParams | Event) {
    return runAction('No se pudo cargar la librería de media.', async () => {
      media.value = await mediaLibraryService.findAll(params instanceof Event ? undefined : params)
      return media.value
    })
  }

  async function loadMediaById(id: string) {
    return runAction('No se pudo cargar el archivo.', async () => {
      currentMedia.value = await mediaLibraryService.findById(id)
      form.value = {
        originalName: currentMedia.value.originalName
      }
      v$.value.$reset()
      return currentMedia.value
    })
  }

  async function loadPreviewUrl(id: string) {
    return runAction('No se pudo cargar la URL de previsualización.', async () => {
      previewUrl.value = await mediaLibraryService.getPreviewUrl(id)
      return previewUrl.value
    })
  }

  async function loadMediaReferences(id: string) {
    return runAction('No se pudieron cargar las referencias del archivo.', async () => {
      currentReferences.value = await mediaLibraryService.getReferences(id)
      return currentReferences.value
    })
  }

  async function updateMedia(id: string, payload: UpdateMedia) {
    return runAction('No se pudo actualizar el archivo.', async () => {
      const item = await mediaLibraryService.update(id, toPayload(payload))
      media.value = media.value.map((current) => current.id === item.id ? item : current)
      currentMedia.value = item
      return item
    })
  }

  async function deleteMedia(id: string, mode?: 'hard') {
    return runAction('No se pudo eliminar el archivo.', async () => {
      await mediaLibraryService.delete(id, mode)
      media.value = media.value.filter((item) => item.id !== id)
      if (currentMedia.value?.id === id) {
        currentMedia.value = null
      }
      return true
    })
  }

  async function restoreMedia(id: string) {
    return runAction('No se pudo restaurar el archivo.', async () => {
      await mediaLibraryService.restore(id)
      media.value = media.value.filter((item) => item.id !== id)
      if (currentMedia.value?.id === id) {
        currentMedia.value = null
      }
      return true
    })
  }

  async function uploadMedia(files: File[]) {
    return runAction('No se pudieron subir los archivos.', async () => {
      const uploaded = await fileUploadService.uploadBatch(files, 'library')
      media.value = [...uploaded, ...media.value]
      return uploaded
    })
  }

  async function submitUpdateMedia(id: string) {
    errorMessage.value = ''

    if (!await v$.value.$validate()) {
      return null
    }

    return updateMedia(id, form.value)
  }

  function resetForm() {
    form.value = createInitialForm()
    currentMedia.value = null
    currentReferences.value = null
    previewUrl.value = ''
    v$.value.$reset()
    errorMessage.value = ''
  }

  function toPayload(source: UpdateMedia): UpdateMedia {
    return {
      originalName: source.originalName?.trim()
    }
  }

  return {
    media,
    form,
    currentMedia,
    currentReferences,
    previewUrl,
    v$,
    isLoading,
    errorMessage,
    isFormValid,
    loadMedia,
    loadMediaById,
    loadPreviewUrl,
    loadMediaReferences,
    updateMedia,
    deleteMedia,
    restoreMedia,
    uploadMedia,
    submitUpdateMedia,
    resetForm
  }
}
