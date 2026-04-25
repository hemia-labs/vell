<script setup lang="ts">
import { ref } from 'vue'
import { AlertCircleIcon, Eye, EyeOff } from 'lucide-vue-next'
import { useLogin } from '@/composables/auth/useLogin'
import { Field, FieldLabel, FieldContent, FieldError } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

const { v$, login, isLoading, errorMessage } = useLogin()
const showPassword = ref(false)

const handleSubmit = async () => {
  await login()
}
</script>

<template>
  <div class="min-h-screen flex text-foreground">
    <!-- Left side - Background image -->
    <div class="hidden lg:block lg:w-1/2 bg-cover bg-center relative" style="background-image: url('/images/bg-login.webp')">
      <div class="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center px-8">
        <h2 class="text-white text-4xl font-bold leading-tight mb-4">Tu contenido,<br>tu control</h2>
        <p class="text-white/80 text-lg">Gestiona contenido, medios y usuarios desde un solo lugar.</p>
      </div>
    </div>

    <!-- Right side - Login form -->
    <div class="w-full lg:w-1/2 flex flex-col bg-background px-8">
      <div class="flex-1 flex items-center justify-center">
        <div class="w-full max-w-md">
          <div class="space-y-2 mb-6">
              <h1 class="text-3xl font-semibold tracking-tight text-foreground">
                Bienvenido de nuevo
              </h1>
              <p class="text-sm text-muted-foreground">
                Ingresa tu correo electrónico y contraseña para acceder a tu cuenta
              </p>
            </div>

          <form @submit.prevent="handleSubmit" class="space-y-5">

            <Field orientation="vertical">
              <FieldLabel class="text-foreground">Email</FieldLabel>
              <FieldContent>
                <Input
                  id="email"
                  v-model="v$.email.$model"
                  type="email"
                  class="text-foreground placeholder:text-muted-foreground"
                  placeholder="tu@email.com"
                />
                <FieldError class="text-left" v-if="v$.email.$error">{{ v$.email.$errors[0].$message }}</FieldError>
              </FieldContent>
            </Field>

            <Field orientation="vertical">
              <FieldLabel class="text-foreground">Contraseña</FieldLabel>
              <FieldContent>
                <div class="relative">
                  <Input
                    id="password"
                    v-model="v$.password.$model"
                    :type="showPassword ? 'text' : 'password'"
                    class="pr-10 text-foreground placeholder:text-muted-foreground"
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    class="absolute right-1 top-1/2 -translate-y-1/2"
                    :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                    @click="showPassword = !showPassword"
                  >
                    <EyeOff v-if="showPassword" :size="16" />
                    <Eye v-else :size="16" />
                  </Button>
                </div>
                <FieldError class="text-left" v-if="v$.password.$error">{{ v$.password.$errors[0].$message }}</FieldError>
              </FieldContent>
            </Field>

            <div class="flex items-center gap-2">
              <Checkbox id="remember" v-model="v$.rememberMe.$model" />
              <label for="remember" class="text-sm text-muted-foreground cursor-pointer">
                Mantener mi sesión iniciada
              </label>
            </div>

            <Alert v-if="errorMessage" variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>{{ errorMessage }}</AlertTitle>
              <AlertDescription>
                <p>Por favor verifica tus credenciales e intenta nuevamente.</p>
              </AlertDescription>
            </Alert>

            <Button type="submit" class="w-full" :disabled="isLoading">
              Entrar
            </Button>
          </form>
        </div>
      </div>

      <!-- Footer links at the bottom -->
      <div class="flex items-center justify-end gap-4 text-xs text-muted-foreground py-4">
        <a href="#" class="hover:text-foreground transition-colors">Términos y condiciones</a>
        <a href="#" class="hover:text-foreground transition-colors">Contactar soporte</a>
      </div>
    </div>
  </div>
</template>
