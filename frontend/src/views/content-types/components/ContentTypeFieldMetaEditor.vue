<script setup lang="ts">
import { computed } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { FieldMeta, FieldType } from '@/domain/models/content-type.model'

const props = defineProps<{
  fieldType: FieldType
  meta?: FieldMeta
}>()

const emit = defineEmits<{
  update: [meta: FieldMeta]
}>()

const allowedTypeOptions = [
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/png', label: 'PNG' },
  { value: 'image/webp', label: 'WebP' },
  { value: 'image/svg+xml', label: 'SVG' },
  { value: 'application/pdf', label: 'PDF' },
  { value: 'text/csv', label: 'CSV' },
  { value: 'application/json', label: 'JSON' },
  { value: 'application/zip', label: 'ZIP' }
]

const jsonModel = computed({
  get: () => JSON.stringify(props.meta ?? {}, null, 2),
  set: (value: string | number) => {
    try {
      emit('update', JSON.parse(String(value || '{}')))
    } catch {
      emit('update', props.meta ?? {})
    }
  }
})

function valueOf<T>(key: string, fallback: T): T {
  const value = props.meta?.[key]
  return value === undefined || value === null ? fallback : value as T
}

function patch(key: string, value: unknown) {
  emit('update', {
    ...(props.meta ?? {}),
    [key]: value
  })
}

function patchNumber(key: string, value: string | number) {
  const numericValue = Number(value)
  patch(key, Number.isFinite(numericValue) ? numericValue : undefined)
}

function patchList(key: string, value: string | number) {
  patch(
    key,
    String(value)
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  )
}

function patchJson(key: string, value: string | number, fallback: unknown) {
  try {
    patch(key, JSON.parse(String(value || JSON.stringify(fallback))))
  } catch {
    patch(key, fallback)
  }
}

function helpText(text: string) {
  return text
}

function allowedTypes() {
  return valueOf<string[]>('allowedTypes', [])
}

function addAllowedType(value: string | number) {
  const nextType = String(value)
  const nextTypes = Array.from(new Set([...allowedTypes(), nextType])).filter(Boolean)
  patch('allowedTypes', nextTypes)
}

function removeAllowedType(value: string) {
  patch('allowedTypes', allowedTypes().filter(type => type !== value))
}

function normalizedOptions() {
  const options = valueOf<Array<{ text?: string; label?: string; value?: string } | string>>('options', [])

  return options.map((option) => {
    if (typeof option === 'string') {
      return { text: option, value: toSnakeCase(option) }
    }

    const text = String(option.text ?? option.label ?? option.value ?? '')

    return {
      text,
      value: String(option.value ?? toSnakeCase(text))
    }
  })
}

function patchOptions(options: Array<{ text: string; value: string }>) {
  patch(
    'options',
    options
      .map(option => ({ text: option.text.trim(), value: option.value.trim() }))
      .filter(option => option.text || option.value)
  )
}

function addOption() {
  const nextIndex = normalizedOptions().length + 1
  const text = `Opción ${nextIndex}`
  patchOptions([...normalizedOptions(), { text, value: toSnakeCase(text) }])
}

function updateOption(index: number, key: 'text' | 'value', value: string | number) {
  const options = [...normalizedOptions()]
  const option = options[index]

  if (!option) {
    return
  }

  const nextValue = String(value)
  options[index] = {
    ...option,
    [key]: nextValue,
    value: key === 'text' ? toSnakeCase(nextValue) : nextValue
  }
  patchOptions(options)
}

function toSnakeCase(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function removeOption(index: number) {
  patchOptions(normalizedOptions().filter((_, currentIndex) => currentIndex !== index))
}
</script>

<template>
  <section class="grid gap-3 rounded-md border border-(--app-line) bg-(--app-surface) p-3">
    <div class="text-[12px] font-semibold uppercase tracking-[0.06em] text-(--app-muted)">
      Meta
    </div>
    <p class="m-0 text-[12.5px] text-(--app-muted)">
      Configura validaciones y comportamiento del campo. Los ejemplos ayudan a mantener valores consistentes.
    </p>

    <div v-if="fieldType === 'date'" class="grid gap-3 sm:grid-cols-3">
      <Field>
        <FieldLabel>Formato</FieldLabel>
        <FieldContent>
          <Select :model-value="valueOf('format', 'date')" @update:model-value="patch('format', $event)">
            <SelectTrigger class="h-9 w-full border-(--app-line) bg-(--app-surface)">
              <SelectValue placeholder="Formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">date</SelectItem>
              <SelectItem value="datetime">datetime</SelectItem>
            </SelectContent>
          </Select>
          <p class="m-0 text-[12px] text-(--app-muted)">{{ helpText('Ejemplo: date para fecha simple, datetime para fecha con hora.') }}</p>
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel>Auto now</FieldLabel>
        <FieldContent class="flex h-9 items-center gap-2">
          <Switch :model-value="valueOf('autoNow', false)" @update:model-value="patch('autoNow', Boolean($event))" />
          <span class="text-[12.5px] text-(--app-muted)">{{ valueOf('autoNow', false) ? 'Sí' : 'No' }}</span>
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel>Auto update</FieldLabel>
        <FieldContent class="flex h-9 items-center gap-2">
          <Switch :model-value="valueOf('autoOnUpdate', false)" @update:model-value="patch('autoOnUpdate', Boolean($event))" />
          <span class="text-[12.5px] text-(--app-muted)">{{ valueOf('autoOnUpdate', false) ? 'Sí' : 'No' }}</span>
        </FieldContent>
      </Field>
    </div>

    <div v-else-if="fieldType === 'text'" class="grid gap-3 sm:grid-cols-3">
      <Field>
        <FieldLabel>Min length</FieldLabel>
        <FieldContent>
          <Input type="number" :model-value="valueOf('minLength', '')" placeholder="3" @update:model-value="patchNumber('minLength', $event)" />
          <p class="m-0 text-[12px] text-(--app-muted)">Mínimo de caracteres permitidos.</p>
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel>Max length</FieldLabel>
        <FieldContent>
          <Input type="number" :model-value="valueOf('maxLength', '')" placeholder="120" @update:model-value="patchNumber('maxLength', $event)" />
          <p class="m-0 text-[12px] text-(--app-muted)">Ejemplo: 120 para título corto.</p>
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel>Default</FieldLabel>
        <FieldContent><Input :model-value="valueOf('defaultValue', '')" placeholder="Sin título" @update:model-value="patch('defaultValue', String($event))" /></FieldContent>
      </Field>
      <Field class="sm:col-span-2">
        <FieldLabel>Regex</FieldLabel>
        <FieldContent>
          <Input :model-value="valueOf('regex', '')" placeholder="^[a-z0-9-]+$" @update:model-value="patch('regex', String($event))" />
          <p class="m-0 text-[12px] text-(--app-muted)">Ejemplo: ^[a-z0-9-]+$ para slugs.</p>
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel>Slug</FieldLabel>
        <FieldContent class="flex h-9 items-center gap-2">
          <Switch :model-value="valueOf('isSlug', false)" @update:model-value="patch('isSlug', Boolean($event))" />
          <span class="text-[12.5px] text-(--app-muted)">{{ valueOf('isSlug', false) ? 'Sí' : 'No' }}</span>
        </FieldContent>
      </Field>
    </div>

    <div v-else-if="fieldType === 'number'" class="grid gap-3 sm:grid-cols-4">
      <Field>
        <FieldLabel>Min</FieldLabel>
        <FieldContent><Input type="number" :model-value="valueOf('min', '')" placeholder="0" @update:model-value="patchNumber('min', $event)" /></FieldContent>
      </Field>
      <Field>
        <FieldLabel>Max</FieldLabel>
        <FieldContent><Input type="number" :model-value="valueOf('max', '')" placeholder="100" @update:model-value="patchNumber('max', $event)" /></FieldContent>
      </Field>
      <Field>
        <FieldLabel>Step</FieldLabel>
        <FieldContent><Input type="number" :model-value="valueOf('step', '')" placeholder="1" @update:model-value="patchNumber('step', $event)" /></FieldContent>
      </Field>
      <Field>
        <FieldLabel>Default</FieldLabel>
        <FieldContent><Input type="number" :model-value="valueOf('defaultValue', '')" @update:model-value="patchNumber('defaultValue', $event)" /></FieldContent>
      </Field>
    </div>

    <div v-else-if="fieldType === 'boolean'" class="grid gap-3 sm:grid-cols-2">
      <Field>
        <FieldLabel>Default value</FieldLabel>
        <FieldContent class="flex h-9 items-center gap-2">
          <Switch :model-value="valueOf('defaultValue', false)" @update:model-value="patch('defaultValue', Boolean($event))" />
          <span class="text-[12.5px] text-(--app-muted)">{{ valueOf('defaultValue', false) ? 'True' : 'False' }}</span>
        </FieldContent>
      </Field>
    </div>

    <div v-else-if="fieldType === 'image' || fieldType === 'file'" class="grid gap-3 sm:grid-cols-3">
      <Field>
        <FieldLabel>Multiple</FieldLabel>
        <FieldContent class="flex h-9 items-center gap-2">
          <Switch :model-value="valueOf('multiple', false)" @update:model-value="patch('multiple', Boolean($event))" />
          <span class="text-[12.5px] text-(--app-muted)">{{ valueOf('multiple', false) ? 'Sí' : 'No' }}</span>
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel>Max size</FieldLabel>
        <FieldContent>
          <Input type="number" :model-value="valueOf('maxSize', '')" placeholder="5242880" @update:model-value="patchNumber('maxSize', $event)" />
          <p class="m-0 text-[12px] text-(--app-muted)">Bytes. Ejemplo: 5242880 = 5 MB.</p>
        </FieldContent>
      </Field>
      <Field class="sm:col-span-3">
        <FieldLabel>Allowed types</FieldLabel>
        <FieldContent class="grid gap-2">
          <Select @update:model-value="addAllowedType">
            <SelectTrigger class="h-9 w-full border-(--app-line) bg-(--app-surface)">
              <SelectValue placeholder="Agregar tipo permitido" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="type in allowedTypeOptions" :key="type.value" :value="type.value">
                {{ type.label }} · {{ type.value }}
              </SelectItem>
            </SelectContent>
          </Select>
          <div class="flex flex-wrap gap-1.5">
            <Badge
              v-for="type in allowedTypes()"
              :key="type"
              variant="secondary"
              class="gap-1 pr-1"
            >
              {{ type }}
              <button type="button" class="rounded-sm p-0.5 hover:bg-(--app-surface)" :aria-label="`Quitar ${type}`" @click="removeAllowedType(type)">
                <X :size="12" />
              </button>
            </Badge>
            <span v-if="allowedTypes().length === 0" class="text-[12.5px] text-(--app-muted)">Sin tipos restringidos.</span>
          </div>
          <Input
            :model-value="allowedTypes().join(', ')"
            placeholder="image/png, image/jpeg"
            @update:model-value="patchList('allowedTypes', $event)"
          />
          <p class="m-0 text-[12px] text-(--app-muted)">Selecciona presets o escribe MIME separados por coma.</p>
        </FieldContent>
      </Field>
    </div>

    <div v-else-if="fieldType === 'textarea' || fieldType === 'richtext'" class="grid gap-3 sm:grid-cols-2">
      <Field>
        <FieldLabel>Max length</FieldLabel>
        <FieldContent><Input type="number" :model-value="valueOf('maxLength', '')" placeholder="500" @update:model-value="patchNumber('maxLength', $event)" /></FieldContent>
      </Field>
      <Field>
        <FieldLabel>Rows</FieldLabel>
        <FieldContent><Input type="number" :model-value="valueOf('rows', '')" placeholder="4" @update:model-value="patchNumber('rows', $event)" /></FieldContent>
      </Field>
    </div>

    <div v-else-if="fieldType === 'select'" class="grid gap-3">
      <Field>
        <FieldLabel>Opciones</FieldLabel>
        <FieldContent class="grid gap-2">
          <div
            v-for="(option, index) in normalizedOptions()"
            :key="index"
            class="grid gap-2 rounded-md border border-(--app-line) p-2 sm:grid-cols-[1fr_1fr_36px]"
          >
            <Field>
              <FieldLabel :for="`select-option-text-${index}`">Texto visible</FieldLabel>
              <FieldContent>
                <Input
                  :id="`select-option-text-${index}`"
                  :model-value="option.text"
                  placeholder="Publicado"
                  @update:model-value="updateOption(index, 'text', $event)"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel :for="`select-option-value-${index}`">Valor guardado</FieldLabel>
              <FieldContent>
                <Input
                  :id="`select-option-value-${index}`"
                  :model-value="option.value"
                  placeholder="publicado"
                  @update:model-value="updateOption(index, 'value', $event)"
                />
              </FieldContent>
            </Field>
            <Button type="button" variant="ghost" size="icon" aria-label="Eliminar opción" @click="removeOption(index)">
              <X :size="14" />
            </Button>
          </div>
          <Button type="button" variant="outline" size="sm" class="w-fit" @click="addOption">
            <Plus :size="14" />
            Agregar opción
          </Button>
          <p class="m-0 text-[12px] text-(--app-muted)">El valor guardado se genera automáticamente en snake_case desde el texto visible. Puedes ajustarlo manualmente.</p>
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel>Valor por defecto</FieldLabel>
        <FieldContent>
          <Select :model-value="valueOf('defaultValue', '')" @update:model-value="patch('defaultValue', $event)">
            <SelectTrigger class="h-9 w-full border-(--app-line) bg-(--app-surface)">
              <SelectValue placeholder="Selecciona valor por defecto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in normalizedOptions().filter((item) => item.value || item.text)" :key="option.value || option.text" :value="option.value || option.text">
                {{ option.text || option.value }}
              </SelectItem>
            </SelectContent>
          </Select>
        </FieldContent>
      </Field>
    </div>

    <div v-else-if="fieldType === 'relation'" class="grid gap-3 sm:grid-cols-2">
      <Field>
        <FieldLabel>Relación</FieldLabel>
        <FieldContent>
          <Select :model-value="valueOf('relation', 'one-to-one')" @update:model-value="patch('relation', $event)">
            <SelectTrigger class="h-9 w-full border-(--app-line) bg-(--app-surface)">
              <SelectValue placeholder="Relación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one-to-one">one-to-one</SelectItem>
              <SelectItem value="one-to-many">one-to-many</SelectItem>
            </SelectContent>
          </Select>
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel>Target</FieldLabel>
        <FieldContent>
          <Input :model-value="valueOf('target', '')" placeholder="users" @update:model-value="patch('target', String($event))" />
          <p class="m-0 text-[12px] text-(--app-muted)">Slug del recurso destino. Ejemplo: users.</p>
        </FieldContent>
      </Field>
    </div>

    <div v-else class="grid gap-3">
      <Field>
        <FieldLabel>Meta JSON</FieldLabel>
        <FieldContent><Textarea v-model="jsonModel" class="min-h-28 font-mono text-xs" /></FieldContent>
      </Field>
    </div>

    <div class="grid gap-3 border-t border-(--app-line) pt-3 sm:grid-cols-2">
      <Field>
        <FieldLabel>Computed</FieldLabel>
        <FieldContent class="flex h-9 items-center gap-2">
          <Switch :model-value="valueOf('computed', false)" @update:model-value="patch('computed', Boolean($event))" />
          <span class="text-[12.5px] text-(--app-muted)">{{ valueOf('computed', false) ? 'Sí' : 'No' }}</span>
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel>Formula</FieldLabel>
        <FieldContent>
          <Input :model-value="valueOf('formula', '')" placeholder="{{title}}-{{id}}" @update:model-value="patch('formula', String($event))" />
          <p class="m-0 text-[12px] text-(--app-muted)">Ejemplo: &#123;&#123;title&#125;&#125;-&#123;&#123;id&#125;&#125; para generar valor calculado.</p>
        </FieldContent>
      </Field>
    </div>
  </section>
</template>
