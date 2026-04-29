import { computed, ref } from 'vue'
import useVuelidate from '@vuelidate/core'
import { helpers, maxLength, required } from '@vuelidate/validators'
import type {
  ContentType,
  ContentTypeVersion,
  CreateContentType,
  CreateContentTypeField,
  FieldType,
  FilterContentTypeParams,
  UpdateContentType,
} from '@/domain/models/content-type.model'
import ContentTypeService from '@/services/content-types/content-type.service'

const contentTypeService = new ContentTypeService()

export const FIELD_TYPES: FieldType[] = ['text', 'textarea', 'number', 'boolean', 'date', 'image', 'file', 'select', 'relation', 'json', 'richtext']

const createInitialField = (order = 0): CreateContentTypeField => ({
  name: '',
  fieldKey: '',
  fieldType: 'text',
  isRequired: false,
  multiple: false,
  meta: {},
  order
})

const createInitialForm = (): CreateContentType => ({
  name: '',
  slug: '',
  description: '',
  fields: []
})

const rules = {
  name: {
    required: helpers.withMessage('El nombre es requerido', required),
    maxLength: helpers.withMessage('Máximo 100 caracteres', maxLength(100))
  },
  slug: {
    required: helpers.withMessage('El slug es requerido', required),
    maxLength: helpers.withMessage('Máximo 100 caracteres', maxLength(100))
  },
  description: {},
  fields: {
    $each: helpers.forEach({
      name: {
        required: helpers.withMessage('El nombre del campo es requerido', required),
        maxLength: helpers.withMessage('Máximo 100 caracteres', maxLength(100))
      },
      fieldKey: {
        required: helpers.withMessage('El fieldKey es requerido', required),
        maxLength: helpers.withMessage('Máximo 100 caracteres', maxLength(100))
      },
      fieldType: {
        required: helpers.withMessage('El tipo de campo es requerido', required)
      },
      isRequired: {},
      meta: {},
      order: {}
    })
  }
}

export function useContentTypes() {
  const contentTypes = ref<ContentType[]>([])
  const versions = ref<ContentTypeVersion[]>([])
  const form = ref<CreateContentType>(createInitialForm())
  const currentContentType = ref<ContentType | null>(null)
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

  async function loadContentTypes(params?: FilterContentTypeParams | Event) {
    return runAction('No se pudieron cargar los tipos de contenido.', async () => {
      contentTypes.value = await contentTypeService.findAll(params instanceof Event ? undefined : params)
      return contentTypes.value
    })
  }

  async function loadContentTypeById(id: string) {
    return runAction('No se pudo cargar el tipo de contenido.', async () => {
      currentContentType.value = await contentTypeService.findById(id)
      fillForm(currentContentType.value)
      return currentContentType.value
    })
  }

  async function loadContentTypeBySlug(slug: string) {
    return runAction('No se pudo cargar el tipo de contenido.', async () => {
      currentContentType.value = await contentTypeService.findBySlug(slug)
      fillForm(currentContentType.value)
      return currentContentType.value
    })
  }

  async function loadContentTypeVersions(id: string) {
    return runAction('No se pudieron cargar las versiones del tipo de contenido.', async () => {
      versions.value = await contentTypeService.findVersions(id)
      return versions.value
    })
  }

  async function createContentType(payload: CreateContentType) {
    return runAction('No se pudo crear el tipo de contenido.', async () => {
      const contentType = await contentTypeService.create(payload)
      contentTypes.value = [contentType, ...contentTypes.value]
      return contentType
    })
  }

  async function updateContentType(id: string, payload: UpdateContentType) {
    return runAction('No se pudo actualizar el tipo de contenido.', async () => {
      const contentType = await contentTypeService.update(id, payload)
      contentTypes.value = contentTypes.value.map((current) => current.id === contentType.id ? contentType : current)
      return contentType
    })
  }

  async function deleteContentType(id: string) {
    return runAction('No se pudo eliminar el tipo de contenido.', async () => {
      await contentTypeService.delete(id)
      contentTypes.value = contentTypes.value.filter((contentType) => contentType.id !== id)
      return true
    })
  }

  async function restoreContentType(id: string) {
    return runAction('No se pudo restaurar el tipo de contenido.', async () => {
      await contentTypeService.restore(id)
      return true
    })
  }

  async function restoreContentTypeVersion(id: string, version: number) {
    return runAction('No se pudo restaurar la versión del tipo de contenido.', async () => {
      const contentType = await contentTypeService.restoreVersion(id, version)
      contentTypes.value = contentTypes.value.map((current) => current.id === contentType.id ? contentType : current)
      return contentType
    })
  }

  async function submitCreateContentType() {
    errorMessage.value = ''

    if (!await v$.value.$validate()) {
      return null
    }

    return createContentType(toPayload(form.value))
  }

  async function submitUpdateContentType(id: string) {
    errorMessage.value = ''

    if (!await v$.value.$validate()) {
      return null
    }

    return updateContentType(id, toUpdatePayload(form.value))
  }

  function addField() {
    const fields = form.value.fields ?? []
    form.value.fields = [...fields, createInitialField(fields.length)]
  }

  function updateField(index: number, payload: Partial<CreateContentTypeField>) {
    const fields = [...(form.value.fields ?? [])]
    const field = fields[index]

    if (!field) {
      return
    }

    fields[index] = { ...field, ...payload }
    form.value.fields = fields
  }

  function removeField(index: number) {
    form.value.fields = (form.value.fields ?? [])
      .filter((_, currentIndex) => currentIndex !== index)
      .map((field, currentIndex) => ({ ...field, order: currentIndex }))
  }

  function moveField(fromIndex: number, toIndex: number) {
    const fields = [...(form.value.fields ?? [])]
    const [field] = fields.splice(fromIndex, 1)

    if (!field) {
      return
    }

    fields.splice(toIndex, 0, field)
    form.value.fields = fields.map((currentField, currentIndex) => ({ ...currentField, order: currentIndex }))
  }

  function resetForm() {
    form.value = createInitialForm()
    currentContentType.value = null
    v$.value.$reset()
    errorMessage.value = ''
  }

  function fillForm(contentType: ContentType) {
    form.value = {
      name: contentType.name,
      slug: contentType.slug,
      description: contentType.description ?? '',
      fields: (contentType.fields ?? []).map(field => ({
        id: field.id,
        name: field.name,
        fieldKey: field.fieldKey,
        fieldType: field.fieldType,
        isRequired: field.isRequired,
        multiple: field.multiple ?? Boolean(field.meta?.multiple),
        meta: field.meta ?? {},
        order: field.order
      }))
    }
    v$.value.$reset()
  }

  function toPayload(source: CreateContentType): CreateContentType {
    return {
      name: source.name.trim(),
      slug: source.slug.trim(),
      description: source.description?.trim() || undefined,
      fields: (source.fields ?? []).map((field, index) => ({
        id: field.id,
        name: field.name.trim(),
        fieldKey: field.fieldKey.trim(),
        fieldType: field.fieldType,
        isRequired: field.isRequired ?? false,
        multiple: field.multiple ?? Boolean(field.meta?.multiple),
        meta: field.meta ?? {},
        order: field.order ?? index
      }))
    }
  }

  function toUpdatePayload(source: CreateContentType): UpdateContentType {
    return {
      name: source.name.trim(),
      slug: source.slug.trim(),
      description: source.description?.trim() || undefined,
      fields: (source.fields ?? []).map((field, index) => ({
        id: field.id,
        name: field.name.trim(),
        fieldKey: field.fieldKey.trim(),
        fieldType: field.fieldType,
        isRequired: field.isRequired ?? false,
        multiple: field.multiple ?? Boolean(field.meta?.multiple),
        meta: field.meta ?? {},
        order: field.order ?? index
      }))
    }
  }

  return {
    FIELD_TYPES,
    contentTypes,
    versions,
    form,
    currentContentType,
    v$,
    isLoading,
    errorMessage,
    isFormValid,
    loadContentTypes,
    loadContentTypeById,
    loadContentTypeBySlug,
    loadContentTypeVersions,
    createContentType,
    updateContentType,
    deleteContentType,
    restoreContentType,
    restoreContentTypeVersion,
    submitCreateContentType,
    submitUpdateContentType,
    addField,
    updateField,
    removeField,
    moveField,
    resetForm
  }
}
