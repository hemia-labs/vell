<script setup lang="ts">
import { computed, watch } from 'vue'
import { ArrowRightLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { Category } from '@/domain/models/category.model'
import { buildCategoryParentOptions, ROOT_CATEGORY_VALUE } from '../utils/category-tree'

const open = defineModel<boolean>('open', { default: false })
const parentValue = defineModel<string>('parentValue', { default: ROOT_CATEGORY_VALUE })
const props = defineProps<{
  category: Category | null
  categories: Category[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  submit: []
}>()

const parentOptions = computed(() => buildCategoryParentOptions(props.categories, props.category?.id))
const currentParentLabel = computed(() => props.category?.parent?.name ?? 'Raíz')
const isSubmitDisabled = computed(() => {
  const nextParentId = parentValue.value === ROOT_CATEGORY_VALUE ? null : parentValue.value

  return props.isLoading || nextParentId === (props.category?.parentId ?? null)
})

function formatParentLabel(category: { label: string; level: number }) {
  return `Nivel ${category.level + 1} - ${category.label}`
}

watch(open, (isOpen) => {
  if (isOpen) {
    parentValue.value = props.category?.parentId ?? ROOT_CATEGORY_VALUE
  }
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Mover categoría</DialogTitle>
        <DialogDescription>
          Transfiere "{{ category?.name }}" y todos sus hijos a otra categoría o a raíz.
        </DialogDescription>
      </DialogHeader>

      <form class="grid gap-4" @submit.prevent="emit('submit')">
        <div class="rounded-md border border-(--app-line) bg-(--app-surface-2) px-3 py-2 text-[13px] text-(--app-muted)">
          Padre actual: <span class="font-medium text-(--app-ink)">{{ currentParentLabel }}</span>
        </div>

        <Field>
          <FieldLabel>Nuevo padre</FieldLabel>
          <FieldContent>
            <Select v-model="parentValue">
              <SelectTrigger class="h-9 w-full border-(--app-line) bg-(--app-surface)">
                <SelectValue placeholder="Categoría raíz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="ROOT_CATEGORY_VALUE">Categoría raíz</SelectItem>
                <SelectItem v-for="categoryOption in parentOptions" :key="categoryOption.id" :value="categoryOption.id">
                  {{ formatParentLabel(categoryOption) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>

        <DialogFooter>
          <Button type="submit" :disabled="isSubmitDisabled">
            <ArrowRightLeft :size="14" />
            Mover categoría
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
