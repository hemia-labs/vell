<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import type { ContentType, ContentTypeVersion, FieldType } from '@/domain/models/content-type.model'

type DiffLineKind = 'add' | 'remove' | 'context'

interface DiffLine {
  key: string
  kind: DiffLineKind
  label: string
  value: string
}

const props = defineProps<{
  contentType: ContentType
  version: ContentTypeVersion
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

const diffLines = computed(() => buildDiffLines(props.contentType, props.version))
const addCount = computed(() => diffLines.value.filter(line => line.kind === 'add').length)
const removeCount = computed(() => diffLines.value.filter(line => line.kind === 'remove').length)

function fieldTypeLabel(value: string) {
  return fieldLabels[value as FieldType] ?? value
}

function formatField(field: {
  name: string
  fieldKey: string
  fieldType: string
  isRequired: boolean
  order: number
  meta?: Record<string, unknown>
}) {
  return `${field.name} (${field.fieldKey}) · ${fieldTypeLabel(field.fieldType)} · ${field.isRequired ? 'required' : 'optional'} · order ${field.order + 1}`
}

function formatMeta(meta?: Record<string, unknown>) {
  const normalizedMeta = meta ?? {}
  return JSON.stringify(normalizedMeta) === '{}' ? 'meta {}' : `meta ${JSON.stringify(normalizedMeta)}`
}

function buildDiffLines(contentType: ContentType, version: ContentTypeVersion): DiffLine[] {
  const lines: DiffLine[] = []
  const snapshot = version.schemaSnapshot
  const currentFields = contentType.fields ?? []
  const currentByKey = new Map(currentFields.map(field => [field.fieldKey, field]))
  const snapshotByKey = new Map(snapshot.fields.map(field => [field.fieldKey, field]))

  addScalarDiff(lines, 'name', 'name', contentType.name, snapshot.name)
  addScalarDiff(lines, 'slug', 'slug', contentType.slug, snapshot.slug)
  addScalarDiff(lines, 'description', 'description', contentType.description ?? '', snapshot.description ?? '')

  for (const field of snapshot.fields) {
    const currentField = currentByKey.get(field.fieldKey)

    if (!currentField) {
      lines.push({
        key: `field-${field.fieldKey}-add`,
        kind: 'add',
        label: `field ${field.fieldKey}`,
        value: `${formatField(field)} · ${formatMeta(field.meta)}`
      })
      continue
    }

    const currentValue = `${formatField(currentField)} · ${formatMeta(currentField.meta)}`
    const snapshotValue = `${formatField(field)} · ${formatMeta(field.meta)}`

    if (currentValue !== snapshotValue) {
      lines.push({
        key: `field-${field.fieldKey}-remove`,
        kind: 'remove',
        label: `field ${field.fieldKey}`,
        value: currentValue
      })
      lines.push({
        key: `field-${field.fieldKey}-add`,
        kind: 'add',
        label: `field ${field.fieldKey}`,
        value: snapshotValue
      })
    } else {
      lines.push({
        key: `field-${field.fieldKey}-context`,
        kind: 'context',
        label: `field ${field.fieldKey}`,
        value: snapshotValue
      })
    }
  }

  for (const field of currentFields) {
    if (snapshotByKey.has(field.fieldKey)) {
      continue
    }

    lines.push({
      key: `field-${field.fieldKey}-remove`,
      kind: 'remove',
      label: `field ${field.fieldKey}`,
      value: `${formatField(field)} · ${formatMeta(field.meta)}`
    })
  }

  return lines
}

function addScalarDiff(lines: DiffLine[], key: string, label: string, currentValue: string, nextValue: string) {
  if (currentValue === nextValue) {
    lines.push({
      key: `${key}-context`,
      kind: 'context',
      label,
      value: nextValue || 'empty'
    })
    return
  }

  lines.push({
    key: `${key}-remove`,
    kind: 'remove',
    label,
    value: currentValue || 'empty'
  })
  lines.push({
    key: `${key}-add`,
    kind: 'add',
    label,
    value: nextValue || 'empty'
  })
}
</script>

<template>
  <section class="grid gap-2">
    <div class="flex items-center justify-between gap-3">
      <div class="text-sm font-semibold text-(--app-ink)">
        Diff de restauración
      </div>
      <div class="flex items-center gap-1.5">
        <Badge class="border-emerald-200 bg-emerald-50 text-emerald-700">+{{ addCount }}</Badge>
        <Badge class="border-red-200 bg-red-50 text-red-700">-{{ removeCount }}</Badge>
      </div>
    </div>

    <div class="max-h-72 overflow-y-auto rounded-md border border-(--app-line) bg-(--app-surface) font-mono text-[12.5px]">
      <div
        v-for="line in diffLines"
        :key="line.key"
        class="grid grid-cols-[28px_130px_1fr] gap-2 border-b border-(--app-line-2) px-3 py-1.5 last:border-b-0"
        :class="{
          'bg-emerald-50 text-emerald-900': line.kind === 'add',
          'bg-red-50 text-red-900': line.kind === 'remove',
          'text-(--app-muted)': line.kind === 'context'
        }"
      >
        <span>{{ line.kind === 'add' ? '+' : line.kind === 'remove' ? '-' : ' ' }}</span>
        <span>{{ line.label }}</span>
        <span class="break-words">{{ line.value }}</span>
      </div>
    </div>
  </section>
</template>
