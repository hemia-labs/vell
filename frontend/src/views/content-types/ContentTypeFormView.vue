<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useContentTypes } from '@/composables/content-types/useContentTypes'
import ContentTypeFormEditor from './components/ContentTypeFormEditor.vue'

const route = useRoute()
const router = useRouter()
const {
  form,
  v$,
  isLoading,
  errorMessage,
  loadContentTypeById,
  submitCreateContentType,
  submitUpdateContentType,
  addField,
  updateField,
  removeField,
  moveField,
  resetForm
} = useContentTypes()

const contentTypeId = computed(() => String(route.params.id ?? ''))
const mode = computed<'create' | 'edit'>(() => contentTypeId.value ? 'edit' : 'create')
const pageTitle = computed(() => mode.value === 'create' ? 'Nuevo tipo de contenido' : 'Editar tipo de contenido')

onMounted(async () => {
  resetForm()

  if (mode.value === 'edit') {
    await loadContentTypeById(contentTypeId.value)
  }
})

async function submitForm() {
  const result = mode.value === 'create'
    ? await submitCreateContentType()
    : await submitUpdateContentType(contentTypeId.value)

  if (!result) {
    return
  }

  resetForm()
  router.push({ name: 'content-types' })
}

function cancel() {
  resetForm()
  router.push({ name: 'content-types' })
}
</script>

<template>
  <div class="flex w-full flex-col gap-5.5">
    <section class="flex items-start justify-between gap-6 max-[760px]:flex-col max-[760px]:items-stretch">
      <div>
        <div class="mb-1 text-3xl font-semibold leading-tight text-(--app-ink)">
          {{ pageTitle }}
        </div>
        <p class="m-0 max-w-2xl text-[13.5px] text-(--app-muted)">
          Configura schema, campos y metadata del tipo de contenido.
        </p>
      </div>

      <Button type="button" variant="outline" size="sm" @click="cancel">
        <ArrowLeft :size="14" />
        Volver
      </Button>
    </section>

    <Alert v-if="mode === 'edit' && errorMessage" variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <ContentTypeFormEditor
      :mode="mode"
      :form="form"
      :validator="v$"
      :is-loading="isLoading"
      :error-message="errorMessage"
      @submit="submitForm"
      @reset="resetForm"
      @add-field="addField"
      @update-field="updateField"
      @remove-field="removeField"
      @move-field="moveField"
    />
  </div>
</template>
