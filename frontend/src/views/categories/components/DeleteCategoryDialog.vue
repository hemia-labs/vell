<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
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
import type { Category } from '@/domain/models/category.model'

const open = defineModel<boolean>('open', { default: false })
defineProps<{
  category: Category | null
  descendantCount?: number
  isLoading?: boolean
}>()

const emit = defineEmits<{
  confirm: []
}>()
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle class="flex items-center gap-2">
          <AlertTriangle :size="18" />
          Eliminar categoría
        </AlertDialogTitle>
        <AlertDialogDescription>
          La categoría "{{ category?.name }}" se eliminará de forma lógica y dejará de aparecer en la administración.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div
        v-if="descendantCount"
        class="rounded-md border border-amber-300/70 bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
      >
        Esta categoría tiene {{ descendantCount }} subcategoría{{ descendantCount === 1 ? '' : 's' }} dentro. Si continúas, también se eliminarán sus hijos y descendientes. Si quieres conservarlas, primero usa Transferir para moverlas a otra categoría o hacerlas raíz.
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isLoading">Cancelar</AlertDialogCancel>
        <AlertDialogAction :disabled="isLoading" @click="emit('confirm')">
          Eliminar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
