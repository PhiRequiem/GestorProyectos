<template>
  <span class="badge" :class="status">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true },
})

const labels = {
  active: 'Activo',
  pending: 'En espera',
  not_approved: 'No aprobado',
  archived: 'Archivado',
}

const label = computed(() => labels[props.status] || props.status)
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.badge::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}
.badge.active {
  background: color-mix(in srgb, var(--color-active) 15%, transparent);
  color: var(--color-active);
}
.badge.pending {
  background: color-mix(in srgb, var(--color-pending) 15%, transparent);
  color: var(--color-pending);
}
.badge.not_approved {
  background: color-mix(in srgb, var(--color-rejected) 15%, transparent);
  color: var(--color-rejected);
}
.badge.archived {
  background: color-mix(in srgb, var(--color-archived) 15%, transparent);
  color: var(--color-archived);
}
</style>
