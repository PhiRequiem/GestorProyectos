<template>
  <div class="app-layout">
    <Sidebar />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
  <BottomNav />
  <ToastContainer />
  <ConfirmModal />
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import Sidebar from './Sidebar.vue'
import BottomNav from './BottomNav.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { useProjectsStore } from '@/stores/projects'
import { useSettingsStore } from '@/stores/settings'
import { useTasksStore } from '@/stores/tasks'
import { useNotifications } from '@/composables/useNotifications'

const projects = useProjectsStore()
const settings = useSettingsStore()
const tasks = useTasksStore()
const { requestPermission, checkDeadlines } = useNotifications()
const { projects: projectList } = storeToRefs(projects)

// Check deadlines once when projects first load
const stopWatch = watch(projectList, (list) => {
  if (list.length) {
    checkDeadlines(list)
    stopWatch()
  }
})

onMounted(() => {
  projects.subscribe()
  settings.subscribe()
  tasks.subscribeLists()
  requestPermission()
})
onUnmounted(() => {
  projects.unsubscribeAll()
  settings.unsubscribeAll()
  tasks.unsubscribeAll()
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

@media (max-width: 767px) {
  .main-content {
    padding-bottom: 70px;
  }
}
</style>
