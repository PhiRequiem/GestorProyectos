<template>
  <span class="priority-badge" :class="priority">
    <ArrowUp v-if="priority === 'high'" :size="11" />
    <Minus v-else-if="priority === 'medium'" :size="11" />
    <ArrowDown v-else :size="11" />
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowUp, ArrowDown, Minus } from 'lucide-vue-next'

const props = defineProps({
  priority: { type: String, required: true },
})

const labels = { high: 'Alta', medium: 'Media', low: 'Baja' }
const label = computed(() => labels[props.priority] || props.priority)
</script>

<style scoped>
.priority-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
}
.priority-badge.high {
  background: color-mix(in srgb, var(--color-priority-high) 15%, transparent);
  color: var(--color-priority-high);
}
.priority-badge.medium {
  background: color-mix(in srgb, var(--color-priority-medium) 15%, transparent);
  color: var(--color-priority-medium);
}
.priority-badge.low {
  background: color-mix(in srgb, var(--color-priority-low) 15%, transparent);
  color: var(--color-priority-low);
}
</style>
