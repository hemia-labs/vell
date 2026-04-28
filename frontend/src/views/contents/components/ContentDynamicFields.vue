<script setup lang="ts">
import { computed } from 'vue'
import { VDropzone } from '@/components/core/dropzone'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { ContentFieldValueInput } from '@/domain/models/content.model'
import type { ContentTypeField } from '@/domain/models/content-type.model'

const props = defineProps<{
  fields: ContentTypeField[]
  values: ContentFieldValueInput[]
}>()

const emit = defineEmits<{
  updateValue: [fieldKey: string, value: unknown, fieldId?: string]
}>()

const sortedFields = computed(() => [...props.fields].sort((a, b) => a.order - b.order))

function getValue(field: ContentTypeField) {
  return props.values.find((item) => item.fieldId === field.id || item.fieldKey === field.fieldKey)?.value
}

function toText(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

function toFiles(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is File => item instanceof File)
  }

  return value instanceof File ? [value] : []
}

function getAllowedTypes(field: ContentTypeField) {
  const allowedTypes = field.meta?.allowedTypes

  return Array.isArray(allowedTypes)
    ? allowedTypes.filter((item): item is string => typeof item === 'string')
    : []
}

function getNumberMeta(field: ContentTypeField, key: string) {
  const value = field.meta?.[key]
  return typeof value === 'number' ? value : undefined
}

function updateFiles(field: ContentTypeField, files: File[]) {
  emit('updateValue', field.fieldKey, field.multiple ? files : files[0] ?? null, field.id)
}

function updateJson(field: ContentTypeField, value: string) {
  try {
    emit('updateValue', field.fieldKey, value.trim() ? JSON.parse(value) : null, field.id)
  } catch {
    emit('updateValue', field.fieldKey, value, field.id)
  }
}
</script>

<template>
  <div class="grid gap-4">
    <div v-if="!sortedFields.length" class="rounded-md border border-dashed border-(--app-line) bg-(--app-surface-2) p-4 text-[13px] text-(--app-muted)">
      Este tipo de contenido no tiene campos personalizados.
    </div>

    <Field v-for="field in sortedFields" :key="field.id">
      <FieldLabel :for="`content-field-${field.id}`">
        {{ field.name }}
        <span v-if="field.isRequired" class="text-destructive">*</span>
      </FieldLabel>
      <FieldContent>
        <Textarea
          v-if="['textarea', 'richtext'].includes(field.fieldType)"
          :id="`content-field-${field.id}`"
          :model-value="toText(getValue(field))"
          class="min-h-28"
          @update:model-value="emit('updateValue', field.fieldKey, String($event), field.id)"
        />

        <VDropzone
          v-else-if="field.fieldType === 'image'"
          :input-id="`content-field-${field.id}`"
          :model-value="toFiles(getValue(field))"
          :allowed-types="getAllowedTypes(field)"
          :multiple="Boolean(field.multiple)"
          :max-files="getNumberMeta(field, 'maxFiles')"
          :max-size-bytes="getNumberMeta(field, 'maxSizeBytes')"
          title="Adjuntar imagen"
          @update:model-value="updateFiles(field, $event)"
        />

        <Checkbox
          v-else-if="field.fieldType === 'boolean'"
          :id="`content-field-${field.id}`"
          :model-value="Boolean(getValue(field))"
          @update:model-value="emit('updateValue', field.fieldKey, Boolean($event), field.id)"
        />

        <Textarea
          v-else-if="field.fieldType === 'json'"
          :id="`content-field-${field.id}`"
          :model-value="JSON.stringify(getValue(field) ?? {}, null, 2)"
          class="min-h-28 font-mono text-xs"
          @update:model-value="updateJson(field, String($event))"
        />

        <Input
          v-else
          :id="`content-field-${field.id}`"
          :type="field.fieldType === 'number' ? 'number' : field.fieldType === 'date' ? 'date' : 'text'"
          :model-value="toText(getValue(field))"
          @update:model-value="emit('updateValue', field.fieldKey, field.fieldType === 'number' ? Number($event) : String($event), field.id)"
        />
      </FieldContent>
    </Field>
  </div>
</template>
