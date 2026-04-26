<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { AlertCircleIcon, Folder, FolderPlus, RefreshCw, Search } from 'lucide-vue-next'
import VActionMenu, { type VActionMenuAction } from '@/components/core/VActionMenu.vue'
import VDataTable, { type VDataTableColumn, type VDataTableKey } from '@/components/core/VDataTable.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuthorization } from '@/composables/auth/useAuthorization'
import { useCategories } from '@/composables/categories/useCategories'
import type { Category } from '@/domain/models/category.model'
import CategoryFormDialog from './components/CategoryFormDialog.vue'
import DeleteCategoryDialog from './components/DeleteCategoryDialog.vue'
import MoveCategoryDialog from './components/MoveCategoryDialog.vue'
import { buildCategoryTree, flattenCategoryTree, getDescendantIds, ROOT_CATEGORY_VALUE } from './utils/category-tree'
const ITEMS_PER_PAGE = 10

const {
  categories,
  form,
  v$,
  isLoading,
  errorMessage,
  loadCategories,
  loadCategoryById,
  submitCreateCategory,
  submitUpdateCategory,
  updateCategory,
  deleteCategory,
  resetForm
} = useCategories()
const { can, filterAllowed } = useAuthorization()

const search = ref('')
const selectedIds = ref<VDataTableKey[]>([])
const currentPage = ref(1)
const isFormDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const isMoveDialogOpen = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const selectedCategoryId = ref<string | null>(null)
const selectedAction = ref<string | null>(null)
const parentValue = ref(ROOT_CATEGORY_VALUE)
const moveParentValue = ref(ROOT_CATEGORY_VALUE)

const columns: VDataTableColumn[] = [
  { key: 'name', label: 'Categoría' },
  { key: 'slug', label: 'Slug' },
  { key: 'parent', label: 'Padre' },
  { key: 'children', label: 'Hijos' },
  { key: 'description', label: 'Descripción' }
]

const actions: VActionMenuAction[] = [
  { key: 'create-child', label: 'Crear subcategoría', permission: 'categories:create' },
  { key: 'edit', label: 'Editar', permission: 'categories:edit' },
  { key: 'move', label: 'Transferir', permission: 'categories:edit' },
  { key: 'delete', label: 'Eliminar', permission: 'categories:delete', danger: true }
]

const normalizedSearch = computed(() => search.value.trim().toLowerCase())
const allowedActions = computed(() => filterAllowed(actions))
const categoryRows = computed(() => flattenCategoryTree(buildCategoryTree(categories.value)))
const filteredCategories = computed(() => {
  return categoryRows.value.filter((category) => {
    if (!normalizedSearch.value) {
      return true
    }

    return [category.name, category.slug, category.description, category.path, category.parentName]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch.value))
  })
})
const pagedCategories = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  return filteredCategories.value.slice(start, start + ITEMS_PER_PAGE)
})
const selectedCategory = computed(() => {
  return categories.value.find((category) => category.id === selectedCategoryId.value) ?? null
})
const selectedCategoryDescendantCount = computed(() => {
  return getDescendantIds(selectedCategoryId.value, categories.value).size
})
const hasActions = computed(() => can(['categories:edit', 'categories:delete']))

watch(parentValue, (value) => {
  form.value.parentId = value === ROOT_CATEGORY_VALUE ? null : value
})

watch(search, () => {
  currentPage.value = 1
})

watch(() => form.value.parentId, (value) => {
  parentValue.value = value ?? ROOT_CATEGORY_VALUE
})

async function loadAll() {
  await loadCategories({ withParent: true, withChildren: true })
}

function openCreateDialog() {
  formMode.value = 'create'
  selectedCategoryId.value = null
  resetForm()
  parentValue.value = ROOT_CATEGORY_VALUE
  isFormDialogOpen.value = true
}

function openCreateChildDialog(category: Category) {
  formMode.value = 'create'
  selectedCategoryId.value = null
  resetForm()
  parentValue.value = category.id
  form.value.parentId = category.id
  isFormDialogOpen.value = true
}

async function openEditDialog(category: Category) {
  formMode.value = 'edit'
  selectedCategoryId.value = category.id
  await loadCategoryById(category.id)
  parentValue.value = form.value.parentId ?? ROOT_CATEGORY_VALUE
  isFormDialogOpen.value = true
}

function handleAction(action: VActionMenuAction, category: Category) {
  if (!can(action.permission)) {
    return
  }

  selectedAction.value = action.key
  selectedCategoryId.value = category.id

  if (action.key === 'create-child') {
    openCreateChildDialog(category)
  }

  if (action.key === 'edit') {
    openEditDialog(category)
  }

  if (action.key === 'move') {
    moveParentValue.value = category.parentId ?? ROOT_CATEGORY_VALUE
    isMoveDialogOpen.value = true
  }

  if (action.key === 'delete') {
    isDeleteDialogOpen.value = true
  }
}

async function submitForm() {
  const result = formMode.value === 'create'
    ? await submitCreateCategory()
    : selectedCategoryId.value ? await submitUpdateCategory(selectedCategoryId.value) : null

  if (!result) {
    return
  }

  isFormDialogOpen.value = false
  resetForm()
  await loadAll()
}

async function confirmDelete() {
  if (!selectedCategoryId.value) {
    return
  }

  const result = await deleteCategory(selectedCategoryId.value)
  if (!result) {
    return
  }

  isDeleteDialogOpen.value = false
  selectedCategoryId.value = null
  await loadAll()
}

async function submitMove() {
  if (!selectedCategoryId.value) {
    return
  }

  const result = await updateCategory(selectedCategoryId.value, {
    parentId: moveParentValue.value === ROOT_CATEGORY_VALUE ? null : moveParentValue.value
  })

  if (!result) {
    return
  }

  isMoveDialogOpen.value = false
  selectedCategoryId.value = null
  await loadAll()
}

onMounted(loadAll)
</script>

<template>
  <div class="flex w-full flex-col gap-5.5">
    <section class="flex items-start justify-between gap-6 max-[760px]:flex-col max-[760px]:items-stretch">
      <div>
        <div class="mb-1 text-3xl font-semibold leading-tight text-(--app-ink)">
          Categorías
        </div>
        <p class="m-0 max-w-2xl text-[13.5px] text-(--app-muted)">
          Administra la jerarquía que organiza contenidos por temas, secciones y subniveles.
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-2 max-[760px]:flex-wrap">
        <Button variant="outline" size="sm" :disabled="isLoading" @click="loadAll">
          <RefreshCw :size="14" :class="{ 'animate-spin': isLoading }" />
          Actualizar
        </Button>
        <Button v-can="'categories:create'" size="sm" @click="openCreateDialog">
          <FolderPlus :size="14" />
          Nueva categoría
        </Button>
      </div>
    </section>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <section class="grid gap-4">
      <div class="flex min-w-0 flex-col gap-4">
        <section class="flex items-center justify-between gap-3 max-[760px]:flex-col max-[760px]:items-stretch" aria-label="Filtros de categorías">
          <Field class="min-w-[min(100%,320px)] flex-[1_1_420px]">
            <FieldLabel class="sr-only" for="categories-search">Buscar categorías</FieldLabel>
            <FieldContent class="relative text-(--app-muted)">
              <Search class="absolute left-3 top-1/2 z-[1] -translate-y-1/2" :size="14" />
              <Input
                id="categories-search"
                v-model="search"
                class="h-8.5 border-(--app-line) bg-(--app-surface) pl-8.5 text-[13px] text-(--app-ink)"
                placeholder="Buscar por nombre, slug o padre"
              />
            </FieldContent>
          </Field>

          <div class="text-[12.5px] text-(--app-muted)">
            {{ filteredCategories.length }} de {{ categoryRows.length }} categorías
          </div>
        </section>

        <section class="overflow-hidden rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) shadow-(--app-shadow)" aria-label="Lista de categorías">
          <VDataTable
            v-model:selected-keys="selectedIds"
            v-model:page="currentPage"
            :rows="pagedCategories"
            :columns="columns"
            row-key="id"
            :actions="hasActions"
            pagination
            :items-per-page="ITEMS_PER_PAGE"
            :total-items="filteredCategories.length"
            min-width-class="min-w-[860px]"
            :empty-message="isLoading ? 'Cargando categorías...' : 'No hay categorías que coincidan con la búsqueda.'"
          >
            <template #cell-name="{ row: category }">
              <div class="flex min-w-0 items-center gap-2" :style="{ paddingLeft: `${category.level * 18}px` }">
                <span
                  v-if="category.level > 0"
                  class="h-6 w-4 shrink-0 rounded-bl-md border-b border-l border-(--app-line)"
                  aria-hidden="true"
                />
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-(--app-line) bg-(--app-surface-2) text-(--app-muted)">
                  <Folder :size="14" />
                </span>
                <span class="min-w-0">
                  <span class="block truncate font-medium text-(--app-ink)">{{ category.name }}</span>
                  <span class="block truncate text-[12px] text-(--app-muted)">{{ category.path }}</span>
                </span>
              </div>
            </template>

            <template #cell-slug="{ row: category }">
              <Badge variant="outline">{{ category.slug }}</Badge>
            </template>

            <template #cell-parent="{ row: category }">
              <span class="text-[13px] text-(--app-muted)">{{ category.parentName ?? 'Raíz' }}</span>
            </template>

            <template #cell-children="{ row: category }">
              <Badge variant="secondary">{{ category.children?.length ?? 0 }}</Badge>
            </template>

            <template #cell-description="{ row: category }">
              <span class="line-clamp-1 text-[13px] text-(--app-muted)">{{ category.description || 'Sin descripción' }}</span>
            </template>

            <template #actions="{ row: category }">
              <VActionMenu v-model="selectedAction" :actions="allowedActions" label="Acciones de categoría" @select="handleAction($event, category)" />
            </template>
          </VDataTable>
        </section>
      </div>
    </section>

    <CategoryFormDialog
      v-model:open="isFormDialogOpen"
      v-model:parent-value="parentValue"
      :mode="formMode"
      :categories="categories"
      :current-id="selectedCategoryId"
      :form="form"
      :validator="v$"
      :is-loading="isLoading"
      :error-message="errorMessage"
      @submit="submitForm"
      @reset="resetForm"
    />

    <DeleteCategoryDialog
      v-model:open="isDeleteDialogOpen"
      :category="selectedCategory"
      :descendant-count="selectedCategoryDescendantCount"
      :is-loading="isLoading"
      @confirm="confirmDelete"
    />

    <MoveCategoryDialog
      v-model:open="isMoveDialogOpen"
      v-model:parent-value="moveParentValue"
      :category="selectedCategory"
      :categories="categories"
      :is-loading="isLoading"
      @submit="submitMove"
    />
  </div>
</template>
