import { computed, ref } from 'vue'
import useVuelidate from '@vuelidate/core'
import { email, helpers, minLength, required } from '@vuelidate/validators'
import type { CreateUser, UpdateUser, User } from '@/domain/models/user.model'
import type { FilterUserParams, UpdateUserForm } from '@/domain/types/user.types'
import UserService from '@/services/users/user.service'

const userService = new UserService()
const REQUIRED_ROLE_MESSAGE = 'Selecciona al menos un rol'

const createInitialForm = (): CreateUser => ({
  name: '',
  email: '',
  password: '',
  roles: []
})

const createInitialUpdateForm = (): UpdateUserForm => ({
  name: '',
  email: '',
  roles: [],
  isActive: true
})

const userRules = {
  name: {
    required: helpers.withMessage('El nombre es requerido', required)
  },
  email: {
    required: helpers.withMessage('El correo es requerido', required),
    email: helpers.withMessage('Ingresa un correo válido', email)
  },
  roles: {
    required: helpers.withMessage(REQUIRED_ROLE_MESSAGE, required),
    minLength: helpers.withMessage(REQUIRED_ROLE_MESSAGE, minLength(1))
  }
}

export function useUserAdministration() {
  const users = ref<User[]>([])
  const form = ref<CreateUser>(createInitialForm())
  const updateForm = ref<UpdateUserForm>(createInitialUpdateForm())
  const currentUser = ref<User | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref('')
  const rules = {
    ...userRules,
    password: {
      required: helpers.withMessage('La contraseña es requerida', required),
      minLength: helpers.withMessage('La contraseña debe tener al menos 8 caracteres', minLength(8))
    }
  }
  const v$ = useVuelidate(rules, form)
  const updateRules = {
    ...userRules,
    isActive: {}
  }
  const vUpdate$ = useVuelidate(updateRules, updateForm)
  const isFormValid = computed(() => !v$.value.$invalid)

  async function runAction<T>(message: string, action: () => Promise<T>): Promise<T | null> {
    isLoading.value = true
    errorMessage.value = ''

    try {
      return await action()
    } catch {
      errorMessage.value = message
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function loadUsers(params?: FilterUserParams | Event) {
    await runAction('No se pudieron cargar los usuarios.', async () => {
      users.value = await userService.findAll(params instanceof Event ? undefined : params)
    })
  }

  async function createUser(payload: CreateUser) {
    return runAction('No se pudo crear el usuario.', async () => {
      const user = await userService.create(payload)
      users.value = [user, ...users.value]
      return user
    })
  }

  async function loadUserById(id: string) {
    return runAction('No se pudo cargar el usuario.', async () => {
      currentUser.value = await userService.findById(id)
      updateForm.value = {
        name: currentUser.value.name,
        email: currentUser.value.email,
        roles: currentUser.value.roles.map((role) => role.id).filter(Boolean),
        isActive: currentUser.value.isActive
      }
      vUpdate$.value.$reset()
      return currentUser.value
    })
  }

  async function updateUser(id: string, payload: UpdateUser) {
    return runAction('No se pudo actualizar el usuario.', async () => {
      const user = await userService.update(id, payload)
      users.value = users.value.map((current) => current.id === user.id ? user : current)
      return user
    })
  }

  async function submitCreateUser() {
    errorMessage.value = ''

    if (!await v$.value.$validate()) {
      return null
    }

    return createUser({
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      password: form.value.password,
      roles: form.value.roles
    })
  }

  async function submitUpdateUser(id: string) {
    errorMessage.value = ''

    if (!await vUpdate$.value.$validate()) {
      return null
    }

    return updateUser(id, {
      name: updateForm.value.name.trim(),
      email: updateForm.value.email.trim(),
      roles: updateForm.value.roles,
      isActive: updateForm.value.isActive
    })
  }

  function resetCreateUserForm() {
    form.value = createInitialForm()
    v$.value.$reset()
    errorMessage.value = ''
  }

  function resetUpdateUserForm() {
    updateForm.value = createInitialUpdateForm()
    currentUser.value = null
    vUpdate$.value.$reset()
    errorMessage.value = ''
  }

  return {
    users,
    form,
    updateForm,
    currentUser,
    v$,
    vUpdate$,
    isLoading,
    errorMessage,
    isFormValid,
    loadUsers,
    loadUserById,
    createUser,
    updateUser,
    submitCreateUser,
    submitUpdateUser,
    resetCreateUserForm,
    resetUpdateUserForm
  }
}
