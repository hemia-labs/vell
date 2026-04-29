<script setup lang="ts">
import { computed, ref } from 'vue'
import { AlertTriangle, Check, Loader2, Plus, Search, X } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CreateTag, Tag } from '@/domain/models/tag.model'

const props = withDefaults(defineProps<{
  tags: Tag[]
  modelValue: string[]
  createTag?: (payload: CreateTag) => Promise<Tag | null>
  label?: string
  placeholder?: string
  maxResults?: number
  disabled?: boolean
}>(), {
  label: 'Etiquetas',
  placeholder: 'Buscar o crear etiqueta',
  maxResults: 80,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [tagIds: string[]]
  created: [tag: Tag]
}>()

const search = ref('')
const isCreating = ref(false)
const errorMessage = ref('')

const selectedIds = computed(() => new Set(props.modelValue))
const selectedTags = computed(() => props.tags.filter(tag => selectedIds.value.has(tag.id)))
const query = computed(() => search.value.trim())
const querySlug = computed(() => toTagSlug(query.value))
const queryKey = computed(() => toComparableKey(query.value))

const exactMatch = computed(() => {
  if (!queryKey.value) {
    return null
  }

  return props.tags.find(tag => toComparableKey(tag.name) === queryKey.value || toComparableKey(tag.slug) === queryKey.value) ?? null
})

const similarTags = computed(() => {
  if (queryKey.value.length < 4) {
    return []
  }

  return props.tags
    .filter(tag => tag.id !== exactMatch.value?.id && isSimilarTag(queryKey.value, tag))
    .slice(0, 4)
})

const filteredTags = computed(() => {
  if (!query.value) {
    return []
  }

  const normalizedQuery = normalizeText(query.value)

  return props.tags
    .filter(tag => [tag.name, tag.slug].some(value => normalizeText(value).includes(normalizedQuery)))
    .slice(0, props.maxResults)
})

const availableTags = computed(() => filteredTags.value.filter(tag => !selectedIds.value.has(tag.id)))

const canCreate = computed(() => {
  return Boolean(props.createTag && query.value && querySlug.value && !exactMatch.value && !props.disabled)
})

function toggleTag(tagId: string) {
  if (props.disabled) {
    return
  }

  const next = new Set(props.modelValue)

  if (next.has(tagId)) {
    next.delete(tagId)
  } else {
    next.add(tagId)
  }

  emit('update:modelValue', [...next])
}

async function createFromQuery() {
  if (!canCreate.value || !props.createTag) {
    return
  }

  isCreating.value = true
  errorMessage.value = ''

  try {
    const tag = await props.createTag({
      name: query.value,
      slug: querySlug.value
    })

    if (!tag) {
      errorMessage.value = 'No se pudo crear la etiqueta.'
      return
    }

    emit('created', tag)
    emit('update:modelValue', Array.from(new Set([...props.modelValue, tag.id])))
    search.value = ''
  } catch {
    errorMessage.value = 'No se pudo crear la etiqueta.'
  } finally {
    isCreating.value = false
  }
}

function selectSimilar(tagId: string) {
  toggleTag(tagId)
  search.value = ''
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function toComparableKey(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]/g, '')
}

function toTagSlug(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function isSimilarTag(targetKey: string, tag: Tag) {
  const tagKey = toComparableKey(tag.name)

  if (!tagKey) {
    return false
  }

  if (targetKey.includes(tagKey) || tagKey.includes(targetKey)) {
    return Math.abs(targetKey.length - tagKey.length) <= 2
  }

  const maxDistance = Math.max(1, Math.floor(Math.max(targetKey.length, tagKey.length) * 0.25))
  return levenshteinDistance(targetKey, tagKey) <= maxDistance
}

function levenshteinDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  const current = Array.from({ length: right.length + 1 }, () => 0)

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
      )
    }

    previous.splice(0, previous.length, ...current)
  }

  return previous[right.length]
}
</script>

<template>
  <div class="grid gap-2">
    <div class="flex items-center justify-between gap-3">
      <div class="text-[13px] font-medium text-(--app-ink)">{{ label }}</div>
      <div class="text-[12px] text-(--app-muted)">{{ selectedTags.length }} seleccionadas</div>
    </div>

    <div class="rounded-md border border-(--app-line) bg-(--app-bg) p-2.5">
      <div v-if="selectedTags.length" class="flex flex-wrap gap-2">
        <button
          v-for="tag in selectedTags"
          :key="tag.id"
          type="button"
          class="inline-flex h-7 max-w-full items-center gap-1.5 rounded-md border border-(--app-ink) bg-(--app-ink) px-2.5 text-[12px] font-medium text-(--app-bg) transition-opacity disabled:opacity-60"
          :disabled="disabled"
          @click="toggleTag(tag.id)"
        >
          <span class="truncate">{{ tag.name }}</span>
          <X class="shrink-0" :size="12" />
        </button>
      </div>
      <div v-else class="text-[12px] text-(--app-muted)">Sin etiquetas seleccionadas</div>
    </div>

    <div class="grid gap-2 rounded-md border border-(--app-line) bg-(--app-surface-2) p-2.5">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-(--app-muted)" :size="14" />
        <Input
	        v-model="search"
	        class="h-9 border-(--app-line) bg-(--app-surface) pl-8 pr-8 text-[13px]"
	        :disabled="disabled"
	        maxlength="100"
	        :placeholder="placeholder"
	      />
        <button
          v-if="search"
          type="button"
          class="absolute right-2 top-1/2 z-[1] inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-(--app-muted) transition-colors hover:bg-(--app-bg) hover:text-(--app-ink)"
          :disabled="disabled"
          aria-label="Limpiar búsqueda"
          @click="search = ''"
        >
          <X :size="13" />
        </button>
      </div>

      <div v-if="exactMatch" class="flex items-center gap-2 rounded-md border border-(--app-line) bg-(--app-bg) px-3 py-2 text-[12px] text-(--app-muted)">
        <Check :size="14" />
        <span class="min-w-0 flex-1 truncate">Ya existe: {{ exactMatch.name }}</span>
        <Button size="sm" variant="ghost" class="h-7 px-2 text-[12px]" :disabled="disabled" @click="selectSimilar(exactMatch.id)">
          Usar
        </Button>
      </div>

      <div v-else-if="similarTags.length" class="grid gap-2 rounded-md border border-amber-300/70 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
        <div class="flex items-center gap-2 font-medium">
          <AlertTriangle :size="14" />
          Posibles duplicados
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tag in similarTags"
            :key="tag.id"
            type="button"
            class="max-w-full rounded-md border border-amber-300 bg-white px-2.5 py-1 text-[12px] text-amber-950 transition-colors hover:bg-amber-100 disabled:opacity-60"
            :disabled="disabled"
            @click="selectSimilar(tag.id)"
          >
            <span class="block truncate">{{ tag.name }}</span>
          </button>
        </div>
      </div>

      <div v-if="canCreate" class="flex items-center justify-between gap-3 rounded-md border border-(--app-line) bg-(--app-bg) px-3 py-2">
        <div class="min-w-0">
          <div class="truncate text-[12px] font-medium text-(--app-ink)">Crear "{{ query }}"</div>
          <div class="truncate text-[11px] text-(--app-muted)">#{{ querySlug }}</div>
        </div>
        <Button size="sm" class="h-8 shrink-0" :disabled="isCreating" @click="createFromQuery">
          <Loader2 v-if="isCreating" class="animate-spin" :size="14" />
          <Plus v-else :size="14" />
          Crear
        </Button>
      </div>

      <div v-if="query && availableTags.length" class="flex flex-wrap gap-2 rounded-md border border-(--app-line) bg-(--app-bg) p-2">
        <button
          v-for="tag in availableTags"
          :key="tag.id"
          type="button"
          class="max-w-full rounded-md border border-(--app-line) bg-(--app-surface) px-2.5 py-1 text-[12px] text-(--app-muted) transition-colors hover:border-(--app-ink) hover:text-(--app-ink) disabled:opacity-60"
          :disabled="disabled"
          @click="toggleTag(tag.id)"
        >
          <span class="block truncate">{{ tag.name }}</span>
        </button>
      </div>
    </div>

    <div v-if="errorMessage" class="text-[12px] text-destructive">{{ errorMessage }}</div>
  </div>
</template>
