<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useRoles } from '@/composables/roles/useRoles'
import { useUserAdministration } from '@/composables/users/useUserAdministration'

const props = defineProps<{
  userId: string | null
}>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  updated: []
}>()

const { roles, isLoading: isLoadingRoles, errorMessage: rolesErrorMessage, loadRoles } = useRoles()
const {
  updateForm,
  vUpdate$,
  loadUserById,
  submitUpdateUser,
  resetUpdateUserForm,
  isLoading,
  errorMessage
} = useUserAdministration()

const selectedRoles = computed(() => roles.value.filter((role) => updateForm.value.roles.includes(role.id)))
const selectedRolesLabel = computed(() => {
  if (selectedRoles.value.length === 0) {
    return 'Selecciona uno o más roles'
  }

  if (selectedRoles.value.length === 1) {
    return selectedRoles.value[0].name
  }

  return `${selectedRoles.value[0].name} +${selectedRoles.value.length - 1}`
})
const isSubmitDisabled = computed(() => isLoading.value || vUpdate$.value.$invalid || !props.userId)

async function loadUser() {
  if (!props.userId) {
    return
  }

  if (roles.value.length === 0) {
    loadRoles()
  }

  await loadUserById(props.userId)
}

async function submitForm() {
  if (!props.userId) {
    return
  }

  const updatedUser = await submitUpdateUser(props.userId)

  if (!updatedUser) {
    return
  }

  emit('updated')
  open.value = false
  resetUpdateUserForm()
}

watch(
  () => [open.value, props.userId] as const,
  ([isOpen]) => {
    if (isOpen) {
      loadUser()
      return
    }

    resetUpdateUserForm()
  }
)

onMounted(() => {
  if (open.value) {
    loadUser()
  }
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>Editar usuario</DialogTitle>
        <DialogDescription>
          Actualiza datos, roles y estado del usuario.
        </DialogDescription>
      </DialogHeader>

      <form class="grid gap-4" @submit.prevent="submitForm">
        <Alert v-if="errorMessage || rolesErrorMessage" variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{{ errorMessage || rolesErrorMessage }}</AlertDescription>
        </Alert>

        <div class="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel for="update-user-name">Nombre</FieldLabel>
            <FieldContent>
              <Input
                id="update-user-name"
                v-model="vUpdate$.name.$model"
                autocomplete="name"
                placeholder="Nombre completo"
              />
              <FieldError :errors="vUpdate$.name.$errors.map((error) => String(error.$message))" />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel for="update-user-email">Correo</FieldLabel>
            <FieldContent>
              <Input
                id="update-user-email"
                v-model="vUpdate$.email.$model"
                autocomplete="email"
                placeholder="correo@dominio.com"
                type="email"
              />
              <FieldError :errors="vUpdate$.email.$errors.map((error) => String(error.$message))" />
            </FieldContent>
          </Field>
        </div>

        <Field>
          <FieldLabel>Roles</FieldLabel>
          <FieldContent>
            <Select v-model="vUpdate$.roles.$model" multiple :disabled="isLoadingRoles || roles.length === 0">
              <SelectTrigger class="h-9 w-full border-(--app-line) bg-(--app-surface)">
                <SelectValue :placeholder="isLoadingRoles ? 'Cargando roles...' : selectedRolesLabel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="role in roles"
                  :key="role.id"
                  :value="role.id"
                >
                  {{ role.name }}
                </SelectItem>
              </SelectContent>
            </Select>
            <FieldError :errors="vUpdate$.roles.$errors.map((error) => String(error.$message))" />
          </FieldContent>
        </Field>

        <Field>
          <FieldContent class="grid grid-cols-[1fr_auto] items-center gap-4 rounded-(--app-radius-sm) border border-(--app-line) bg-(--app-surface-2) px-3.5 py-3">
            <div class="min-w-0 space-y-1">
              <div class="flex min-w-0 items-center gap-2">
                <FieldLabel for="update-user-active" class="text-[13px] font-semibold leading-none text-(--app-ink)">
                  Usuario activo
                </FieldLabel>
                <span
                  class="rounded-full border px-2 py-0.5 text-[10.5px] font-semibold leading-none"
                  :class="updateForm.isActive
                    ? 'border-[#b9d8c6] bg-[#e8f2ec] text-[#1f7a4c]'
                    : 'border-[#e0c4c4] bg-[#f4e5e5] text-[#8b2f2f]'"
                >
                  {{ updateForm.isActive ? 'Activo' : 'Suspendido' }}
                </span>
              </div>
              <p class="m-0 max-w-90 text-[12px] leading-snug text-(--app-muted)">
                {{ updateForm.isActive ? 'El usuario conserva acceso al panel y puede iniciar sesión.' : 'El usuario no podrá iniciar sesión ni operar dentro del panel.' }}
              </p>
            </div>
            <div class="flex h-full min-h-10 shrink-0 items-center border-l border-(--app-line) pl-4">
              <Switch id="update-user-active" v-model="vUpdate$.isActive.$model" />
            </div>
          </FieldContent>
        </Field>

        <DialogFooter>
          <Button type="button" variant="outline" :disabled="isLoading" @click="open = false">
            Cancelar
          </Button>
          <Button type="submit" :disabled="isSubmitDisabled">
            <Save :size="14" />
            Guardar cambios
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
