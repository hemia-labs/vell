<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { KeyRound, Plus, RotateCcw } from 'lucide-vue-next'
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
import { useRoles } from '@/composables/roles/useRoles'
import { useUserAdministration } from '@/composables/users/useUserAdministration'
import { generatePassword as createRandomPassword } from '@/lib/password'

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  created: []
}>()

const { roles, isLoading: isLoadingRoles, errorMessage: rolesErrorMessage, loadRoles } = useRoles()
const {
  form,
  v$,
  submitCreateUser,
  resetCreateUserForm,
  isLoading: isCreating,
  errorMessage: createErrorMessage
} = useUserAdministration()

const isSubmitDisabled = computed(() => {
  return isCreating.value || v$.value.$invalid
})
const selectedRoles = computed(() => roles.value.filter((role) => form.value.roles.includes(role.id)))
const selectedRolesLabel = computed(() => {
  if (selectedRoles.value.length === 0) {
    return 'Selecciona uno o más roles'
  }

  if (selectedRoles.value.length === 1) {
    return selectedRoles.value[0].name
  }

  return `${selectedRoles.value[0].name} +${selectedRoles.value.length - 1}`
})

function generatePassword() {
  v$.value.password.$model = createRandomPassword()
}

async function submitForm() {
  const createdUser = await submitCreateUser()

  if (!createdUser) {
    return
  }

  emit('created')
  open.value = false
  resetCreateUserForm()
}

watch(open, (isOpen) => {
  if (isOpen && roles.value.length === 0) {
    loadRoles()
  }

  if (!isOpen) {
    resetCreateUserForm()
  }
})

onMounted(() => {
  if (open.value) {
    loadRoles()
  }
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>Nuevo usuario</DialogTitle>
        <DialogDescription>
          Crea usuario y asigna roles iniciales.
        </DialogDescription>
      </DialogHeader>

      <form class="grid gap-4" @submit.prevent="submitForm">
        <Alert v-if="createErrorMessage || rolesErrorMessage" variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {{ createErrorMessage || rolesErrorMessage }}
          </AlertDescription>
        </Alert>

        <div class="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel for="create-user-name">Nombre</FieldLabel>
            <FieldContent>
              <Input
                id="create-user-name"
                v-model="v$.name.$model"
                autocomplete="name"
                placeholder="Nombre completo"
              />
              <FieldError :errors="v$.name.$errors.map((error) => String(error.$message))" />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel for="create-user-email">Correo</FieldLabel>
            <FieldContent>
              <Input
                id="create-user-email"
                v-model="v$.email.$model"
                autocomplete="email"
                placeholder="correo@dominio.com"
                type="email"
              />
              <FieldError :errors="v$.email.$errors.map((error) => String(error.$message))" />
            </FieldContent>
          </Field>
        </div>

        <Field>
          <FieldLabel for="create-user-password">Contraseña</FieldLabel>
          <FieldContent class="grid gap-1.5">
            <div class="flex items-center gap-2">
              <Input
                id="create-user-password"
                v-model="v$.password.$model"
                class="min-w-0 flex-1"
                autocomplete="new-password"
                placeholder="Contraseña temporal"
                type="text"
              />
              <Button type="button" variant="outline" class="h-9 shrink-0" @click="generatePassword">
                <KeyRound :size="14" />
                Generar
              </Button>
            </div>
            <FieldError :errors="v$.password.$errors.map((error) => String(error.$message))" />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel>Roles</FieldLabel>
          <FieldContent>
            <Select v-model="v$.roles.$model" multiple :disabled="isLoadingRoles || roles.length === 0">
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
            <FieldError :errors="v$.roles.$errors.map((error) => String(error.$message))" />
          </FieldContent>
        </Field>

        <DialogFooter>
          <Button type="button" variant="outline" :disabled="isCreating" @click="resetCreateUserForm">
            <RotateCcw :size="14" />
            Limpiar
          </Button>
          <Button type="submit" :disabled="isSubmitDisabled">
            <Plus :size="14" />
            Crear usuario
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
