<script setup lang="ts">
import { ref, onMounted } from 'vue'

const backendStatus = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const response = await fetch('/api/health')
    backendStatus.value = await response.json()
  } catch (error) {
    console.error('Failed to connect to backend:', error)
    backendStatus.value = { status: 'error', message: 'Backend not available' }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="home">
    <h1>🚀 Vell CMS</h1>
    <p class="tagline">A lightweight, high-performance Headless CMS</p>
    
    <div class="info">
      <h2>Stack Tecnológico</h2>
      <div class="stack">
        <div class="stack-item">
          <h3>Backend</h3>
          <ul>
            <li>NestJS</li>
            <li>PostgreSQL</li>
            <li>TypeORM</li>
          </ul>
        </div>
        <div class="stack-item">
          <h3>Frontend</h3>
          <ul>
            <li>Vue 3</li>
            <li>Vite</li>
            <li>TypeScript</li>
          </ul>
        </div>
      </div>
      
      <div class="backend-status">
        <h3>Backend Status</h3>
        <div v-if="loading">Conectando...</div>
        <div v-else-if="backendStatus?.status === 'ok'" class="status-ok">
          ✅ Backend Online
          <div class="status-details">
            {{ backendStatus.service }}
          </div>
        </div>
        <div v-else class="status-error">
          ❌ Backend Offline
          <div class="status-details">
            Asegúrate de iniciar el backend con: pnpm run dev:backend
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.tagline {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 3rem;
}

.info {
  background: #f5f5f5;
  padding: 2rem;
  border-radius: 8px;
  margin-top: 2rem;
}

@media (prefers-color-scheme: dark) {
  .info {
    background: #333;
  }
  .tagline {
    color: #aaa;
  }
}

.stack {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.stack-item {
  text-align: left;
}

.stack-item h3 {
  margin-bottom: 1rem;
  color: #42b883;
}

.stack-item ul {
  list-style: none;
}

.stack-item li {
  padding: 0.3rem 0;
}

.backend-status {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #ddd;
}

.status-ok {
  color: #42b883;
  font-weight: bold;
  margin-top: 1rem;
}

.status-error {
  color: #f56c6c;
  font-weight: bold;
  margin-top: 1rem;
}

.status-details {
  font-size: 0.9rem;
  font-weight: normal;
  margin-top: 0.5rem;
  opacity: 0.8;
}
</style>
