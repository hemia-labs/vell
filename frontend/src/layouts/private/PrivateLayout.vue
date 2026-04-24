<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layout/private/AppHeader.vue'
import AppSidebar from '@/components/layout/private/AppSidebar.vue'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
</script>

<template>
  <SidebarProvider class="private-layout">
    <AppSidebar />

    <SidebarInset class="private-layout__main">
      <AppHeader />

      <section class="private-layout__content">
        <RouterView />
      </section>
    </SidebarInset>
  </SidebarProvider>
</template>

<style scoped>
.private-layout {
  min-height: 100vh;
  background: var(--app-bg);
  color: var(--app-ink);
}

.private-layout__main {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.private-layout__content {
  width: 100%;
  padding: 32px clamp(20px, 3vw, 72px) 80px;
}

@media (max-width: 900px) {
  .private-layout__content {
    padding: 24px 20px 64px;
  }
}
</style>
