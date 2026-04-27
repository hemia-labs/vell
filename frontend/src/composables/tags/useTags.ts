import { computed, ref } from 'vue'
import useVuelidate from '@vuelidate/core'
import { helpers, maxLength, required } from '@vuelidate/validators'
import type { CreateTag, FilterTagParams, Tag, UpdateTag } from '@/domain/models/tag.model'
import TagService from '@/services/tags/tag.service'

const tagService = new TagService()

const createInitialForm = (): CreateTag => ({
  name: '',
  slug: ''
})

const rules = {
  name: {
    required: helpers.withMessage('El nombre es requerido', required),
    maxLength: helpers.withMessage('Máximo 100 caracteres', maxLength(100))
  },
  slug: {
    required: helpers.withMessage('El slug es requerido', required),
    maxLength: helpers.withMessage('Máximo 100 caracteres', maxLength(100))
  }
}

export function useTags() {
  const tags = ref<Tag[]>([])
  const form = ref<CreateTag>(createInitialForm())
  const currentTag = ref<Tag | null>(null)
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

  async function loadTags(params?: FilterTagParams | Event) {
    return runAction('No se pudieron cargar las etiquetas.', async () => {
      tags.value = await tagService.findAll(params instanceof Event ? undefined : params)
      return tags.value
    })
  }

  async function loadTagById(id: string) {
    return runAction('No se pudo cargar la etiqueta.', async () => {
      currentTag.value = await tagService.findById(id)
      form.value = {
        name: currentTag.value.name,
        slug: currentTag.value.slug
      }
      v$.value.$reset()
      return currentTag.value
    })
  }

  async function loadTagBySlug(slug: string) {
    return runAction('No se pudo cargar la etiqueta.', async () => {
      currentTag.value = await tagService.findBySlug(slug)
      return currentTag.value
    })
  }

  async function createTag(payload: CreateTag) {
    return runAction('No se pudo crear la etiqueta.', async () => {
      const tag = await tagService.create(payload)
      tags.value = [tag, ...tags.value]
      return tag
    })
  }

  async function updateTag(id: string, payload: UpdateTag) {
    return runAction('No se pudo actualizar la etiqueta.', async () => {
      const tag = await tagService.update(id, payload)
      tags.value = tags.value.map((current) => current.id === tag.id ? tag : current)
      return tag
    })
  }

  async function deleteTag(id: string) {
    return runAction('No se pudo eliminar la etiqueta.', async () => {
      await tagService.delete(id)
      tags.value = tags.value.filter((tag) => tag.id !== id)
      return true
    })
  }

  async function restoreTag(id: string) {
    return runAction('No se pudo restaurar la etiqueta.', async () => {
      await tagService.restore(id)
      return true
    })
  }

  async function submitCreateTag() {
    errorMessage.value = ''

    if (!await v$.value.$validate()) {
      return null
    }

    return createTag(toPayload(form.value))
  }

  async function submitUpdateTag(id: string) {
    errorMessage.value = ''

    if (!await v$.value.$validate()) {
      return null
    }

    return updateTag(id, toPayload(form.value))
  }

  function resetForm() {
    form.value = createInitialForm()
    currentTag.value = null
    v$.value.$reset()
    errorMessage.value = ''
  }

  function toPayload(source: CreateTag): CreateTag {
    return {
      name: source.name.trim(),
      slug: source.slug.trim()
    }
  }

  return {
    tags,
    form,
    currentTag,
    v$,
    isLoading,
    errorMessage,
    isFormValid,
    loadTags,
    loadTagById,
    loadTagBySlug,
    createTag,
    updateTag,
    deleteTag,
    restoreTag,
    submitCreateTag,
    submitUpdateTag,
    resetForm
  }
}
