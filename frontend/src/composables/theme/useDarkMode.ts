import { ref, watch, onMounted, onUnmounted } from 'vue'

export function useDarkMode() {
  const getInitialTheme = (): boolean => {
    const html = document.documentElement
    const hasDarkClass = html.classList.contains('dark')
    const savedTheme = localStorage.getItem('theme')
    const expectedTheme = hasDarkClass ? 'dark' : 'light'
    
    if (savedTheme !== expectedTheme) {
      localStorage.setItem('theme', expectedTheme)
    }
    
    return hasDarkClass
  }

  const isDarkMode = ref<boolean>(getInitialTheme())

  const applyTheme = (value: boolean) => {
    const html = document.documentElement
    const theme = value ? 'dark' : 'light'
    
    if (value) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
    
    localStorage.setItem('theme', theme)
  }

  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
  }

  const setDarkMode = (value: boolean) => {
    isDarkMode.value = value
  }

  watch(isDarkMode, (newValue) => {
    applyTheme(newValue)
  })

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleSystemThemeChange = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem('theme')) {
      isDarkMode.value = e.matches
    }
  }

  onMounted(() => {
    applyTheme(isDarkMode.value)
    mediaQuery.addEventListener('change', handleSystemThemeChange)
  })

  onUnmounted(() => {
    mediaQuery.removeEventListener('change', handleSystemThemeChange)
  })

  return { isDarkMode, toggleDarkMode, setDarkMode }
}