import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/domain/models/auth.model'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const currentUser = computed(() => user.value)

  function setUser(userData: User) {
    user.value = userData
  }

  function clearUser() {
    user.value = null
  }

  return {
    user,
    isAuthenticated,
    currentUser,
    setUser,
    clearUser
  }
})