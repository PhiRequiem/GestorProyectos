<template>
  <div class="app-layout">
    <Sidebar />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
  <ToastContainer />
  <ConfirmModal />
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import Sidebar from './Sidebar.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { useProjectsStore } from '@/stores/projects'
import { useSettingsStore } from '@/stores/settings'

const projects = useProjectsStore()
const settings = useSettingsStore()

onMounted(() => {
  projects.subscribe()
  settings.subscribe()
})
onUnmounted(() => {
  projects.unsubscribeAll()
  settings.unsubscribeAll()
})
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg-base);
}

.main-content {
  flex: 1;
  overflow-y: auto;
  min-width: 0;
}
</style>
