import { ref } from 'vue'

const pending = ref(null)

export function useConfirm() {
  function confirm(message, { danger = false } = {}) {
    return new Promise((resolve) => {
      pending.value = { message, danger, resolve }
    })
  }

  function respond(result) {
    if (pending.value) {
      pending.value.resolve(result)
      pending.value = null
    }
  }

  return { pending, confirm, respond }
}
