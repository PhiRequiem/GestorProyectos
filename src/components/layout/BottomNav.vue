<template>
  <nav class="bottom-nav">
    <RouterLink to="/" class="bnav-item" :class="{ active: route.name === 'Dashboard' }">
      <LayoutDashboard :size="20" />
      <span>Inicio</span>
    </RouterLink>
    <RouterLink to="/tasks" class="bnav-item" :class="{ active: route.name === 'Tasks' }">
      <ClipboardList :size="20" />
      <span>Tareas</span>
    </RouterLink>
    <RouterLink to="/archive" class="bnav-item" :class="{ active: route.name === 'Archive' }">
      <Archive :size="20" />
      <span>Archivo</span>
    </RouterLink>
    <button class="bnav-item" @click="toggle">
      <Sun v-if="dark" :size="20" />
      <Moon v-else :size="20" />
      <span>Tema</span>
    </button>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { LayoutDashboard, ClipboardList, Archive, Sun, Moon } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'

const route = useRoute()
const { dark, toggle } = useTheme()
</script>

<style scoped>
.bottom-nav {
  display: none;
}

@media (max-width: 767px) {
  .bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--color-bg-sidebar);
    border-top: 1px solid var(--color-border);
    z-index: 100;
    padding-bottom: env(safe-area-inset-bottom);
  }
}

.bnav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 4px 8px;
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.65rem;
  font-weight: 500;
  font-family: inherit;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
}

.bnav-item.active,
.bnav-item:hover {
  color: var(--color-brand-light);
}
</style>
