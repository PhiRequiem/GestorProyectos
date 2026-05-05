import { defineStore } from 'pinia'
import { ref } from 'vue'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'

export const useSettingsStore = defineStore('settings', () => {
  const serviceTypes = ref([])
  let unsubscribe = null

  function subscribe() {
    if (unsubscribe) return
    unsubscribe = onSnapshot(
      doc(db, 'settings', 'app'),
      (snap) => {
        serviceTypes.value = snap.data()?.serviceTypes ?? []
      },
      () => {
        serviceTypes.value = []
      }
    )
  }

  function unsubscribeAll() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  async function addServiceType(label) {
    const trimmed = label.trim()
    if (!trimmed) return
    const value = trimmed.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    if (serviceTypes.value.some((t) => t.value === value)) return
    const updated = [...serviceTypes.value, { value, label: trimmed }]
    await setDoc(doc(db, 'settings', 'app'), { serviceTypes: updated }, { merge: true })
    return value
  }

  async function removeServiceType(value) {
    const updated = serviceTypes.value.filter((t) => t.value !== value)
    await setDoc(doc(db, 'settings', 'app'), { serviceTypes: updated }, { merge: true })
  }

  function getLabelByValue(value) {
    return serviceTypes.value.find((t) => t.value === value)?.label ?? value
  }

  return { serviceTypes, subscribe, unsubscribeAll, addServiceType, removeServiceType, getLabelByValue }
})
