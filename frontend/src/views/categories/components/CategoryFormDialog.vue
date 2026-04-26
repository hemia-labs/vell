<script setup lang="ts">
import { computed, watch } from 'vue'
import { Save } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import type { Category } from '@/domain/models/category.model'
import { toCategorySlug } from '../utils/category-slug'
import { buildCategoryParentOptions, ROOT_CATEGORY_VALUE } from '../utils/category-tree'

const open = defineModel<boolean>('open', { default: false })
const parentValue = defineModel<string>('parentValue', { default: ROOT_CATEGORY_VALUE })
const props = defineProps<{
  mode: 'create' | 'edit'
  categories: Category[]
  currentId?: string | null
  form: {
    name: string
    slug: string
    description?: string
    parentId?: string | null
  }
  validator: {
    name: { $model: string; $errors: Array<{ $message: string }> }
    slug: { $model: string; $errors: Array<{ $message: string }> }
    description: { $model: string | undefined }
  }
  isLoading?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  submit: []
  reset: []
}>()

const title = computed(() => props.mode === 'create' ? 'Nueva categoría' : 'Editar categoría')
const description = computed(() => props.mode === 'create' ? 'Crea un nodo dentro del árbol de contenido.' : 'Actualiza nombre, slug o padre.')
const submitLabel = computed(() => props.mode === 'create' ? 'Crear categoría' : 'Guardar cambios')
const parentOptions = computed(() => buildCategoryParentOptions(props.categories, props.currentId))

function formatParentLabel(category: { label: string; level: number }) {
  return `Nivel ${category.level + 1} - ${category.label}`
}

watch(() => props.validator.name.$model, (name) => {
  props.validator.slug.$model = toCategorySlug(name)
})

watch(open, (isOpen) => {
  if (!isOpen) {
    emit('reset')
  }
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>

      <form class="grid gap-4" @submit.prevent="emit('submit')">
        <Alert v-if="errorMessage" variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{{ errorMessage }}</AlertDescription>
        </Alert>

        <div class="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel for="category-name">Nombre</FieldLabel>
            <FieldContent>
              <Input id="category-name" v-model="validator.name.$model" placeholder="Tecnología" />
              <FieldError :errors="validator.name.$errors.map((error) => String(error.$message))" />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel for="category-slug">Slug</FieldLabel>
            <FieldContent class="grid gap-1.5">
              <Input id="category-slug" v-model="validator.slug.$model" readonly placeholder="tecnologia" />
              <FieldError :errors="validator.slug.$errors.map((error) => String(error.$message))" />
            </FieldContent>
          </Field>
        </div>

        <Field>
          <FieldLabel>Padre</FieldLabel>
          <FieldContent>
            <Select v-model="parentValue">
              <SelectTrigger class="h-9 w-full border-(--app-line) bg-(--app-surface)">
                <SelectValue placeholder="Categoría raíz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="ROOT_CATEGORY_VALUE">Categoría raíz</SelectItem>
                <SelectItem v-for="category in parentOptions" :key="category.id" :value="category.id">
                  {{ formatParentLabel(category) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel for="category-description">Descripción</FieldLabel>
          <FieldContent>
            <textarea
              id="category-description"
              v-model="validator.description.$model"
              class="min-h-24 w-full rounded-md border border-(--app-line) bg-(--app-surface) px-3 py-2 text-sm text-(--app-ink) outline-none transition-colors placeholder:text-(--app-muted) focus:border-(--app-ink)"
              placeholder="Uso interno de la categoría"
            />
          </FieldContent>
        </Field>

        <DialogFooter>
          <Button type="button" variant="outline" :disabled="isLoading" @click="emit('reset')">
            Limpiar
          </Button>
          <Button type="submit" :disabled="isLoading">
            <Save :size="14" />
            {{ submitLabel }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
