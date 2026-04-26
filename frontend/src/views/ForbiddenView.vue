<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Home, LockKeyhole, ShieldAlert } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const route = useRoute()
const router = useRouter()

const requestedPath = computed(() => route.fullPath)
</script>

<template>
  <main class="grid min-h-[calc(100vh-6rem)] place-items-center px-4 py-8">
    <section
      class="relative grid w-full max-w-160 gap-5.5 overflow-hidden rounded-(--app-radius-lg) border border-(--app-line) bg-[linear-gradient(135deg,color-mix(in_oklab,var(--app-ink)_2%,transparent),transparent_38%),var(--app-surface)] shadow-(--app-shadow) dark:border-white/10 dark:bg-[linear-gradient(135deg,oklch(1_0_0/0.05),transparent_42%),oklch(0.18_0.006_286)] dark:shadow-[0_18px_46px_oklch(0_0_0/0.28)]"
      aria-labelledby="forbidden-title"
    >
      <div class="h-1 bg-(--app-ink) dark:bg-white/80" aria-hidden="true"></div>

      <div class="flex items-center justify-between gap-4 px-5 pt-2 sm:px-7">
        <span
          class="grid size-11.5 place-items-center rounded-(--app-radius) border border-(--app-line) bg-[color-mix(in_oklab,var(--app-surface)_92%,var(--app-surface-2))] text-(--app-ink) dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
          aria-hidden="true"
        >
          <LockKeyhole :size="22" />
        </span>

        <span class="font-mono text-[42px] leading-none font-bold text-[color-mix(in_oklab,var(--app-ink)_22%,transparent)] sm:text-[52px] dark:text-white/18">403</span>
      </div>

      <div class="grid gap-2.5 px-5 sm:px-7">
        <span class="inline-flex w-fit items-center gap-1.75 font-mono text-[11px] font-semibold tracking-[0.04em] text-(--app-muted) uppercase dark:text-white/55">
          <ShieldAlert :size="14" />
          Acceso restringido
        </span>

        <h1 id="forbidden-title" class="m-0 max-w-130 text-[23px] leading-[1.16] font-[650] tracking-normal text-(--app-ink) sm:text-[28px] dark:text-white">
          No tienes permisos para abrir este módulo
        </h1>
        <p class="m-0 max-w-135 text-sm leading-[1.55] text-(--app-muted) dark:text-white/62">
          Tu sesión está activa, pero el rol asignado no incluye la autorización necesaria para esta sección.
        </p>
      </div>

      <dl class="mx-5 grid overflow-hidden rounded-(--app-radius) border border-(--app-line) bg-[color-mix(in_oklab,var(--app-surface)_88%,var(--app-surface-2))] sm:mx-7 dark:border-white/10 dark:bg-white/[0.04]">
        <div class="grid gap-1 px-3.5 py-3 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-4">
          <dt class="text-xs font-semibold text-(--app-muted) dark:text-white/50">Ruta solicitada</dt>
          <dd class="m-0 min-w-0 overflow-wrap-anywhere font-mono text-xs text-(--app-ink) dark:text-white/82">{{ requestedPath }}</dd>
        </div>
        <div class="grid gap-1 border-t border-(--app-line) px-3.5 py-3 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-4 dark:border-white/10">
          <dt class="text-xs font-semibold text-(--app-muted) dark:text-white/50">Estado</dt>
          <dd class="m-0 min-w-0 font-mono text-xs text-(--app-ink) dark:text-white/82">Permiso insuficiente</dd>
        </div>
      </dl>

      <div class="flex flex-col-reverse gap-2.5 border-t border-(--app-line) bg-[color-mix(in_oklab,var(--app-surface)_86%,var(--app-surface-2))] px-5 py-4.5 sm:flex-row sm:justify-end sm:px-7 dark:border-white/10 dark:bg-white/[0.035]">
        <Button type="button" variant="outline" @click="router.back()">
          <ArrowLeft :size="14" />
          Regresar
        </Button>
        <Button as-child>
          <RouterLink :to="{ name: 'home' }">
            <Home :size="14" />
            Inicio
          </RouterLink>
        </Button>
      </div>
    </section>
  </main>
</template>
