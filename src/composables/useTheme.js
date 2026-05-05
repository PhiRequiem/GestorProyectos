import { ref, watchEffect } from 'vue'

const dark = ref(localStorage.getItem('theme') !== 'light')

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', dark.value ? 'dark' : 'light')
  localStorage.setItem('theme', dark.value ? 'dark' : 'light')
})

export function useTheme() {
  function toggle() {
    dark.value = !dark.value
  }
  return { dark, toggle }
}
