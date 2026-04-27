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
import { toTagSlug } from '../utils/tag-slug'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  mode: 'create' | 'edit'
  validator: {
    name: { $model: string; $errors: Array<{ $message: string }> }
    slug: { $model: string; $errors: Array<{ $message: string }> }
  }
  isLoading?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  submit: []
  reset: []
}>()

const title = computed(() => props.mode === 'create' ? 'Nueva etiqueta' : 'Editar etiqueta')
const description = computed(() => props.mode === 'create' ? 'Crea una palabra clave plana para describir contenidos.' : 'Actualiza nombre y slug de la etiqueta.')
const submitLabel = computed(() => props.mode === 'create' ? 'Crear etiqueta' : 'Guardar cambios')

watch(() => props.validator.name.$model, (name) => {
  props.validator.slug.$model = toTagSlug(name)
})

watch(open, (isOpen) => {
  if (!isOpen) {
    emit('reset')
  }
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
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
            <FieldLabel for="tag-name">Nombre</FieldLabel>
            <FieldContent>
              <Input id="tag-name" v-model="validator.name.$model" placeholder="Vue 3" />
              <FieldError :errors="validator.name.$errors.map((error) => String(error.$message))" />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel for="tag-slug">Slug</FieldLabel>
            <FieldContent class="grid gap-1.5">
              <Input id="tag-slug" v-model="validator.slug.$model" readonly placeholder="vue-3" />
              <FieldError :errors="validator.slug.$errors.map((error) => String(error.$message))" />
            </FieldContent>
          </Field>
        </div>

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
