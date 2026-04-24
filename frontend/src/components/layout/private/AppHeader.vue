<script setup lang="ts">
import { Bell, Plus } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useDarkMode } from '@/composables/theme/useDarkMode'

const route = useRoute()
const { isDarkMode } = useDarkMode()

const currentTitle = computed(() => String(route.meta.title ?? 'Inicio'))
</script>

<template>
  <header class="topbar" :class="{ 'topbar--dark': isDarkMode }">
    <SidebarTrigger class="topbar__trigger" />

    <nav class="crumbs" aria-label="Breadcrumb">
      <span>Vell CMS</span>
      <span class="crumbs__separator">/</span>
      <span class="crumbs__current">{{ currentTitle }}</span>
    </nav>

    <div class="topbar__actions">

      <button class="icon-btn" type="button" aria-label="Notificaciones">
        <Bell :size="14" />
      </button>

      <button class="btn btn--primary" type="button">
        <Plus :size="14" />
        Nuevo contenido
      </button>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  --topbar-bg: color-mix(in oklab, var(--app-bg) 86%, transparent);
  --topbar-surface: var(--app-surface);
  --topbar-surface-hover: var(--app-surface-2);
  --topbar-ink: var(--app-ink);
  --topbar-ink-muted: var(--app-ink-2);
  --topbar-muted: var(--app-muted);
  --topbar-muted-soft: var(--app-muted-2);
  --topbar-line: var(--app-line);
  --topbar-primary-bg: var(--app-ink);
  --topbar-primary-hover: var(--app-ink-2);
  --topbar-primary-fg: var(--app-bg);

  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  height: 52px;
  align-items: center;
  gap: 18px;
  border-bottom: 1px solid var(--topbar-line);
  background: var(--topbar-bg);
  padding: 0 28px;
  backdrop-filter: blur(10px);
}

.topbar--dark {
  --topbar-bg: oklch(0.141 0.005 285.823 / 88%);
  --topbar-surface: oklch(0.21 0.006 285.885 / 82%);
  --topbar-surface-hover: oklch(0.274 0.006 286.033 / 90%);
  --topbar-ink: oklch(0.985 0 0);
  --topbar-ink-muted: oklch(0.9 0.004 286);
  --topbar-muted: oklch(0.705 0.015 286.067);
  --topbar-muted-soft: oklch(0.58 0.014 286);
  --topbar-line: oklch(1 0 0 / 10%);
  --topbar-primary-bg: oklch(0.92 0.004 286.32);
  --topbar-primary-hover: oklch(0.985 0 0);
  --topbar-primary-fg: oklch(0.21 0.006 285.885);
}

.topbar__trigger {
  margin-left: -8px;
  color: var(--topbar-ink-muted);
}

.crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--topbar-muted);
  font-size: 13px;
}

.crumbs__separator {
  color: var(--topbar-muted-soft);
}

.crumbs__current {
  color: var(--topbar-ink);
  font-weight: 500;
}

.topbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.btn,
.icon-btn {
  border: 1px solid var(--topbar-line);
  border-radius: var(--app-radius-sm);
  background: var(--topbar-surface);
  color: var(--topbar-ink);
  cursor: pointer;
  font: inherit;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.btn {
  display: inline-flex;
  height: 30px;
  align-items: center;
  gap: 7px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 500;
}

.btn:hover,
.icon-btn:hover {
  background: var(--topbar-surface-hover);
  color: var(--topbar-ink);
}

.btn--ghost {
  border-color: transparent;
  background: transparent;
}

.btn--ghost:hover {
  background: var(--topbar-surface);
}

.btn--primary {
  border-color: var(--topbar-primary-bg);
  background: var(--topbar-primary-bg);
  color: var(--topbar-primary-fg);
}

.btn--primary:hover {
  background: var(--topbar-primary-hover);
  color: var(--topbar-primary-fg);
}

.icon-btn {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  color: var(--topbar-ink-muted);
}

@media (max-width: 640px) {
  .topbar {
    padding: 0 16px;
  }

  .btn--ghost {
    display: none;
  }
}
</style>
