import { computed, ref } from 'vue'
import useVuelidate from '@vuelidate/core'
import { helpers, maxLength, required } from '@vuelidate/validators'
import type {
  Content,
  ContentFieldValueInput,
  ContentMediaInput,
  ContentMediaRole,
  ContentStatus,
  ContentVersion,
  CreateContent,
  FilterContentParams,
  JsonObject,
  UpdateContent,
} from '@/domain/models/content.model'
import type { ContentTypeField } from '@/domain/models/content-type.model'
import type { Media } from '@/domain/models/media.model'
import ContentService from '@/services/contents/content.service'
import FileUploadService from '@/services/media/file-upload.service'

const contentService = new ContentService()
const fileUploadService = new FileUploadService()

export const CONTENT_STATUSES: ContentStatus[] = ['draft', 'published', 'archived']
export const CONTENT_MEDIA_ROLES: ContentMediaRole[] = ['hero', 'gallery', 'attachment', 'inline', 'og_image']

type ContentForm = {
  title: string
  slug: string
  contentTypeId: string
  categoryId: string | null
  body: JsonObject | null
  seo: JsonObject
  config: JsonObject
  excerpt: string
  status: ContentStatus
  coverImageId: string | null
  metaTitle: string
  metaDescription: string
  publishedAt: string | null
  tagIds: string[]
  fieldValues: ContentFieldValueInput[]
  mediaItems: ContentMediaInput[]
}

const createInitialForm = (): ContentForm => ({
  title: '',
  slug: '',
  contentTypeId: '',
  categoryId: null,
  body: null,
  seo: {},
  config: {},
  excerpt: '',
  status: 'draft',
  coverImageId: null,
  metaTitle: '',
  metaDescription: '',
  publishedAt: null,
  tagIds: [],
  fieldValues: [],
  mediaItems: []
})

export function useContents() {
  const contents = ref<Content[]>([])
  const versions = ref<ContentVersion[]>([])
  const form = ref<ContentForm>(createInitialForm())
  const currentContent = ref<Content | null>(null)
  const dynamicValidationFields = ref<ContentTypeField[]>([])
  const isLoading = ref(false)
  const errorMessage = ref('')
  const rules = computed(() => ({
    title: {
      required: helpers.withMessage('El título es requerido', required),
      maxLength: helpers.withMessage('Máximo 255 caracteres', maxLength(255))
    },
    slug: {
      required: helpers.withMessage('El slug es requerido', required),
      maxLength: helpers.withMessage('Máximo 255 caracteres', maxLength(255))
    },
    contentTypeId: {
      required: helpers.withMessage('El tipo de contenido es requerido', required)
    },
    metaTitle: {
      maxLength: helpers.withMessage('Máximo 255 caracteres', maxLength(255))
    },
    metaDescription: {
      maxLength: helpers.withMessage('Máximo 170 caracteres', maxLength(170))
    },
    fieldValues: {
      dynamicFields: helpers.withMessage('Revisa los campos dinámicos', validateDynamicFields)
    }
  }))
  const v$ = useVuelidate(rules, form)
  const isFormValid = computed(() => !v$.value.$invalid)

  function validateDynamicFields(values: ContentFieldValueInput[] = []) {
    return dynamicValidationFields.value.every(field => getDynamicFieldValidationErrors(field, values).length === 0)
  }

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

  async function loadContents(params?: FilterContentParams | Event) {
    return runAction('No se pudieron cargar los contenidos.', async () => {
      contents.value = await contentService.findAll(params instanceof Event ? undefined : params)
      return contents.value
    })
  }

  async function loadContentById(id: string) {
    return runAction('No se pudo cargar el contenido.', async () => {
      currentContent.value = await contentService.findById(id)
      fillForm(currentContent.value)
      return currentContent.value
    })
  }

  async function loadContentBySlug(contentTypeId: string, slug: string) {
    return runAction('No se pudo cargar el contenido.', async () => {
      currentContent.value = await contentService.findBySlug(contentTypeId, slug)
      fillForm(currentContent.value)
      return currentContent.value
    })
  }

  async function loadContentVersions(id: string) {
    return runAction('No se pudieron cargar las versiones del contenido.', async () => {
      versions.value = await contentService.findVersions(id)
      return versions.value
    })
  }

  async function createContent(payload: CreateContent) {
    return runAction('No se pudo crear el contenido.', async () => {
      const content = await contentService.create(payload)
      contents.value = [content, ...contents.value]
      return content
    })
  }

  async function updateContent(id: string, payload: UpdateContent) {
    return runAction('No se pudo actualizar el contenido.', async () => {
      const content = await contentService.update(id, payload)
      contents.value = contents.value.map((current) => current.id === content.id ? content : current)
      currentContent.value = content
      return content
    })
  }

  async function publishContent(id: string) {
    return runAction('No se pudo publicar el contenido.', async () => {
      const content = await contentService.publish(id)
      contents.value = contents.value.map((current) => current.id === content.id ? content : current)
      currentContent.value = content
      fillForm(content)
      return content
    })
  }

  async function restoreContentVersion(id: string, version: number) {
    return runAction('No se pudo restaurar la versión del contenido.', async () => {
      const content = await contentService.restoreVersion(id, version)
      contents.value = contents.value.map((current) => current.id === content.id ? content : current)
      currentContent.value = content
      fillForm(content)
      return content
    })
  }

  async function deleteContent(id: string) {
    return runAction('No se pudo eliminar el contenido.', async () => {
      await contentService.delete(id)
      contents.value = contents.value.filter((content) => content.id !== id)
      return true
    })
  }

  async function restoreContent(id: string) {
    return runAction('No se pudo restaurar el contenido.', async () => {
      await contentService.restore(id)
      return true
    })
  }

  async function submitCreateContent() {
    errorMessage.value = ''

    if (!await v$.value.$validate()) {
      return null
    }

    return runAction('No se pudo crear el contenido.', async () => {
      const uploadedMedia: Media[] = []

      try {
        const payload = await toUploadResolvedPayload(form.value, uploadedMedia)
        const content = await contentService.create(payload)
        contents.value = [content, ...contents.value]
        return content
      } catch (error) {
        await cleanupUploadedMedia(uploadedMedia)
        throw error
      }
    })
  }

  async function submitUpdateContent(id: string) {
    errorMessage.value = ''

    if (!await v$.value.$validate()) {
      return null
    }

    return runAction('No se pudo actualizar el contenido.', async () => {
      const uploadedMedia: Media[] = []

      try {
        const payload = await toUploadResolvedPayload(form.value, uploadedMedia)
        const content = await contentService.update(id, payload)
        contents.value = contents.value.map((current) => current.id === content.id ? content : current)
        currentContent.value = content
        return content
      } catch (error) {
        await cleanupUploadedMedia(uploadedMedia)
        throw error
      }
    })
  }

  function setFieldValue(fieldKey: string, value: unknown, fieldId?: string) {
    const values = [...(form.value.fieldValues ?? [])]
    const index = values.findIndex((item) => item.fieldKey === fieldKey || (fieldId && item.fieldId === fieldId))
    const currentValue = index >= 0 ? values[index] : null
    const nextValue: ContentFieldValueInput = {
      fieldKey,
      fieldId,
      value,
      mediaAssets: currentValue?.mediaAssets?.filter(asset => getMediaIdsFromValue(value).includes(asset.id))
    }

    if (index >= 0) {
      values[index] = nextValue
    } else {
      values.push(nextValue)
    }

    form.value.fieldValues = values
    v$.value.fieldValues?.$touch()
  }

  function setDynamicValidationFields(fields: ContentTypeField[] = []) {
    dynamicValidationFields.value = [...fields]
    applyDynamicFieldDefaults(fields)
  }

  function getDynamicFieldErrors(field: ContentTypeField): string[] {
    if (!v$.value.fieldValues?.$dirty) {
      return []
    }

    return getDynamicFieldValidationErrors(field, form.value.fieldValues)
  }

  function setTagIds(tagIds: string[]) {
    form.value.tagIds = [...new Set(tagIds)]
  }

  function addMediaItem(fileOrMediaId: File | string, metaOrRole: JsonObject | ContentMediaRole = 'gallery', maybeMeta: JsonObject = {}) {
    const mediaItems = [...(form.value.mediaItems ?? [])]
    const isFile = fileOrMediaId instanceof File
    const role = typeof metaOrRole === 'string' ? metaOrRole : 'gallery'
    const meta = typeof metaOrRole === 'string' ? maybeMeta : metaOrRole
    mediaItems.push({
      mediaId: isFile ? undefined : fileOrMediaId,
      file: isFile ? fileOrMediaId : undefined,
      role,
      order: mediaItems.length,
      meta
    })
    form.value.mediaItems = mediaItems
  }

  function updateMediaItem(index: number, payload: Partial<ContentMediaInput>) {
    const mediaItems = [...(form.value.mediaItems ?? [])]
    const mediaItem = mediaItems[index]

    if (!mediaItem) {
      return
    }

    mediaItems[index] = { ...mediaItem, ...payload }
    form.value.mediaItems = mediaItems
  }

  function removeMediaItem(index: number) {
    form.value.mediaItems = (form.value.mediaItems ?? [])
      .filter((_, currentIndex) => currentIndex !== index)
      .map((mediaItem, currentIndex) => ({ ...mediaItem, order: currentIndex }))
  }

  function resetForm() {
    form.value = createInitialForm()
    currentContent.value = null
    dynamicValidationFields.value = []
    v$.value.$reset()
    errorMessage.value = ''
  }

  function fillForm(content: Content) {
    form.value = {
      title: content.title,
      slug: content.slug,
      contentTypeId: content.contentTypeId,
      categoryId: content.categoryId,
      body: content.body,
      seo: content.seo ?? {},
      config: content.config ?? {},
      excerpt: content.excerpt ?? '',
      status: content.status,
      coverImageId: content.coverImageId,
      metaTitle: content.metaTitle ?? '',
      metaDescription: content.metaDescription ?? '',
      publishedAt: content.publishedAt,
      tagIds: content.tagIds ?? [],
      fieldValues: (content.fieldValues ?? []).map(fieldValue => ({
        fieldId: fieldValue.fieldId,
        fieldKey: fieldValue.fieldKey,
        value: fieldValue.value,
        mediaAssets: fieldValue.mediaAssets
      })),
      mediaItems: (content.mediaItems ?? []).map(mediaItem => ({
        mediaId: mediaItem.mediaId,
        role: mediaItem.role,
        order: mediaItem.order,
        meta: {
          ...(mediaItem.meta ?? {}),
          originalName: mediaItem.media?.originalName ?? mediaItem.meta?.originalName,
          mimeType: mediaItem.media?.mimeType ?? mediaItem.meta?.mimeType,
          size: mediaItem.media?.size ?? mediaItem.meta?.size,
          url: mediaItem.media?.url ?? mediaItem.meta?.url,
          previewUrl: mediaItem.media?.previewUrl ?? mediaItem.meta?.previewUrl
        }
      }))
    }
    v$.value.$reset()
  }

  function toPayload(source: ContentForm): CreateContent {
    const fieldValues = applyDynamicFieldMetaValues(source.fieldValues ?? [])

    return {
      title: source.title.trim(),
      slug: source.slug.trim(),
      contentTypeId: source.contentTypeId,
      categoryId: source.categoryId || null,
      body: source.body ?? null,
      seo: source.seo ?? {},
      config: source.config ?? {},
      excerpt: source.excerpt?.trim() || null,
      status: source.status ?? 'draft',
      coverImageId: source.coverImageId || null,
      metaTitle: source.metaTitle?.trim() || null,
      metaDescription: source.metaDescription?.trim() || null,
      publishedAt: source.publishedAt || null,
      tagIds: source.tagIds ?? [],
      fieldValues,
      mediaItems: (source.mediaItems ?? [])
        .filter((mediaItem) => Boolean(mediaItem.mediaId))
        .map((mediaItem, index) => ({
          mediaId: String(mediaItem.mediaId),
          role: mediaItem.role ?? 'gallery',
          order: mediaItem.order ?? index,
          meta: mediaItem.meta ?? {}
        }))
    }
  }

  async function toUploadResolvedPayload(source: ContentForm, uploadedMedia: Media[]): Promise<CreateContent> {
    const files = collectPendingFiles(source)
    const uploadedByFile = new Map<File, Media>()

    if (files.length > 0) {
      const media = await fileUploadService.uploadBatch(files, 'contents')
      media.forEach((item, index) => {
        uploadedByFile.set(files[index], item)
        uploadedMedia.push(item)
      })
    }

    const payload = toPayload(source)
    payload.fieldValues = resolveFieldValues(payload.fieldValues ?? [], uploadedByFile)
    payload.mediaItems = resolveMediaItems(source.mediaItems ?? [], uploadedByFile)
    return payload
  }

  function collectPendingFiles(source: ContentForm): File[] {
    const files: File[] = []
    const seen = new Set<File>()
    const add = (file: File) => {
      if (!seen.has(file)) {
        seen.add(file)
        files.push(file)
      }
    }

    for (const fieldValue of source.fieldValues ?? []) {
      if (fieldValue.value instanceof File) add(fieldValue.value)
      if (Array.isArray(fieldValue.value)) {
        fieldValue.value.forEach((item) => {
          if (item instanceof File) add(item)
        })
      }
    }

    for (const mediaItem of source.mediaItems ?? []) {
      if (mediaItem.file instanceof File) add(mediaItem.file)
    }

    return files
  }

  function resolveFieldValues(values: ContentFieldValueInput[], uploadedByFile: Map<File, Media>): ContentFieldValueInput[] {
    return values.map((item) => ({
      fieldId: item.fieldId,
      fieldKey: item.fieldKey,
      value: resolveFieldValue(item.value, uploadedByFile)
    }))
  }

  function resolveFieldValue(value: unknown, uploadedByFile: Map<File, Media>): unknown {
    if (value instanceof File) {
      return uploadedByFile.get(value)?.id ?? value
    }

    if (Array.isArray(value)) {
      return value.map((item) => item instanceof File ? uploadedByFile.get(item)?.id ?? item : item)
    }

    return value
  }

  function resolveMediaItems(mediaItems: ContentMediaInput[], uploadedByFile: Map<File, Media>): ContentMediaInput[] {
    return mediaItems
      .flatMap((mediaItem, index) => {
        const mediaId = mediaItem.mediaId ?? (mediaItem.file ? uploadedByFile.get(mediaItem.file)?.id : undefined)
        if (!mediaId) {
          return []
        }

        return {
          mediaId,
          role: mediaItem.role ?? 'gallery',
          order: mediaItem.order ?? index,
          meta: mediaItem.meta ?? {}
        }
      })
  }

  async function cleanupUploadedMedia(uploadedMedia: Media[]): Promise<void> {
    await Promise.allSettled(uploadedMedia.map((media) => fileUploadService.delete(media.id)))
  }

  function toUpdatePayload(source: ContentForm): UpdateContent {
    return toPayload(source)
  }

  function getMediaIdsFromValue(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string')
    }

    return typeof value === 'string' ? [value] : []
  }

  function getFieldValue(values: ContentFieldValueInput[], field: ContentTypeField) {
    return values.find((item) => item.fieldId === field.id || item.fieldKey === field.fieldKey)?.value
  }

  function setDefaultFieldValue(field: ContentTypeField, value: unknown) {
    if (isEmptyDynamicFieldValue(value)) {
      return
    }

    const values = [...(form.value.fieldValues ?? [])]
    const exists = values.some(item => item.fieldId === field.id || item.fieldKey === field.fieldKey)

    if (!exists) {
      values.push({ fieldId: field.id, fieldKey: field.fieldKey, value })
      form.value.fieldValues = values
    }
  }

  function applyDynamicFieldDefaults(fields: ContentTypeField[]) {
    fields.forEach((field) => {
      const value = getMetaDefaultValue(field, false)
      if (value !== undefined) {
        setDefaultFieldValue(field, value)
      }
    })
  }

  function applyDynamicFieldMetaValues(values: ContentFieldValueInput[]): ContentFieldValueInput[] {
    const nextValues = [...values]

    dynamicValidationFields.value.forEach((field) => {
      const index = nextValues.findIndex(item => item.fieldId === field.id || item.fieldKey === field.fieldKey)
      const current = index >= 0 ? nextValues[index] : null
      const metaValue = getMetaDefaultValue(field, true)

      if (metaValue === undefined && (!current || !isEmptyDynamicFieldValue(current.value))) {
        return
      }

      if (current && metaValue === undefined) {
        return
      }

      const value = metaValue ?? current?.value
      if (isEmptyDynamicFieldValue(value)) {
        return
      }

      const nextValue = {
        fieldId: field.id,
        fieldKey: field.fieldKey,
        value,
        mediaAssets: current?.mediaAssets
      }

      if (index >= 0) {
        nextValues[index] = nextValue
      } else {
        nextValues.push(nextValue)
      }
    })

    return nextValues
  }

  function getMetaDefaultValue(field: ContentTypeField, includeAutoUpdate: boolean): unknown {
    if (field.fieldType === 'date' && (field.meta?.autoNow === true || (includeAutoUpdate && field.meta?.autoOnUpdate === true))) {
      return new Date().toISOString()
    }

    return field.meta?.defaultValue
  }

  function getDynamicFieldValidationErrors(field: ContentTypeField, values: ContentFieldValueInput[] = []): string[] {
    const errors: string[] = []
    const value = getFieldValue(values, field)

    if (field.isRequired && isEmptyDynamicFieldValue(value)) {
      errors.push(`${field.name} es requerido`)
      return errors
    }

    if (isEmptyDynamicFieldValue(value)) {
      return errors
    }

    if (isTextField(field) && typeof value === 'string') {
      const minLength = getNumberMeta(field, 'minLength')
      const maxLength = getNumberMeta(field, 'maxLength')
      if (minLength !== undefined && value.length < minLength) errors.push(`${field.name} debe tener mínimo ${minLength} caracteres`)
      if (maxLength !== undefined && value.length > maxLength) errors.push(`${field.name} debe tener máximo ${maxLength} caracteres`)
    }

    if (field.fieldType === 'number' && typeof value === 'number') {
      const min = getNumberMeta(field, 'min')
      const max = getNumberMeta(field, 'max')
      if (min !== undefined && value < min) errors.push(`${field.name} debe ser mayor o igual a ${min}`)
      if (max !== undefined && value > max) errors.push(`${field.name} debe ser menor o igual a ${max}`)
    }

    if (field.fieldType === 'select') {
      const options = getSelectOptionValues(field)
      if (options.length > 0 && typeof value === 'string' && !options.includes(value)) {
        errors.push(`${field.name} debe usar una opción válida`)
      }
    }

    if (field.fieldType === 'image' || field.fieldType === 'file') {
      errors.push(...getFileErrors(field, value))
    }

    return errors
  }

  function isTextField(field: ContentTypeField) {
    return field.fieldType === 'text' || field.fieldType === 'textarea' || field.fieldType === 'richtext'
  }

  function getNumberMeta(field: ContentTypeField, key: string): number | undefined {
    const value = field.meta?.[key]
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined
  }

  function getSelectOptionValues(field: ContentTypeField): string[] {
    const options = field.meta?.options
    if (!Array.isArray(options)) return []

    return options.flatMap((option) => {
      if (typeof option === 'string') return [option]
      if (!option || typeof option !== 'object') return []
      const record = option as Record<string, unknown>
      const value = record.value ?? record.text ?? record.label
      return typeof value === 'string' && value ? [value] : []
    })
  }

  function getFileErrors(field: ContentTypeField, value: unknown): string[] {
    const files = Array.isArray(value) ? value.filter((item): item is File => item instanceof File) : value instanceof File ? [value] : []
    if (files.length === 0) return []

    const errors: string[] = []
    const maxSize = getNumberMeta(field, 'maxSizeBytes') ?? getNumberMeta(field, 'maxSize')
    const maxFiles = getNumberMeta(field, 'maxFiles')
    const allowedTypes = Array.isArray(field.meta?.allowedTypes)
      ? field.meta.allowedTypes.filter((item): item is string => typeof item === 'string')
      : []

    if (maxFiles !== undefined && files.length > maxFiles) errors.push(`${field.name} permite máximo ${maxFiles} archivos`)
    if (maxSize !== undefined && files.some(file => file.size > maxSize)) errors.push(`${field.name} excede el tamaño máximo`)
    if (allowedTypes.length > 0 && files.some(file => !allowedTypes.includes(file.type))) errors.push(`${field.name} tiene un tipo de archivo no permitido`)

    return errors
  }

  function isEmptyDynamicFieldValue(value: unknown): boolean {
    if (value === undefined || value === null) return true
    if (typeof value === 'string' && value.trim() === '') return true
    if (Array.isArray(value) && value.length === 0) return true
    return false
  }

  return {
    CONTENT_STATUSES,
    CONTENT_MEDIA_ROLES,
    contents,
    versions,
    form,
    currentContent,
    v$,
    isLoading,
    errorMessage,
    isFormValid,
    loadContents,
    loadContentById,
    loadContentBySlug,
    loadContentVersions,
    createContent,
    updateContent,
    publishContent,
    restoreContentVersion,
    deleteContent,
    restoreContent,
    submitCreateContent,
    submitUpdateContent,
    setFieldValue,
    setDynamicValidationFields,
    getDynamicFieldErrors,
    setTagIds,
    addMediaItem,
    updateMediaItem,
    removeMediaItem,
    resetForm
  }
}
