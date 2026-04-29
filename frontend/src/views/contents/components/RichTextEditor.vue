<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { Bold, Italic, Link, List, ListOrdered, Redo2, Underline, Undo2, Unlink } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'

const props = defineProps<{
  id?: string
  modelValue?: string
  disabled?: boolean
  maxlength?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorRef = ref<HTMLElement | null>(null)
const isFocused = ref(false)
const linkPopoverOpen = ref(false)
const linkUrl = ref('')
let savedSelection: Range | null = null

onMounted(() => {
  if (editorRef.value) {
    editorRef.value.innerHTML = props.modelValue ?? ''
  }
})

watch(
  () => props.modelValue,
  async (value) => {
    if (isFocused.value || !editorRef.value || editorRef.value.innerHTML === (value ?? '')) {
      return
    }

    await nextTick()
    editorRef.value.innerHTML = value ?? ''
  },
  { immediate: true }
)

function emitHtml() {
  const html = editorRef.value?.innerHTML ?? ''

  if (props.maxlength && html.length > props.maxlength) {
    const nextHtml = html.slice(0, props.maxlength)

    if (editorRef.value) {
      editorRef.value.innerHTML = nextHtml
    }

    emit('update:modelValue', nextHtml)
    return
  }

  emit('update:modelValue', html)
}

function saveSelection() {
  const selection = window.getSelection()

  if (!selection?.rangeCount) {
    return
  }

  const range = selection.getRangeAt(0)

  if (editorRef.value?.contains(range.commonAncestorContainer)) {
    savedSelection = range.cloneRange()
  }
}

function restoreSelection() {
  if (!savedSelection) {
    return
  }

  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(savedSelection)
}

function run(command: string, value?: string) {
  if (props.disabled) {
    return
  }

  editorRef.value?.focus()
  restoreSelection()
  document.execCommand(command, false, value)
  saveSelection()
  emitHtml()
}

function openLinkPopover() {
  if (props.disabled) {
    return
  }

  saveSelection()
  linkUrl.value = ''
  linkPopoverOpen.value = true
}

function addLink() {
  const url = linkUrl.value.trim()

  if (!url) {
    return
  }

  run('createLink', url)
  linkPopoverOpen.value = false
  linkUrl.value = ''
}
</script>

<template>
  <div class="overflow-hidden rounded-md border border-(--app-line) bg-(--app-surface)">
    <div class="flex min-h-10 flex-wrap items-center gap-1 border-b border-(--app-line) bg-(--app-surface-2) p-1.5">
      <Button type="button" variant="ghost" size="icon-sm" :disabled="disabled" aria-label="Bold" title="Bold" @click="run('bold')">
        <Bold :size="14" />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" :disabled="disabled" aria-label="Italic" title="Italic" @click="run('italic')">
        <Italic :size="14" />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" :disabled="disabled" aria-label="Underline" title="Underline" @click="run('underline')">
        <Underline :size="14" />
      </Button>
      <span class="mx-1 h-5 w-px bg-(--app-line)" />
      <Button type="button" variant="ghost" size="icon-sm" :disabled="disabled" aria-label="Bullet list" title="Bullet list" @click="run('insertUnorderedList')">
        <List :size="14" />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" :disabled="disabled" aria-label="Numbered list" title="Numbered list" @click="run('insertOrderedList')">
        <ListOrdered :size="14" />
      </Button>
      <span class="mx-1 h-5 w-px bg-(--app-line)" />
      <Popover v-model:open="linkPopoverOpen">
        <PopoverTrigger as-child>
          <Button type="button" variant="ghost" size="icon-sm" :disabled="disabled" aria-label="Add link" title="Add link" @mousedown.prevent="saveSelection" @click="linkUrl = ''">
            <Link :size="14" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="grid w-80 gap-3 p-3" align="start">
          <form class="grid gap-2" @submit.prevent="addLink">
            <label class="text-[12px] font-medium text-(--app-muted)" for="rich-text-link-url">URL</label>
            <div class="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <Input
                id="rich-text-link-url"
                v-model="linkUrl"
                type="url"
                placeholder="https://example.com"
                autocomplete="off"
              />
              <Button type="submit" size="sm">Aplicar</Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
      <Button type="button" variant="ghost" size="icon-sm" :disabled="disabled" aria-label="Remove link" title="Remove link" @click="run('unlink')">
        <Unlink :size="14" />
      </Button>
      <span class="mx-1 h-5 w-px bg-(--app-line)" />
      <Button type="button" variant="ghost" size="icon-sm" :disabled="disabled" aria-label="Undo" title="Undo" @click="run('undo')">
        <Undo2 :size="14" />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" :disabled="disabled" aria-label="Redo" title="Redo" @click="run('redo')">
        <Redo2 :size="14" />
      </Button>
    </div>

    <div
      :id="id"
      ref="editorRef"
      class="rich-text-editor min-h-40 w-full bg-(--app-surface) px-3 py-2.5 text-[14px] leading-6 text-(--app-ink) outline-none focus:ring-2 focus:ring-ring/35"
      :class="{ 'pointer-events-none opacity-60': disabled }"
      :contenteditable="!disabled"
      role="textbox"
      aria-multiline="true"
      @focus="isFocused = true"
      @blur="isFocused = false"
      @keyup="saveSelection"
      @mouseup="saveSelection"
      @input="emitHtml"
    />
  </div>
</template>

<style scoped>
.rich-text-editor:empty::before {
  color: var(--app-muted);
  content: 'Escribe contenido enriquecido...';
}

.rich-text-editor :deep(ul),
.rich-text-editor :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.35rem;
}

.rich-text-editor :deep(ul) {
  list-style: disc outside;
}

.rich-text-editor :deep(ol) {
  list-style: decimal outside;
}

.rich-text-editor :deep(li) {
  display: list-item;
}

.rich-text-editor :deep(a) {
  color: hsl(var(--primary));
  text-decoration: underline;
}
</style>
