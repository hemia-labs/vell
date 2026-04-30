<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { GripVertical, Plus, Save, Settings2, Trash2 } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { CreateContentType, CreateContentTypeField, FieldType } from '@/domain/models/content-type.model'
import { CONTENT_TYPE_FIELD_TYPES } from '@/composables/content-types/useContentTypes'
import ContentTypeFieldMetaEditor from './ContentTypeFieldMetaEditor.vue'
import { toContentTypeSlug } from '../utils/content-type-slug'

const props = defineProps<{
  mode: 'create' | 'edit'
  form: CreateContentType
  validator: {
    name: { $model: string; $errors: Array<{ $message: string }> }
    slug: { $model: string; $errors: Array<{ $message: string }> }
    description: { $model: string | null | undefined }
  }
  isLoading?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  submit: []
  reset: []
  addField: []
  updateField: [index: number, payload: Partial<CreateContentTypeField>]
  removeField: [index: number]
  moveField: [fromIndex: number, toIndex: number]
}>()

const fieldLabels: Record<FieldType, string> = {
  text: 'Texto',
  textarea: 'Texto largo',
  number: 'Número',
  boolean: 'Booleano',
  date: 'Fecha',
  image: 'Imagen',
  file: 'Archivo',
  select: 'Select',
  relation: 'Relación',
  json: 'JSON',
  richtext: 'Rich text'
}

const descriptionModel = computed({
  get: () => props.validator.description.$model ?? '',
  set: (value: string | number) => {
    props.validator.description.$model = String(value)
  }
})
const title = computed(() => props.mode === 'create' ? 'Nuevo tipo de contenido' : 'Editar tipo de contenido')
const submitLabel = computed(() => props.mode === 'create' ? 'Crear tipo' : 'Guardar cambios')
const draggingIndex = ref<number | null>(null)
const metaFieldIndex = ref<number | null>(null)
const isMetaSheetOpen = computed({
  get: () => metaFieldIndex.value !== null,
  set: (value: boolean) => {
    if (!value) {
      metaFieldIndex.value = null
    }
  }
})
const metaField = computed(() => {
  if (metaFieldIndex.value === null) {
    return null
  }

  return props.form.fields?.[metaFieldIndex.value] ?? null
})

watch(() => props.validator.name.$model, (name) => {
  if (props.mode === 'create') {
    props.validator.slug.$model = toContentTypeSlug(name)
  }
})

watch(() => props.form.fields?.length ?? 0, (length) => {
  if (metaFieldIndex.value !== null && metaFieldIndex.value >= length) {
    metaFieldIndex.value = null
  }
})

function startDrag(index: number) {
  draggingIndex.value = index
}

function dropField(index: number) {
  if (draggingIndex.value === null || draggingIndex.value === index) {
    draggingIndex.value = null
    return
  }

  emit('moveField', draggingIndex.value, index)
  draggingIndex.value = null
}
</script>

<template>
  <form class="grid gap-5" @submit.prevent="emit('submit')">
    <Alert v-if="errorMessage" variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <section class="grid gap-3 rounded-md border border-(--app-line) bg-(--app-surface) p-4 shadow-(--app-shadow)">
      <div>
        <h2 class="text-base font-semibold text-(--app-ink)">{{ title }}</h2>
        <p class="m-0 text-[12.5px] text-(--app-muted)">Define estructura, slug y campos del CMS.</p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel for="content-type-name">Nombre</FieldLabel>
          <FieldContent>
            <Input id="content-type-name" v-model="validator.name.$model" placeholder="Blog Post" />
            <FieldError :errors="validator.name.$errors.map((error) => String(error.$message))" />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel for="content-type-slug">Slug</FieldLabel>
          <FieldContent>
            <Input id="content-type-slug" v-model="validator.slug.$model" readonly placeholder="blog-post" />
            <FieldError :errors="validator.slug.$errors.map((error) => String(error.$message))" />
          </FieldContent>
        </Field>

        <Field class="sm:col-span-2">
          <FieldLabel for="content-type-description">Descripción</FieldLabel>
          <FieldContent>
            <Textarea
              id="content-type-description"
              v-model="descriptionModel"
              class="min-h-22 border-(--app-line) bg-(--app-surface) text-sm text-(--app-ink)"
              placeholder="Uso interno del tipo de contenido"
            />
          </FieldContent>
        </Field>
      </div>
    </section>

    <section class="grid gap-3">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-(--app-ink)">Campos</h3>
          <p class="m-0 text-[12.5px] text-(--app-muted)">Agrega, ordena o ajusta campos para el formulario dinámico.</p>
        </div>

        <Button type="button" variant="outline" size="sm" @click="emit('addField')">
          <Plus :size="14" />
          Agregar campo
        </Button>
      </div>

      <div class="grid gap-2">
        <article
          v-for="(field, index) in form.fields"
          :key="field.id ?? index"
          draggable="true"
          class="grid gap-3 rounded-md border border-(--app-line) bg-(--app-surface) p-3 transition-opacity"
          :class="{ 'opacity-50': draggingIndex === index }"
          @dragstart="startDrag(index)"
          @dragover.prevent
          @drop.prevent="dropField(index)"
          @dragend="draggingIndex = null"
        >
          <div class="grid gap-3 lg:grid-cols-[40px_1fr_1fr_180px_110px_88px]">
            <div class="flex items-center justify-center">
              <span
                class="flex h-9 w-9 cursor-grab items-center justify-center rounded-md border border-(--app-line) bg-(--app-surface) text-(--app-muted) active:cursor-grabbing"
                aria-label="Arrastrar campo"
                title="Arrastrar campo"
              >
                <GripVertical :size="16" />
              </span>
            </div>

            <Field>
              <FieldLabel :for="`content-type-field-name-${index}`">Nombre</FieldLabel>
              <FieldContent>
                <Input
                  :id="`content-type-field-name-${index}`"
                  :model-value="field.name"
                  placeholder="Título"
                  @update:model-value="emit('updateField', index, { name: String($event) })"
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel :for="`content-type-field-key-${index}`">Field key</FieldLabel>
              <FieldContent>
                <Input
                  :id="`content-type-field-key-${index}`"
                  :model-value="field.fieldKey"
                  placeholder="title"
                  @update:model-value="emit('updateField', index, { fieldKey: String($event) })"
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Tipo</FieldLabel>
              <FieldContent>
                <Select
                  :model-value="field.fieldType"
                  @update:model-value="emit('updateField', index, { fieldType: $event as FieldType })"
                >
                  <SelectTrigger class="h-9 w-full border-(--app-line) bg-(--app-surface)">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="type in CONTENT_TYPE_FIELD_TYPES" :key="type" :value="type">
                      {{ fieldLabels[type] }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Requerido</FieldLabel>
              <FieldContent class="flex h-9 items-center gap-2">
                <Switch
                  :model-value="field.isRequired"
                  @update:model-value="emit('updateField', index, { isRequired: Boolean($event) })"
                />
                <span class="text-[12.5px] text-(--app-muted)">{{ field.isRequired ? 'Sí' : 'No' }}</span>
              </FieldContent>
            </Field>

            <div class="flex items-end justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="text-(--app-muted)"
                aria-label="Editar meta"
                title="Editar meta"
                @click="metaFieldIndex = index"
              >
                <Settings2 :size="15" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="text-(--app-muted)"
                aria-label="Eliminar campo"
                @click="emit('removeField', index)"
              >
                <Trash2 :size="15" />
              </Button>
            </div>
          </div>
        </article>

        <div
          v-if="!form.fields?.length"
          class="rounded-md border border-dashed border-(--app-line) bg-(--app-surface-2) px-4 py-7 text-center text-[13px] text-(--app-muted)"
        >
          Sin campos definidos.
        </div>
      </div>
    </section>

    <div class="flex justify-end gap-2 border-t border-(--app-line) pt-4">
      <Button type="button" variant="outline" :disabled="isLoading" @click="emit('reset')">
        Limpiar
      </Button>
      <Button type="submit" :disabled="isLoading">
        <Save :size="14" />
        {{ submitLabel }}
      </Button>
    </div>

    <Sheet v-model:open="isMetaSheetOpen">
      <SheetContent side="right" class="w-full overflow-y-auto border-(--app-line) bg-(--app-surface) p-4 sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Meta de campo</SheetTitle>
          <SheetDescription>{{ metaField?.name || metaField?.fieldKey || 'Campo sin nombre' }}</SheetDescription>
        </SheetHeader>

        <ContentTypeFieldMetaEditor
          v-if="metaField && metaFieldIndex !== null"
          :field-type="metaField.fieldType"
          :meta="metaField.meta"
          @update="emit('updateField', metaFieldIndex, { meta: $event })"
        />
      </SheetContent>
    </Sheet>
  </form>
</template>
