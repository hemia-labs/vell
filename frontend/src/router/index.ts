import { createRouter, createWebHistory } from 'vue-router'
import { authRoutes } from './auth'
import AuthService from '@/services/auth/auth.service'
import { useAuthStore } from '@/stores'
import PrivateLayout from '@/layouts/private/PrivateLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: PrivateLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
          meta: {
            title: 'Inicio',
            requiresAuth: true
          }
        }
      ]
    },
    ...authRoutes
  ]
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  const authService = new AuthService()
  const isLoginRoute = to.name === 'login'

  if (authStore.isAuthenticated) {
    if (isLoginRoute) {
      return next({ path: '/' })
    }

    return next()
  }

  try {
    const user = await authService.me()
    authStore.setUser(user)
    if (isLoginRoute) {
      return next({ path: '/' })
    }

    return next()
  } catch {
    authStore.clearUser()
  }

  if (!to.meta.requiresAuth) {
    return next()
  }

  return next({ name: 'login' })
})

export default router
