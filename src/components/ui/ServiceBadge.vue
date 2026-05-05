<template>
  <span class="service-badge">
    <component :is="icon" :size="11" />
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { Globe, Shield, PenTool, Briefcase } from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps({
  service: { type: String, required: true },
})

const { getLabelByValue } = useSettingsStore()

const iconMap = {
  web_dev: Globe,
  security: Shield,
  design: PenTool,
}

const label = computed(() => getLabelByValue(props.service))
const icon = computed(() => iconMap[props.service] ?? Briefcase)
</script>

<style scoped>
.service-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 500;
  background: color-mix(in srgb, var(--color-brand) 12%, transparent);
  color: var(--color-brand-light);
  border: 1px solid color-mix(in srgb, var(--color-brand) 25%, transparent);
  white-space: nowrap;
}
</style>
