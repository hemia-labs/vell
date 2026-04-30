<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { AlertCircleIcon, CheckCircle2, Eye, EyeOff, Lock, RefreshCw, Save } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { Setting, SettingGroup, SettingValue } from '@/domain/models/setting.model'
import { useAuthorization } from '@/composables/auth/useAuthorization'
import { useSettings } from '@/composables/settings/useSettings'

const GROUPS: Array<{ key: SettingGroup, label: string }> = [
  { key: 'general', label: 'General' },
  { key: 'content', label: 'Contenido' },
  { key: 'seo', label: 'SEO' },
  { key: 'mail', label: 'Mail' },
  { key: 'system', label: 'Sistema' },
]

const MASKED_SECRET = '********'

const {
  settings,
  byGroup,
  isLoading,
  isSaving,
  errorMessage,
  savedMessage,
  loadSettings,
  updateSetting,
  clearMessages
} = useSettings()
const { can } = useAuthorization()

const activeGroup = ref<SettingGroup>('general')
const drafts = reactive<Record<string, string | number | boolean>>({})
const jsonErrors = reactive<Record<string, string>>({})

const visibleGroups = computed(() => GROUPS.filter((group) => (byGroup.value[group.key] ?? []).length > 0))
const activeSettings = computed(() => byGroup.value[activeGroup.value] ?? [])
const canEditSettings = computed(() => can('settings:edit'))

watch(settings, (items) => {
  for (const setting of items) {
    drafts[setting.key] = toDraft(setting)
  }
}, { immediate: true })

watch(visibleGroups, (groups) => {
  if (groups.length > 0 && !groups.some((group) => group.key === activeGroup.value)) {
    activeGroup.value = groups[0].key
  }
})

function toDraft(setting: Setting): string | number | boolean {
  if (setting.type === 'boolean') {
    return Boolean(setting.value)
  }

  if (setting.type === 'number') {
    return typeof setting.value === 'number' ? setting.value : ''
  }

  if (setting.type === 'array') {
    return Array.isArray(setting.value) ? setting.value.join(', ') : ''
  }

  if (setting.type === 'json') {
    return setting.value ? JSON.stringify(setting.value, null, 2) : '{}'
  }

  return typeof setting.value === 'string' ? setting.value : ''
}

function parseValue(setting: Setting): SettingValue {
  const draft = drafts[setting.key]
  jsonErrors[setting.key] = ''

  if (setting.type === 'boolean') {
    return Boolean(draft)
  }

  if (setting.type === 'number') {
    if (draft === '' || draft === null || draft === undefined) {
      return null
    }
    return Number(draft)
  }

  if (setting.type === 'array') {
    if (typeof draft !== 'string') {
      return []
    }
    return draft.split(',').map((item) => item.trim()).filter(Boolean)
  }

  if (setting.type === 'json') {
    try {
      return JSON.parse(String(draft || '{}')) as Record<string, unknown>
    } catch {
      jsonErrors[setting.key] = 'JSON inválido'
      return null
    }
  }

  const text = String(draft ?? '').trim()
  return text === '' ? null : text
}

function isSecret(setting: Setting) {
  return /(password|secret|token|api_key|private_key)/i.test(setting.key)
}

function draftText(key: string): string | number {
  const value = drafts[key]
  return typeof value === 'boolean' ? '' : value
}

function setDraft(key: string, value: string | number) {
  drafts[key] = value
}

function hasChanged(setting: Setting) {
  if (isSecret(setting) && drafts[setting.key] === MASKED_SECRET) {
    return false
  }

  return JSON.stringify(parseValue(setting)) !== JSON.stringify(setting.value)
}

async function saveSetting(setting: Setting) {
  if (setting.isReadonly || !canEditSettings.value) {
    return
  }

  const value = parseValue(setting)
  if (jsonErrors[setting.key]) {
    return
  }

  await updateSetting(setting.key, value)
}

async function loadAll() {
  clearMessages()
  await loadSettings()
}

onMounted(loadAll)
</script>

<template>
  <div class="flex w-full flex-col gap-5.5">
    <section class="flex items-start justify-between gap-6 max-[760px]:flex-col max-[760px]:items-stretch">
      <div>
        <div class="mb-1 text-3xl font-semibold leading-tight text-(--app-ink)">
          Ajustes
        </div>
        <p class="m-0 max-w-2xl text-[13.5px] text-(--app-muted)">
          Configuración global del CMS por grupos y valores tipados.
        </p>
      </div>

      <Button variant="outline" size="sm" :disabled="isLoading" @click="loadAll">
        <RefreshCw :size="14" :class="{ 'animate-spin': isLoading }" />
        Actualizar
      </Button>
    </section>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <Alert v-if="savedMessage">
      <CheckCircle2 />
      <AlertTitle>Guardado</AlertTitle>
      <AlertDescription>{{ savedMessage }}</AlertDescription>
    </Alert>

    <section class="flex flex-wrap gap-2" aria-label="Grupos de ajustes">
      <Button
        v-for="group in visibleGroups"
        :key="group.key"
        type="button"
        size="sm"
        :variant="activeGroup === group.key ? 'default' : 'outline'"
        @click="activeGroup = group.key"
      >
        {{ group.label }}
      </Button>
    </section>

    <section class="overflow-hidden rounded-(--app-radius-lg) border border-(--app-line) bg-(--app-surface) shadow-(--app-shadow)" aria-label="Lista de ajustes">
      <div v-if="isLoading" class="px-4 py-8 text-center text-[13px] text-(--app-muted)">
        Cargando ajustes...
      </div>

      <div v-else-if="activeSettings.length === 0" class="px-4 py-8 text-center text-[13px] text-(--app-muted)">
        No hay ajustes para este grupo.
      </div>

      <div v-else class="divide-y divide-(--app-line)">
        <div
          v-for="setting in activeSettings"
          :key="setting.key"
          class="grid grid-cols-[minmax(220px,0.8fr)_minmax(260px,1fr)_auto] gap-4 px-4 py-4 max-[900px]:grid-cols-1"
        >
          <div class="min-w-0">
            <div class="flex min-w-0 flex-wrap items-center gap-2">
              <span class="truncate text-[13.5px] font-medium text-(--app-ink)">{{ setting.key }}</span>
              <Badge variant="outline">{{ setting.type }}</Badge>
              <Badge v-if="setting.isPublic" variant="secondary">
                <Eye :size="12" />
                público
              </Badge>
              <Badge v-else variant="outline">
                <EyeOff :size="12" />
                privado
              </Badge>
              <Badge v-if="setting.isReadonly" variant="outline">
                <Lock :size="12" />
                readonly
              </Badge>
            </div>
            <p v-if="setting.description" class="mt-1 m-0 text-[12.5px] leading-5 text-(--app-muted)">
              {{ setting.description }}
            </p>
          </div>

          <Field class="min-w-0">
            <FieldLabel class="sr-only" :for="`setting-${setting.key}`">{{ setting.key }}</FieldLabel>
            <FieldContent>
              <Switch
                v-if="setting.type === 'boolean'"
                :id="`setting-${setting.key}`"
                :model-value="Boolean(drafts[setting.key])"
                :disabled="setting.isReadonly || !canEditSettings"
                @update:model-value="drafts[setting.key] = Boolean($event)"
              />

              <Textarea
                v-else-if="setting.type === 'json'"
                :id="`setting-${setting.key}`"
                :model-value="draftText(setting.key)"
                @update:model-value="setDraft(setting.key, $event)"
                class="min-h-35 border-(--app-line) bg-(--app-surface) font-mono text-[12.5px]"
                :disabled="setting.isReadonly || !canEditSettings"
              />

              <Textarea
                v-else-if="setting.key === 'robots_txt'"
                :id="`setting-${setting.key}`"
                :model-value="draftText(setting.key)"
                @update:model-value="setDraft(setting.key, $event)"
                class="min-h-28 border-(--app-line) bg-(--app-surface) font-mono text-[12.5px]"
                :disabled="setting.isReadonly || !canEditSettings"
              />

              <Input
                v-else
                :id="`setting-${setting.key}`"
                :model-value="draftText(setting.key)"
                @update:model-value="setDraft(setting.key, $event)"
                :type="setting.type === 'number' ? 'number' : isSecret(setting) ? 'password' : 'text'"
                class="h-9 border-(--app-line) bg-(--app-surface) text-[13px] text-(--app-ink)"
                :placeholder="setting.type === 'array' ? 'es, en, fr' : setting.type === 'image' ? 'https://cdn.../logo.png' : undefined"
                :disabled="setting.isReadonly || !canEditSettings"
              />

              <FieldDescription v-if="setting.type === 'array'">
                Separa valores con coma.
              </FieldDescription>
              <FieldDescription v-if="setting.type === 'image'">
                URL pública de imagen. Media Picker puede conectarse aquí después.
              </FieldDescription>
              <FieldDescription v-if="jsonErrors[setting.key]" class="text-destructive">
                {{ jsonErrors[setting.key] }}
              </FieldDescription>
            </FieldContent>
          </Field>

          <div class="flex items-start justify-end max-[900px]:justify-start">
            <Button
              type="button"
              size="sm"
              :disabled="setting.isReadonly || !canEditSettings || isSaving || !hasChanged(setting)"
              @click="saveSetting(setting)"
            >
              <Save :size="14" />
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
