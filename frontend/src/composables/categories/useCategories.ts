import { computed, ref } from 'vue'
import useVuelidate from '@vuelidate/core'
import { helpers, maxLength, required } from '@vuelidate/validators'
import type { Category, CreateCategory, FilterCategoryParams, UpdateCategory } from '@/domain/models/category.model'
import CategoryService from '@/services/categories/category.service'

const categoryService = new CategoryService()

const createInitialForm = (): CreateCategory => ({
  name: '',
  slug: '',
  description: '',
  parentId: null
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
  parentId: {}
}

export function useCategories() {
  const categories = ref<Category[]>([])
  const form = ref<CreateCategory>(createInitialForm())
  const currentCategory = ref<Category | null>(null)
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

  async function loadCategories(params?: FilterCategoryParams | Event) {
    return runAction('No se pudieron cargar las categorías.', async () => {
      categories.value = await categoryService.findAll(params instanceof Event ? undefined : params)
      return categories.value
    })
  }

  async function loadCategoryById(id: string) {
    return runAction('No se pudo cargar la categoría.', async () => {
      currentCategory.value = await categoryService.findById(id)
      form.value = {
        name: currentCategory.value.name,
        slug: currentCategory.value.slug,
        description: currentCategory.value.description ?? '',
        parentId: currentCategory.value.parentId
      }
      v$.value.$reset()
      return currentCategory.value
    })
  }

  async function createCategory(payload: CreateCategory) {
    return runAction('No se pudo crear la categoría.', async () => {
      const category = await categoryService.create(payload)
      categories.value = [category, ...categories.value]
      return category
    })
  }

  async function updateCategory(id: string, payload: UpdateCategory) {
    return runAction('No se pudo actualizar la categoría.', async () => {
      const category = await categoryService.update(id, payload)
      categories.value = categories.value.map((current) => current.id === category.id ? category : current)
      return category
    })
  }

  async function deleteCategory(id: string) {
    return runAction('No se pudo eliminar la categoría.', async () => {
      await categoryService.delete(id)
      categories.value = categories.value.filter((category) => category.id !== id)
      return true
    })
  }

  async function submitCreateCategory() {
    errorMessage.value = ''

    if (!await v$.value.$validate()) {
      return null
    }

    return createCategory(toPayload(form.value))
  }

  async function submitUpdateCategory(id: string) {
    errorMessage.value = ''

    if (!await v$.value.$validate()) {
      return null
    }

    return updateCategory(id, toPayload(form.value))
  }

  function resetForm() {
    form.value = createInitialForm()
    currentCategory.value = null
    v$.value.$reset()
    errorMessage.value = ''
  }

  function toPayload(source: CreateCategory): CreateCategory {
    return {
      name: source.name.trim(),
      slug: source.slug.trim(),
      description: source.description?.trim() || undefined,
      parentId: source.parentId || null
    }
  }

  return {
    categories,
    form,
    currentCategory,
    v$,
    isLoading,
    errorMessage,
    isFormValid,
    loadCategories,
    loadCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    submitCreateCategory,
    submitUpdateCategory,
    resetForm
  }
}
