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
import type { Tag } from '@/domain/models/tag.model'

const open = defineModel<boolean>('open', { default: false })
defineProps<{
  tag: Tag | null
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
          Eliminar etiqueta
        </AlertDialogTitle>
        <AlertDialogDescription>
          La etiqueta "{{ tag?.name }}" se eliminará de forma lógica y dejará de aparecer en la administración.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isLoading">Cancelar</AlertDialogCancel>
        <AlertDialogAction :disabled="isLoading" @click="emit('confirm')">
          Eliminar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
