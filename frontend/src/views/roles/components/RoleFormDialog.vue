<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue'
import { Check, Plus, RotateCcw, Save, X } from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { usePermissions } from '@/composables/roles/usePermissions'
import { useRoles } from '@/composables/roles/useRoles'
import type { Role } from '@/domain/models/role.model'

const props = defineProps<{
  mode: 'create' | 'edit'
  role?: Role | null
}>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  saved: []
}>()

const { permissions, isLoading: isLoadingPermissions, errorMessage: permissionsErrorMessage, loadPermissions } = usePermissions()
const { createRole, updateRole, isLoading, errorMessage } = useRoles()

const form = reactive({
  name: '',
  slug: '',
  description: '',
  scope: '',
  level: 99,
  permissionIds: [] as string[]
})

const title = computed(() => props.mode === 'create' ? 'Nuevo rol' : 'Editar rol')
const description = computed(() => props.mode === 'create' ? 'Crea rol y asigna permisos.' : 'Actualiza permisos y datos del rol.')
const submitLabel = computed(() => props.mode === 'create' ? 'Crear rol' : 'Guardar cambios')
const isSubmitDisabled = computed(() => {
  return isLoading.value || !form.name.trim() || !form.slug.trim() || form.permissionIds.length === 0
})
const selectedPermissions = computed(() => permissions.value.filter((permission) => form.permissionIds.includes(permission.id)))
const selectedPermissionsLabel = computed(() => {
  if (selectedPermissions.value.length === 0) return 'Selecciona permisos'
  return `${selectedPermissions.value.length} permisos seleccionados`
})
const visibleSelectedPermissions = computed(() => selectedPermissions.value.slice(0, 8))
const hiddenSelectedPermissionsCount = computed(() => Math.max(selectedPermissions.value.length - visibleSelectedPermissions.value.length, 0))

watch(() => form.name, (name) => {
  if (props.mode === 'create') {
    form.slug = toSlug(name)
  }
})

watch(
  () => [open.value, props.role?.id] as const,
  ([isOpen]) => {
    if (!isOpen) {
      resetForm()
      return
    }

    if (permissions.value.length === 0) {
      loadPermissions()
    }

    fillForm()
  }
)

onMounted(() => {
  if (open.value) {
    loadPermissions()
    fillForm()
  }
})

function fillForm() {
  if (props.mode === 'edit' && props.role) {
    form.name = props.role.name
    form.slug = props.role.slug
    form.description = props.role.description ?? ''
    form.scope = props.role.scope ?? ''
    form.level = props.role.level ?? 99
    form.permissionIds = props.role.permissions.map((permission) => permission.id)
    return
  }

  resetForm()
}

function resetForm() {
  form.name = ''
  form.slug = ''
  form.description = ''
  form.scope = ''
  form.level = 99
  form.permissionIds = []
}

function toSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function removePermission(permissionId: string) {
  form.permissionIds = form.permissionIds.filter((id) => id !== permissionId)
}

async function submitForm() {
  if (isSubmitDisabled.value) {
    return
  }

  const payload = {
    name: form.name.trim(),
    slug: form.slug.trim(),
    description: form.description.trim() || undefined,
    scope: form.scope.trim() || undefined,
    level: Number(form.level) || 99,
    permissionIds: form.permissionIds
  }
  const result = props.mode === 'create'
    ? await createRole(payload)
    : props.role
      ? await updateRole(props.role.id, payload)
      : null

  if (!result) {
    return
  }

  emit('saved')
  open.value = false
  resetForm()
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>

      <form class="grid gap-4" @submit.prevent="submitForm">
        <Alert v-if="errorMessage || permissionsErrorMessage" variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{{ errorMessage || permissionsErrorMessage }}</AlertDescription>
        </Alert>

        <div class="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel for="role-name">Nombre</FieldLabel>
            <FieldContent>
              <Input id="role-name" v-model="form.name" placeholder="Editor" />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel for="role-slug">Slug</FieldLabel>
            <FieldContent>
              <Input id="role-slug" v-model="form.slug" placeholder="editor" />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel for="role-scope">Alcance</FieldLabel>
            <FieldContent>
              <Input id="role-scope" v-model="form.scope" placeholder="Editor de contenido" />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel for="role-level">Nivel</FieldLabel>
            <FieldContent>
              <Input id="role-level" v-model.number="form.level" type="number" min="0" placeholder="99" />
            </FieldContent>
          </Field>
        </div>

        <Field>
          <FieldLabel for="role-description">Descripción</FieldLabel>
          <FieldContent>
            <Textarea id="role-description" v-model="form.description" class="min-h-20" placeholder="Qué acceso representa este rol" />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel>Permisos</FieldLabel>
          <FieldContent class="grid min-w-0 gap-2">
            <Select v-model="form.permissionIds" multiple :disabled="isLoadingPermissions || permissions.length === 0">
              <SelectTrigger class="h-9 w-full min-w-0 border-(--app-line) bg-(--app-surface)">
                <SelectValue :placeholder="isLoadingPermissions ? 'Cargando permisos...' : selectedPermissionsLabel" />
              </SelectTrigger>
              <SelectContent class="max-h-80 max-w-[min(560px,calc(100vw-2rem))]">
                <SelectItem
                  v-for="permission in permissions"
                  :key="permission.id"
                  :value="permission.id"
                  :class="form.permissionIds.includes(permission.id) ? 'bg-(--app-surface-2) font-medium text-(--app-ink)' : ''"
                >
                  <span class="flex min-w-0 items-center gap-2">
                    <Check
                      :size="14"
                      class="shrink-0"
                      :class="form.permissionIds.includes(permission.id) ? 'opacity-100' : 'opacity-0'"
                    />
                    <span class="truncate">{{ permission.slug }}</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <div class="min-h-8 rounded-md border border-(--app-line) bg-(--app-surface-2) p-2">
              <div v-if="visibleSelectedPermissions.length" class="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto pr-1">
                <Badge
                  v-for="permission in visibleSelectedPermissions"
                  :key="permission.id"
                  variant="secondary"
                  class="max-w-full gap-1 pr-1"
                >
                  <span class="max-w-[180px] truncate">{{ permission.slug }}</span>
                  <button type="button" class="rounded-sm p-0.5 hover:bg-(--app-surface)" :aria-label="`Quitar ${permission.slug}`" @click="removePermission(permission.id)">
                    <X :size="12" />
                  </button>
                </Badge>
                <Badge v-if="hiddenSelectedPermissionsCount" variant="outline">
                  +{{ hiddenSelectedPermissionsCount }} más
                </Badge>
              </div>
              <span v-else class="text-[12.5px] text-(--app-muted)">Sin permisos seleccionados.</span>
            </div>
          </FieldContent>
        </Field>

        <DialogFooter>
          <Button type="button" variant="outline" :disabled="isLoading" @click="resetForm">
            <RotateCcw :size="14" />
            Limpiar
          </Button>
          <Button type="submit" :disabled="isSubmitDisabled">
            <component :is="mode === 'create' ? Plus : Save" :size="14" />
            {{ submitLabel }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
