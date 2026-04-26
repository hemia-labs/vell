<script setup lang="ts">
import { computed } from 'vue'
import { RefreshCw, UserCheck, UserX } from 'lucide-vue-next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import type { User } from '@/domain/models/user.model'

const props = defineProps<{
  user: User | null
  nextIsActive: boolean | null
  isLoading?: boolean
}>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  confirm: []
}>()

const dialogCopy = computed(() => {
  const userName = props.user?.name ?? 'este usuario'

  if (props.nextIsActive) {
    return {
      title: 'Reactivar usuario',
      description: `Se restaurará el acceso de ${userName} al panel.`,
      action: 'Reactivar usuario',
      icon: UserCheck,
      badge: 'Activo',
      badgeVariant: 'default' as const,
      iconClass: 'border-[#b9d8c6] bg-[#e8f2ec] text-[#1f7a4c]',
      actionClass: 'bg-[#1f7a4c] text-white hover:bg-[#17613c] focus-visible:ring-[#1f7a4c]/35'
    }
  }

  return {
    title: 'Suspender usuario',
    description: `${userName} no podrá iniciar sesión ni operar dentro del panel.`,
    action: 'Suspender usuario',
    icon: UserX,
    badge: 'Suspendido',
    badgeVariant: 'destructive' as const,
    iconClass: 'border-[#e0c4c4] bg-[#f4e5e5] text-[#8b2f2f]',
    actionClass: 'bg-[#b42318] text-white hover:bg-[#8f1d14] focus-visible:ring-[#b42318]/35'
  }
})
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <div class="mb-1 flex items-start gap-3">
          <span
            class="grid size-9 shrink-0 place-items-center rounded-full border"
            :class="dialogCopy.iconClass"
          >
            <component :is="dialogCopy.icon" :size="17" />
          </span>
          <div class="min-w-0">
            <AlertDialogTitle>{{ dialogCopy.title }}</AlertDialogTitle>
            <AlertDialogDescription class="mt-1">
              {{ dialogCopy.description }}
            </AlertDialogDescription>
          </div>
        </div>
      </AlertDialogHeader>

      <div class="grid gap-2 rounded-(--app-radius-sm) border border-(--app-line) bg-(--app-surface-2) px-3.5 py-3">
        <span class="text-xs font-semibold text-(--app-muted)">Usuario</span>
        <div class="flex min-w-0 items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="m-0 truncate text-[13.5px] font-semibold text-(--app-ink)">{{ user?.name }}</p>
            <p class="m-0 truncate text-xs text-(--app-muted)">{{ user?.email }}</p>
          </div>
          <Badge :variant="dialogCopy.badgeVariant">
            {{ dialogCopy.badge }}
          </Badge>
        </div>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isLoading">Cancelar</AlertDialogCancel>
        <AlertDialogAction
          :disabled="isLoading"
          :class="dialogCopy.actionClass"
          @click.prevent="emit('confirm')"
        >
          <RefreshCw v-if="isLoading" :size="14" class="animate-spin" />
          {{ dialogCopy.action }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
