import { ref } from 'vue'

const DEFAULTS = [
  { value: 'web_dev', label: 'Desarrollo Web' },
  { value: 'security', label: 'Consultoría de Seguridad' },
  { value: 'design', label: 'Diseño Técnico' },
  { value: 'consulting', label: 'Consultoría General' },
  { value: 'other', label: 'Otro' },
]

const STORAGE_KEY = 'phi_service_types'

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : [...DEFAULTS]
  } catch {
    return [...DEFAULTS]
  }
}

const serviceTypes = ref(load())

export function useServiceTypes() {
  function addType(label) {
    const trimmed = label.trim()
    if (!trimmed) return
    const value = trimmed.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    if (serviceTypes.value.some((t) => t.value === value)) return
    serviceTypes.value.push({ value, label: trimmed })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serviceTypes.value))
  }

  function getLabelByValue(value) {
    return serviceTypes.value.find((t) => t.value === value)?.label ?? value
  }

  return { serviceTypes, addType, getLabelByValue }
}
