import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import useVuelidate from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import type { LoginModel } from '@/domain/models/login.model'
import AuthService from '@/services/auth/auth.service'
import { useAuthStore } from '@/stores'
import { UnauthorizedError, BadRequestError } from '@/errors/http-errors'

const emailValidation = helpers.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)

export function useLogin() {
  const form = ref<LoginModel>({
    email: '',
    password: '',
    rememberMe: false
  })

  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  const rules = {
    email: {
      required: helpers.withMessage('El email es requerido', required),
      email: helpers.withMessage('Ingresa un email válido', emailValidation)
    },
    password: {
      required: helpers.withMessage('La contraseña es requerida', required)
    },
    rememberMe: {}
  }

  const v$ = useVuelidate(rules, form)

  const isFormValid = computed(() => !v$.value.$invalid)

  const authService = new AuthService()
  const authStore = useAuthStore()
  const router = useRouter()

  const login = async (): Promise<boolean> => {
    errorMessage.value = null

    const isValid = await v$.value.$validate()
    if (!isValid) {
      return false
    }

    isLoading.value = true

    try {
      await authService.login(form.value)
      const user = await authService.me()
      authStore.setUser(user)
      await router.push('/')
      return true
    } catch (error: unknown) {
      if (error instanceof UnauthorizedError || error instanceof BadRequestError) {
        errorMessage.value = error.message
      } else if (error instanceof Error && 'message' in error) {
        errorMessage.value = error.message
      } else {
        errorMessage.value = 'Error al iniciar sesión'
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    isLoading.value = true

    try {
      await authService.logout()
    } finally {
      authStore.clearUser()
      isLoading.value = false
      await router.push({ name: 'login' })
    }
  }

  const resetForm = () => {
    form.value = {
      email: '',
      password: '',
      rememberMe: false
    }
    v$.value.$reset()
    errorMessage.value = null
  }

  const clearErrors = () => {
    errorMessage.value = null
    v$.value.$reset()
  }

  return {
    form,
    v$,
    isLoading,
    errorMessage,
    isFormValid,
    login,
    logout,
    resetForm,
    clearErrors
  }
}
