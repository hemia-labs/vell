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
import ContentService from '@/services/contents/content.service'

const contentService = new ContentService()

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

const rules = {
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
  }
}

export function useContents() {
  const contents = ref<Content[]>([])
  const versions = ref<ContentVersion[]>([])
  const form = ref<ContentForm>(createInitialForm())
  const currentContent = ref<Content | null>(null)
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

    return createContent(toPayload(form.value))
  }

  async function submitUpdateContent(id: string) {
    errorMessage.value = ''

    if (!await v$.value.$validate()) {
      return null
    }

    return updateContent(id, toUpdatePayload(form.value))
  }

  function setFieldValue(fieldKey: string, value: unknown, fieldId?: string) {
    const values = [...(form.value.fieldValues ?? [])]
    const index = values.findIndex((item) => item.fieldKey === fieldKey || (fieldId && item.fieldId === fieldId))
    const nextValue: ContentFieldValueInput = { fieldKey, fieldId, value }

    if (index >= 0) {
      values[index] = nextValue
    } else {
      values.push(nextValue)
    }

    form.value.fieldValues = values
  }

  function setTagIds(tagIds: string[]) {
    form.value.tagIds = [...new Set(tagIds)]
  }

  function addMediaItem(mediaId: string, role: ContentMediaRole = 'gallery', meta: JsonObject = {}) {
    const mediaItems = [...(form.value.mediaItems ?? [])]
    mediaItems.push({ mediaId, role, order: mediaItems.length, meta })
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
        value: fieldValue.value
      })),
      mediaItems: (content.mediaItems ?? []).map(mediaItem => ({
        mediaId: mediaItem.mediaId,
        role: mediaItem.role,
        order: mediaItem.order,
        meta: mediaItem.meta ?? {}
      }))
    }
    v$.value.$reset()
  }

  function toPayload(source: ContentForm): CreateContent {
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
      fieldValues: source.fieldValues ?? [],
      mediaItems: (source.mediaItems ?? []).map((mediaItem, index) => ({
        mediaId: mediaItem.mediaId,
        role: mediaItem.role ?? 'gallery',
        order: mediaItem.order ?? index,
        meta: mediaItem.meta ?? {}
      }))
    }
  }

  function toUpdatePayload(source: ContentForm): UpdateContent {
    return toPayload(source)
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
    deleteContent,
    restoreContent,
    submitCreateContent,
    submitUpdateContent,
    setFieldValue,
    setTagIds,
    addMediaItem,
    updateMediaItem,
    removeMediaItem,
    resetForm
  }
}
