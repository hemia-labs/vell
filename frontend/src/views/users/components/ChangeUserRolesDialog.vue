<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowLeft, ArrowRight, Save, ShieldCheck } from 'lucide-vue-next'
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
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useRoles } from '@/composables/roles/useRoles'
import { useUserAdministration } from '@/composables/users/useUserAdministration'
import type { User } from '@/domain/models/user.model'

const props = defineProps<{
  user: User | null
}>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  updated: []
}>()

const selectedRoleIds = ref<string[]>([])
const isConfirming = ref(false)
const roleError = ref('')
const { roles, isLoading: isLoadingRoles, errorMessage: rolesErrorMessage, loadRoles } = useRoles()
const { updateUser, isLoading, errorMessage } = useUserAdministration()

const currentRoleIds = computed(() => props.user?.roles.map((role) => role.id).filter(Boolean) ?? [])
const currentRoles = computed(() => props.user?.roles ?? [])
const selectedRoles = computed(() => roles.value.filter((role) => selectedRoleIds.value.includes(role.id)))
const selectedRolesLabel = computed(() => {
  if (selectedRoles.value.length === 0) {
    return 'Selecciona uno o más roles'
  }

  if (selectedRoles.value.length === 1) {
    return selectedRoles.value[0].name
  }

  return `${selectedRoles.value[0].name} +${selectedRoles.value.length - 1}`
})
const currentRolesLabel = computed(() => {
  const userRoles = props.user?.roles ?? []

  if (userRoles.length === 0) {
    return 'Sin roles asignados'
  }

  return userRoles.map((role) => role.name).join(', ')
})
const selectedRolesSummary = computed(() => {
  if (selectedRoles.value.length === 0) {
    return 'Sin roles seleccionados'
  }

  return selectedRoles.value.map((role) => role.name).join(', ')
})
const hasChanges = computed(() => {
  return normalizeIds(selectedRoleIds.value) !== normalizeIds(currentRoleIds.value)
})
const canContinue = computed(() => {
  return Boolean(props.user) && selectedRoleIds.value.length > 0 && hasChanges.value && !isLoadingRoles.value
})
const canSubmit = computed(() => canContinue.value && !isLoading.value)

function normalizeIds(ids: string[]) {
  return [...ids].sort().join('|')
}

function resetDialog() {
  selectedRoleIds.value = currentRoleIds.value
  isConfirming.value = false
  roleError.value = ''
}

function continueToConfirmation() {
  roleError.value = ''

  if (selectedRoleIds.value.length === 0) {
    roleError.value = 'Selecciona al menos un rol.'
    return
  }

  if (!hasChanges.value) {
    roleError.value = 'Selecciona roles distintos a los actuales.'
    return
  }

  isConfirming.value = true
}

async function submitRoles() {
  if (!props.user || !canSubmit.value) {
    return
  }

  const updatedUser = await updateUser(props.user.id, {
    roles: selectedRoleIds.value
  })

  if (!updatedUser) {
    return
  }

  emit('updated')
  open.value = false
  resetDialog()
}

watch(
  () => [open.value, props.user?.id] as const,
  ([isOpen]) => {
    if (!isOpen) {
      resetDialog()
      return
    }

    resetDialog()

    if (roles.value.length === 0) {
      loadRoles()
    }
  }
)
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Cambiar roles</DialogTitle>
        <DialogDescription>
          Actualiza los roles asignados al usuario seleccionado.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4">
        <Alert v-if="errorMessage || rolesErrorMessage" variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{{ errorMessage || rolesErrorMessage }}</AlertDescription>
        </Alert>

        <div class="rounded-(--app-radius-sm) border border-(--app-line) bg-(--app-surface-2) px-3.5 py-3">
          <p class="m-0 text-[12px] font-semibold text-(--app-muted)">Usuario</p>
          <div class="mt-1 flex min-w-0 flex-col">
            <strong class="truncate text-[13.5px] font-semibold text-(--app-ink)">{{ user?.name }}</strong>
            <span class="truncate text-xs text-(--app-muted)">{{ user?.email }}</span>
          </div>
        </div>

        <template v-if="!isConfirming">
          <Field>
            <FieldLabel>Roles</FieldLabel>
            <FieldContent>
              <Select v-model="selectedRoleIds" multiple :disabled="isLoadingRoles || roles.length === 0">
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
              <FieldError v-if="roleError" :errors="[roleError]" />
            </FieldContent>
          </Field>

          <div class="grid gap-2 rounded-(--app-radius-sm) border border-(--app-line) bg-(--app-surface) px-3.5 py-3">
            <span class="text-xs font-semibold text-(--app-muted)">Roles actuales</span>
            <p class="m-0 text-[13px] text-(--app-ink)">{{ currentRolesLabel }}</p>
          </div>
        </template>

        <template v-else>
          <div class="overflow-hidden rounded-(--app-radius-sm) border border-(--app-line) bg-(--app-surface)">
            <div class="flex items-start gap-3 border-b border-(--app-line) bg-(--app-surface-2) px-3.5 py-3">
              <span class="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-(--app-line) bg-(--app-surface) text-(--app-ink)">
                <ShieldCheck :size="15" />
              </span>
              <div class="min-w-0">
                <h3 class="m-0 text-[13.5px] font-semibold text-(--app-ink)">Confirmar cambio de roles</h3>
                <p class="m-0 mt-0.5 text-xs leading-snug text-(--app-muted)">
                  El acceso del usuario se actualizará con esta nueva asignación.
                </p>
              </div>
            </div>

            <div class="grid items-stretch gap-2.5 p-3.5 sm:grid-cols-[1fr_auto_1fr]">
              <div class="grid gap-2 rounded-(--app-radius-sm) border border-(--app-line) bg-(--app-surface-2) p-3">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-(--app-muted)">Antes</span>
                  <span class="rounded-full border border-(--app-line) bg-(--app-surface) px-1.5 py-px text-[10.5px] text-(--app-muted)">
                    {{ currentRoles.length }}
                  </span>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <Badge v-for="role in currentRoles" :key="role.id" variant="outline">
                    {{ role.name }}
                  </Badge>
                  <span v-if="currentRoles.length === 0" class="text-xs text-(--app-muted)">Sin roles</span>
                </div>
              </div>

              <div class="flex items-center justify-center text-(--app-muted)">
                <span class="grid size-8 place-items-center rounded-full border border-(--app-line) bg-(--app-surface)">
                  <ArrowRight :size="14" />
                </span>
              </div>

              <div class="grid gap-2 rounded-(--app-radius-sm) border border-(--app-ink) bg-(--app-ink) p-3 text-(--app-bg)">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-(--app-bg)/70">Después</span>
                  <span class="rounded-full border border-white/15 bg-white/10 px-1.5 py-px text-[10.5px] text-(--app-bg)/80">
                    {{ selectedRoles.length }}
                  </span>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <Badge v-for="role in selectedRoles" :key="role.id" variant="secondary">
                    {{ role.name }}
                  </Badge>
                  <span v-if="selectedRoles.length === 0" class="text-xs text-(--app-bg)/70">{{ selectedRolesSummary }}</span>
                </div>
              </div>
            </div>

            <p class="m-0 border-t border-(--app-line) px-3.5 py-2.5 text-[12px] leading-snug text-(--app-muted)">
              Al confirmar, se reemplazará la asignación actual de roles para este usuario.
            </p>
          </div>
        </template>
      </div>

      <DialogFooter>
        <Button v-if="isConfirming" type="button" variant="outline" :disabled="isLoading" @click="isConfirming = false">
          <ArrowLeft :size="14" />
          Volver
        </Button>
        <Button v-else type="button" variant="outline" :disabled="isLoading" @click="open = false">
          Cancelar
        </Button>
        <Button v-if="isConfirming" type="button" :disabled="!canSubmit" @click="submitRoles">
          <Save :size="14" />
          Confirmar cambio
        </Button>
        <Button v-else type="button" :disabled="!canContinue" @click="continueToConfirmation">
          Continuar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
