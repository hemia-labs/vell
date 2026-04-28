<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertCircleIcon, ArrowLeft, CalendarClock, Check, Circle, Eye, FileJson, FolderTree, History, ImagePlus, Link2, Save, Search, SearchCheck, Settings2, SlidersHorizontal } from 'lucide-vue-next'
import { VDropzone } from '@/components/core/dropzone'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useCategories } from '@/composables/categories/useCategories'
import { useContentTypes } from '@/composables/content-types/useContentTypes'
import { CONTENT_MEDIA_ROLES, CONTENT_STATUSES, useContents } from '@/composables/contents/useContents'
import { useTags } from '@/composables/tags/useTags'
import type { ContentStatus, JsonObject } from '@/domain/models/content.model'
import ContentDynamicFields from './components/ContentDynamicFields.vue'
import ContentMediaManager from './components/ContentMediaManager.vue'

const route = useRoute()
const router = useRouter()

const {
  form,
  v$,
  isLoading,
  errorMessage,
  currentContent,
  loadContentById,
  submitCreateContent,
  submitUpdateContent,
  setFieldValue,
  setTagIds,
  addMediaItem,
  updateMediaItem,
  removeMediaItem,
  resetForm
} = useContents()
const { contentTypes, loadContentTypes } = useContentTypes()
const { categories, loadCategories } = useCategories()
const { tags, loadTags } = useTags()

const activeTab = ref('content')
const seoJson = ref('{}')
const configJson = ref('{}')
const isSlugDirty = ref(false)
const tagSearch = ref('')

const contentId = computed(() => String(route.params.id ?? ''))
const mode = computed<'create' | 'edit'>(() => contentId.value ? 'edit' : 'create')
const pageTitle = computed(() => mode.value === 'create' ? 'Nuevo contenido' : 'Editar contenido')
const selectedContentType = computed(() => contentTypes.value.find(type => type.id === form.value.contentTypeId) ?? null)
const isContentTypeSelected = computed(() => Boolean(form.value.contentTypeId))
const selectedCategory = computed(() => categories.value.find(category => category.id === form.value.categoryId) ?? null)
const selectedTags = computed(() => tags.value.filter(tag => form.value.tagIds.includes(tag.id)))
const filteredTags = computed(() => {
  const query = tagSearch.value.trim().toLowerCase()
  if (!query) {
    return tags.value.slice(0, 80)
  }
  return tags.value
    .filter(tag => [tag.name, tag.slug].some(value => value.toLowerCase().includes(query)))
    .slice(0, 80)
})
const completionItems = computed(() => [
  { key: 'draft', label: 'Borrador', done: ['draft', 'published', 'archived'].includes(form.value.status) },
  { key: 'ready', label: 'Contenido', done: Boolean(form.value.title && form.value.contentTypeId) },
  { key: 'publish', label: 'Publicado', done: form.value.status === 'published' }
])

const statusLabels: Record<ContentStatus, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  archived: 'Archivado'
}

const seoImageTypes = ['image/jpeg', 'image/png', 'image/webp']

watch(() => form.value.seo, (value) => {
  seoJson.value = JSON.stringify(value ?? {}, null, 2)
}, { deep: true })

watch(() => form.value.config, (value) => {
  configJson.value = JSON.stringify(value ?? {}, null, 2)
}, { deep: true })

watch(() => form.value.title, (value) => {
  if (mode.value === 'edit' || isSlugDirty.value) {
    return
  }
  form.value.slug = slugify(value)
})

onMounted(async () => {
  resetForm()
  await Promise.all([
    loadContentTypes({ withFields: true }),
    loadCategories(),
    loadTags()
  ])

  if (mode.value === 'edit') {
    await loadContentById(contentId.value)
  }

  seoJson.value = JSON.stringify(form.value.seo ?? {}, null, 2)
  configJson.value = JSON.stringify(form.value.config ?? {}, null, 2)
})

function updateSeo(value: string) {
  seoJson.value = value
  form.value.seo = parseJsonObject(value)
}

function getSeoString(key: string) {
  const value = form.value.seo?.[key]
  return typeof value === 'string' ? value : ''
}

function getSeoBoolean(key: string, fallback = true) {
  const value = form.value.seo?.[key]
  return typeof value === 'boolean' ? value : fallback
}

function getSeoFiles(key: string) {
  const value = form.value.seo?.[key]

  if (Array.isArray(value)) {
    return value.filter((item): item is File => item instanceof File)
  }

  return value instanceof File ? [value] : []
}

function setSeoValue(key: string, value: unknown) {
  form.value.seo = {
    ...(form.value.seo ?? {}),
    [key]: value
  }
}

function updateSeoFiles(key: string, files: File[]) {
  setSeoValue(key, files[0] ?? null)
}

function updateConfig(value: string) {
  configJson.value = value
  form.value.config = parseJsonObject(value)
}

function parseJsonObject(value: string): JsonObject {
  try {
    const parsed = value.trim() ? JSON.parse(value) : {}
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function toggleTag(tagId: string) {
  const current = new Set(form.value.tagIds ?? [])
  if (current.has(tagId)) {
    current.delete(tagId)
  } else {
    current.add(tagId)
  }
  setTagIds([...current])
}

function updateSlug(value: string) {
  isSlugDirty.value = true
  form.value.slug = slugify(value)
}

function selectContentType(contentTypeId: string) {
  if (form.value.contentTypeId !== contentTypeId) {
    form.value.fieldValues = []
  }
  form.value.contentTypeId = contentTypeId
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function openPreview() {
  if (!form.value.slug) {
    return
  }

  const previewPath = selectedContentType.value
    ? `/${selectedContentType.value.slug}/${form.value.slug}`
    : `/${form.value.slug}`
  window.open(previewPath, '_blank', 'noopener,noreferrer')
}

function formatDateTime(value?: string | null) {
  const date = value ? new Date(value) : new Date()
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function submitForm() {
  const result = mode.value === 'create'
    ? await submitCreateContent()
    : await submitUpdateContent(contentId.value)

  if (!result) return
  resetForm()
  router.push({ name: 'contents' })
}

function cancel() {
  resetForm()
  router.push({ name: 'contents' })
}
</script>

<template>
  <div class="flex w-full flex-col gap-5.5">
    <section class="flex items-start justify-between gap-6 max-[760px]:flex-col max-[760px]:items-stretch">
      <div>
        <div class="mb-1 text-3xl font-semibold leading-tight text-(--app-ink)">{{ pageTitle }}</div>
        <p class="m-0 max-w-2xl text-[13.5px] text-(--app-muted)">Selecciona tipo, completa campos dinámicos, SEO, media y configuración.</p>
      </div>
      <Button type="button" variant="outline" size="sm" @click="cancel">
        <ArrowLeft :size="14" />
        Volver
      </Button>
    </section>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <form class="grid gap-5" @submit.prevent="submitForm">
      <div class="grid items-start gap-5 max-[1040px]:grid-cols-1" :class="isContentTypeSelected ? 'grid-cols-[minmax(0,1fr)_320px]' : 'grid-cols-1'">
        <div class="grid min-w-0 gap-5">
          <section class="overflow-hidden rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) shadow-(--app-shadow)">
            <div class="border-b border-(--app-line) bg-(--app-surface-2) px-4 py-3">
              <div class="flex items-center justify-between gap-3 max-[760px]:items-start">
                <div class="flex min-w-0 flex-wrap items-center gap-2">
                  <Badge variant="secondary">{{ selectedContentType?.name ?? 'Sin tipo' }}</Badge>
                  <span class="text-[12px] text-(--app-muted)">
                    {{ isContentTypeSelected ? `${selectedContentType?.fields?.length ?? 0} campos dinámicos` : 'Selecciona el schema antes de capturar contenido' }}
                  </span>
                </div>
                <Button v-if="isContentTypeSelected" type="button" variant="outline" size="sm" class="shrink-0" :disabled="mode === 'create'">
                  <History :size="14" />
                  v{{ selectedContentType?.version ?? 1 }}
                </Button>
              </div>
            </div>

            <div class="grid gap-4 p-4">
              <section v-if="!isContentTypeSelected" class="grid gap-4">
                <div>
                  <div class="text-[22px] font-semibold leading-tight text-(--app-ink)">Elige tipo de contenido</div>
                  <p class="mt-1 max-w-2xl text-[13px] text-(--app-muted)">
                    Los campos del formulario se generan desde el tipo seleccionado.
                  </p>
                </div>

                <div class="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-2 max-[720px]:grid-cols-1">
                  <button
                    v-for="contentType in contentTypes"
                    :key="contentType.id"
                    type="button"
                    class="group grid min-h-44 gap-4 rounded-md border border-(--app-line) bg-(--app-bg) p-4 text-left shadow-sm transition-colors hover:border-(--app-ink) hover:bg-(--app-surface-2)"
                    @click="selectContentType(contentType.id)"
                  >
                    <span class="flex items-start justify-between gap-3">
                      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-(--app-line) bg-(--app-surface) text-(--app-muted) group-hover:text-(--app-ink)">
                        <Settings2 :size="17" />
                      </span>
                      <Badge variant="outline">v{{ contentType.version }}</Badge>
                    </span>
                    <span class="grid gap-1.5">
                      <span class="text-[15px] font-semibold text-(--app-ink)">{{ contentType.name }}</span>
                      <span class="line-clamp-2 min-h-9 text-[12.5px] text-(--app-muted)">{{ contentType.description || 'Sin descripción' }}</span>
                    </span>
                    <span class="mt-auto flex items-center justify-between gap-3">
                      <span class="text-[12px] text-(--app-muted)">{{ contentType.fields?.length ?? 0 }} campos</span>
                      <span class="rounded-md bg-(--app-ink) px-2.5 py-1 text-[12px] font-medium text-(--app-bg)">Continuar</span>
                    </span>
                  </button>
                </div>
              </section>

              <template v-else>
              <Field>
                <FieldLabel for="content-title">Título</FieldLabel>
                <FieldContent>
                  <Input
                    id="content-title"
                    v-model="v$.title.$model"
                    class="h-auto min-h-14 border-0 bg-transparent px-0 py-2 !text-[32px] font-semibold !leading-[1.12] text-(--app-ink) shadow-none placeholder:text-(--app-muted) focus-visible:ring-0 max-[760px]:!text-[28px]"
                    placeholder="Añadir título"
                  />
                  <FieldError :errors="v$.title.$errors.map(error => String(error.$message))" />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Tipo de contenido</FieldLabel>
                <FieldContent>
                  <Select :model-value="form.contentTypeId" @update:model-value="selectContentType(String($event))">
                    <SelectTrigger class="h-10 w-full border-(--app-line) bg-(--app-surface)">
                      <SelectValue placeholder="Selecciona tipo de contenido" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="contentType in contentTypes" :key="contentType.id" :value="contentType.id">
                        {{ contentType.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError :errors="v$.contentTypeId.$errors.map(error => String(error.$message))" />
                </FieldContent>
              </Field>

              <div class="grid grid-cols-3 gap-3 max-[760px]:grid-cols-1">
                <div class="rounded-md border border-(--app-line) bg-(--app-bg) p-3">
                  <div class="text-[11px] uppercase tracking-[0.04em] text-(--app-muted)">Estado</div>
                  <div class="mt-1 font-medium text-(--app-ink)">{{ statusLabels[form.status] }}</div>
                </div>
                <div class="rounded-md border border-(--app-line) bg-(--app-bg) p-3">
                  <div class="text-[11px] uppercase tracking-[0.04em] text-(--app-muted)">Categoría</div>
                  <div class="mt-1 truncate font-medium text-(--app-ink)">{{ selectedCategory?.name ?? 'Sin categoría' }}</div>
                </div>
                <div class="rounded-md border border-(--app-line) bg-(--app-bg) p-3">
                  <div class="text-[11px] uppercase tracking-[0.04em] text-(--app-muted)">Etiquetas</div>
                  <div class="mt-1 font-medium text-(--app-ink)">{{ selectedTags.length }}</div>
                </div>
              </div>
              </template>
            </div>
          </section>

          <Tabs v-if="isContentTypeSelected" v-model="activeTab" class="grid gap-4">
            <TabsList class="h-auto w-full justify-start gap-1 overflow-x-auto rounded-md border border-(--app-line) bg-(--app-surface-2) p-1.5 shadow-(--app-shadow)">
              <TabsTrigger value="content" class="gap-2 data-[state=active]:bg-(--app-ink) data-[state=active]:text-(--app-bg)">
                <FileJson :size="14" />
                Contenido
              </TabsTrigger>
              <TabsTrigger value="seo" class="gap-2 data-[state=active]:bg-(--app-ink) data-[state=active]:text-(--app-bg)">
                <SearchCheck :size="14" />
                SEO
              </TabsTrigger>
              <TabsTrigger value="media" class="gap-2 data-[state=active]:bg-(--app-ink) data-[state=active]:text-(--app-bg)">
                <ImagePlus :size="14" />
                Media
              </TabsTrigger>
              <TabsTrigger value="config" class="gap-2 data-[state=active]:bg-(--app-ink) data-[state=active]:text-(--app-bg)">
                <SlidersHorizontal :size="14" />
                Configuración
              </TabsTrigger>
            </TabsList>

        <TabsContent value="content" class="grid gap-4">
          <section class="grid gap-4 rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) p-4 shadow-(--app-shadow)">
            <div class="grid gap-2">
              <div class="text-[13px] font-medium text-(--app-ink)">Campos del tipo de contenido</div>
              <ContentDynamicFields :fields="selectedContentType?.fields ?? []" :values="form.fieldValues" @update-value="setFieldValue" />
            </div>

            <div class="grid gap-2">
              <div class="flex items-center justify-between gap-3">
                <div class="text-[13px] font-medium text-(--app-ink)">Etiquetas</div>
                <div class="text-[12px] text-(--app-muted)">{{ selectedTags.length }} seleccionadas</div>
              </div>
              <div class="relative">
                <Search class="absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-(--app-muted)" :size="14" />
                <Input v-model="tagSearch" class="h-9 border-(--app-line) bg-(--app-surface) pl-8 text-[13px]" placeholder="Buscar etiquetas" />
              </div>
              <div class="max-h-44 overflow-y-auto rounded-md border border-(--app-line) bg-(--app-bg) p-2">
                <div class="flex flex-wrap gap-2">
                <button
                  v-for="tag in filteredTags"
                  :key="tag.id"
                  type="button"
                  class="rounded-md border px-2.5 py-1 text-[12px] transition-colors"
                  :class="form.tagIds.includes(tag.id) ? 'border-(--app-ink) bg-(--app-ink) text-(--app-bg)' : 'border-(--app-line) bg-(--app-surface-2) text-(--app-muted)'"
                  @click="toggleTag(tag.id)"
                >
                  {{ tag.name }}
                </button>
                <Badge v-if="!tags.length" variant="outline">Sin etiquetas</Badge>
                <Badge v-else-if="!filteredTags.length" variant="outline">Sin resultados</Badge>
                </div>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="seo">
          <section class="grid gap-4 rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) p-4 shadow-(--app-shadow)">
            <div class="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
              <Field>
                <FieldLabel for="content-meta-title">Meta title</FieldLabel>
                <FieldContent>
                  <Input id="content-meta-title" v-model="form.metaTitle" maxlength="255" placeholder="Título para buscadores" />
                  <div class="mt-1 text-[11.5px] text-(--app-muted)">{{ form.metaTitle.length }}/255</div>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel for="content-canonical-url">Canonical URL</FieldLabel>
                <FieldContent>
                  <Input
                    id="content-canonical-url"
                    :model-value="getSeoString('canonicalUrl')"
                    placeholder="https://example.com/contenido"
                    type="url"
                    @update:model-value="setSeoValue('canonicalUrl', String($event))"
                  />
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel for="content-meta-description">Meta description</FieldLabel>
              <FieldContent>
                <Textarea id="content-meta-description" v-model="form.metaDescription" class="min-h-24" maxlength="170" placeholder="Resumen corto para resultados de búsqueda" />
                <div class="mt-1 text-[11.5px] text-(--app-muted)">{{ form.metaDescription.length }}/170</div>
              </FieldContent>
            </Field>

            <div class="grid gap-3 rounded-md border border-(--app-line) bg-(--app-surface) p-3">
              <div class="text-[13px] font-medium text-(--app-ink)">Robots</div>
              <div class="grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
                <label class="flex items-center gap-2 text-[13px] text-(--app-ink)" for="content-seo-index">
                  <Checkbox
                    id="content-seo-index"
                    :checked="getSeoBoolean('index', true)"
                    @update:checked="setSeoValue('index', Boolean($event))"
                  />
                  Indexar página
                </label>
                <label class="flex items-center gap-2 text-[13px] text-(--app-ink)" for="content-seo-follow">
                  <Checkbox
                    id="content-seo-follow"
                    :checked="getSeoBoolean('follow', true)"
                    @update:checked="setSeoValue('follow', Boolean($event))"
                  />
                  Seguir enlaces
                </label>
              </div>
            </div>

            <div class="grid gap-4 rounded-md border border-(--app-line) bg-(--app-surface) p-3">
              <div class="text-[13px] font-semibold text-(--app-ink)">Redes sociales</div>
              <div class="text-[12px] font-medium text-(--app-muted)">Facebook / LinkedIn / WhatsApp / Pinterest</div>
              <div class="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
                <Field>
                  <FieldLabel for="content-og-title">Título social</FieldLabel>
                  <FieldContent>
                    <Input
                      id="content-og-title"
                      :model-value="getSeoString('ogTitle')"
                      placeholder="Título para redes sociales"
                      @update:model-value="setSeoValue('ogTitle', String($event))"
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel for="content-og-type">Tipo de contenido</FieldLabel>
                  <FieldContent>
                    <Select :model-value="getSeoString('ogType') || 'article'" @update:model-value="setSeoValue('ogType', String($event))">
                      <SelectTrigger id="content-og-type" class="h-10 w-full border-(--app-line) bg-(--app-surface)">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="profile">Profile</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
              </div>
              <Field>
                <FieldLabel for="content-og-description">Descripción social</FieldLabel>
                <FieldContent>
                  <Textarea
                    id="content-og-description"
                    :model-value="getSeoString('ogDescription')"
                    class="min-h-20"
                    placeholder="Descripción para compartir"
                    @update:model-value="setSeoValue('ogDescription', String($event))"
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Imagen social</FieldLabel>
                <FieldContent>
                  <VDropzone
                    input-id="content-og-image"
                    :model-value="getSeoFiles('ogImage')"
                    :allowed-types="seoImageTypes"
                    title="Adjuntar imagen social"
                    helper-text="JPG, PNG o WebP"
                    @update:model-value="updateSeoFiles('ogImage', $event)"
                  />
                </FieldContent>
              </Field>
            </div>

            <div class="grid gap-4 rounded-md border border-(--app-line) bg-(--app-surface) p-3">
              <div class="text-[13px] font-medium text-(--app-ink)">Twitter / X</div>
              <div class="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
                <Field>
                  <FieldLabel for="content-twitter-title">Twitter title</FieldLabel>
                  <FieldContent>
                    <Input
                      id="content-twitter-title"
                      :model-value="getSeoString('twitterTitle')"
                      placeholder="Título para Twitter/X"
                      @update:model-value="setSeoValue('twitterTitle', String($event))"
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel for="content-twitter-card">Twitter card</FieldLabel>
                  <FieldContent>
                    <Select :model-value="getSeoString('twitterCard') || 'summary_large_image'" @update:model-value="setSeoValue('twitterCard', String($event))">
                      <SelectTrigger id="content-twitter-card" class="h-10 w-full border-(--app-line) bg-(--app-surface)">
                        <SelectValue placeholder="Card" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="summary_large_image">Summary large image</SelectItem>
                        <SelectItem value="summary">Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>
              </div>
              <Field>
                <FieldLabel for="content-twitter-description">Twitter description</FieldLabel>
                <FieldContent>
                  <Textarea
                    id="content-twitter-description"
                    :model-value="getSeoString('twitterDescription')"
                    class="min-h-20"
                    placeholder="Descripción para Twitter/X"
                    @update:model-value="setSeoValue('twitterDescription', String($event))"
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Twitter image</FieldLabel>
                <FieldContent>
                  <VDropzone
                    input-id="content-twitter-image"
                    :model-value="getSeoFiles('twitterImage')"
                    :allowed-types="seoImageTypes"
                    title="Adjuntar Twitter image"
                    helper-text="JPG, PNG o WebP"
                    @update:model-value="updateSeoFiles('twitterImage', $event)"
                  />
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel for="content-seo-json">Schema / SEO JSON</FieldLabel>
              <FieldContent>
                <Textarea id="content-seo-json" :model-value="seoJson" class="min-h-44 font-mono text-xs" @update:model-value="updateSeo(String($event))" />
              </FieldContent>
            </Field>
          </section>
        </TabsContent>

        <TabsContent value="media">
          <section class="rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) p-4 shadow-(--app-shadow)">
            <ContentMediaManager
              :media-items="form.mediaItems"
              :roles="CONTENT_MEDIA_ROLES"
              @add="addMediaItem('', 'gallery')"
              @update="updateMediaItem"
              @remove="removeMediaItem"
            />
          </section>
        </TabsContent>

        <TabsContent value="config">
          <section class="grid gap-4 rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) p-4 shadow-(--app-shadow)">
            <Field>
              <FieldLabel for="content-body">Body JSON avanzado</FieldLabel>
              <FieldContent>
                <Textarea id="content-body" :model-value="JSON.stringify(form.body ?? {}, null, 2)" class="min-h-36 font-mono text-xs" @update:model-value="form.body = parseJsonObject(String($event))" />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel for="content-config-json">Config JSON</FieldLabel>
              <FieldContent>
                <Textarea id="content-config-json" :model-value="configJson" class="min-h-56 font-mono text-xs" @update:model-value="updateConfig(String($event))" />
              </FieldContent>
            </Field>
          </section>
        </TabsContent>
          </Tabs>
        </div>

        <aside v-if="isContentTypeSelected" class="sticky top-5 grid gap-4 max-[1040px]:static">
          <section class="rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) p-4 shadow-(--app-shadow)">
            <div class="mb-3 flex items-center justify-between gap-3">
              <div class="text-[13px] font-semibold text-(--app-ink)">Publicación</div>
              <Badge :variant="form.status === 'published' ? 'default' : 'secondary'">{{ statusLabels[form.status] }}</Badge>
            </div>

            <div class="mb-4 grid gap-2">
              <div v-for="item in completionItems" :key="item.key" class="flex items-center gap-2 text-[13px]">
                <span class="flex h-5 w-5 items-center justify-center rounded-full border" :class="item.done ? 'border-(--app-ink) bg-(--app-ink) text-(--app-bg)' : 'border-(--app-line) text-(--app-muted)'">
                  <Check v-if="item.done" :size="12" />
                  <Circle v-else :size="9" />
                </span>
                <span :class="item.done ? 'text-(--app-ink)' : 'text-(--app-muted)'">{{ item.label }}</span>
              </div>
            </div>

            <Field>
              <FieldLabel>Estado</FieldLabel>
              <FieldContent>
                <Select v-model="form.status">
                  <SelectTrigger class="h-9 w-full border-(--app-line) bg-(--app-surface)">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="status in CONTENT_STATUSES" :key="status" :value="status">
                      {{ statusLabels[status] }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <div class="mt-4 grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" :disabled="!form.slug" @click="openPreview">
                <Eye :size="14" />
                Preview
              </Button>
              <Button type="submit" :disabled="isLoading">
                <Save :size="14" />
                Guardar
              </Button>
            </div>
          </section>

          <section class="grid gap-4 rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) p-4 shadow-(--app-shadow)">
            <div class="flex items-center gap-2 text-[13px] font-semibold text-(--app-ink)">
              <FileJson :size="15" />
              Datos editoriales
            </div>

            <Field>
              <FieldLabel for="content-slug">Slug</FieldLabel>
              <FieldContent>
                <div class="relative">
                  <Link2 class="absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-(--app-muted)" :size="14" />
                  <Input id="content-slug" :model-value="form.slug" class="pl-8" placeholder="mi-contenido" @update:model-value="updateSlug(String($event))" />
                </div>
                <p class="mt-1 text-[12px] text-(--app-muted)">
                  Se genera automáticamente desde el título. Puedes editarlo manualmente.
                </p>
                <FieldError :errors="v$.slug.$errors.map(error => String(error.$message))" />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Categoría</FieldLabel>
              <FieldContent>
                <div class="relative">
                  <FolderTree class="absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-(--app-muted)" :size="14" />
                  <Select :model-value="form.categoryId ?? 'none'" @update:model-value="form.categoryId = $event === 'none' ? null : String($event)">
                    <SelectTrigger class="h-9 w-full border-(--app-line) bg-(--app-surface) pl-8">
                      <SelectValue placeholder="Sin categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin categoría</SelectItem>
                      <SelectItem v-for="category in categories" :key="category.id" :value="category.id">
                        {{ category.path || category.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel for="content-published-at">Fecha publicación</FieldLabel>
              <FieldContent>
                <div class="relative">
                  <CalendarClock class="absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-(--app-muted)" :size="14" />
                  <Input
                    id="content-published-at"
                    :model-value="form.publishedAt ?? ''"
                    class="pl-8"
                    type="datetime-local"
                    @update:model-value="form.publishedAt = String($event) || null"
                  />
                </div>
              </FieldContent>
            </Field>

            <div class="grid gap-2 text-[12px]">
              <div class="rounded-md border border-(--app-line) bg-(--app-bg) p-2.5">
                <div class="text-(--app-muted)">Creación</div>
                <div class="mt-1 font-medium text-(--app-ink)">{{ formatDateTime(currentContent?.createdAt) }}</div>
              </div>
              <div class="rounded-md border border-(--app-line) bg-(--app-bg) p-2.5">
                <div class="text-(--app-muted)">Actualización</div>
                <div class="mt-1 font-medium text-(--app-ink)">{{ formatDateTime(currentContent?.updatedAt) }}</div>
              </div>
            </div>

            <div class="grid gap-2">
              <div class="text-[12px] font-medium text-(--app-muted)">URL prevista</div>
              <div class="break-all rounded-md border border-(--app-line) bg-(--app-bg) px-3 py-2 font-mono text-[12px] text-(--app-muted)">
                /{{ selectedContentType?.slug ?? 'tipo' }}/{{ form.slug || 'slug' }}
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div v-if="isContentTypeSelected" class="flex justify-end gap-2">
        <Button type="button" variant="outline" :disabled="isLoading" @click="cancel">Cancelar</Button>
        <Button type="submit" :disabled="isLoading">
          <Save :size="14" />
          Guardar
        </Button>
      </div>
    </form>
  </div>
</template>
