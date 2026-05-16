<template>
  <Teleport to="body">
    <div class="drawer-backdrop" @click.self="closeDrawer()">
      <div class="drawer">
        <div class="drawer-header">
          <div class="drawer-title">
            <StatusBadge :status="project.status" />
            <h3>{{ project.title }}</h3>
            <p class="client">{{ project.client }}</p>
          </div>
          <div class="drawer-header-actions">
            <button
              v-if="project.status === 'active'"
              class="drawer-icon-btn"
              :class="{ amber: project.waitingClose }"
              :title="project.waitingClose ? 'Desmarcar trabajo terminado' : 'Marcar trabajo terminado'"
              @click="toggleWaitingClose"
            >
              <Hourglass :size="14" />
            </button>
            <button class="drawer-icon-btn" title="Editar proyecto" @click="showModal = true">
              <Pencil :size="14" />
            </button>
            <button v-if="project.status === 'pending'" class="btn-approve" @click="approveProject">
              <CheckCircle2 :size="14" /> Aprobar
            </button>
            <RouterLink :to="`/projects/${project.id}`" class="btn-detail">
              <ExternalLink :size="14" /> Ver detalle
            </RouterLink>
            <button
              v-if="project.status !== 'archived'"
              class="drawer-icon-btn danger"
              title="Archivar proyecto"
              @click="archiveProject"
            >
              <Archive :size="14" />
            </button>
            <button class="close-btn" @click="closeDrawer()">
              <X :size="18" />
            </button>
          </div>
        </div>

        <div class="drawer-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="dtab"
            :class="{ active: activeTab === tab.value }"
            @click="activeTab = tab.value"
          >
            <component :is="tab.icon" :size="14" />
            {{ tab.label }}
          </button>
        </div>

        <div class="drawer-body">
          <div v-if="activeTab === 'todos'" class="todos-tab">
            <TodoList :projectId="project.id" />
          </div>

          <div v-else-if="activeTab === 'notes'" class="notes-panel">
            <textarea
              v-model="notesValue"
              class="notes-editor"
              placeholder="Escribe tus notas aquí..."
              @blur="saveNotes"
            ></textarea>
            <p class="notes-hint">Se guarda al cerrar el panel o al hacer clic fuera del área.</p>
          </div>

          <DocumentsSection v-else-if="activeTab === 'docs'" :projectId="project.id" />
        </div>
      </div>
    </div>

    <ProjectModal
      v-if="showModal"
      :project="project"
      @close="showModal = false"
      @saved="emit('saved', $event)"
    />
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { X, ExternalLink, ListTodo, FileText, FolderOpen, CheckCircle2, Pencil, Archive, Hourglass } from 'lucide-vue-next'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import TodoList from '@/components/projects/TodoList.vue'
import DocumentsSection from '@/components/projects/DocumentsSection.vue'
import ProjectModal from '@/components/projects/ProjectModal.vue'
import { useProjectsStore } from '@/stores/projects'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const props = defineProps({
  project: { type: Object, required: true },
})

const emit = defineEmits(['close', 'saved'])
const toast = useToast()
const { confirm } = useConfirm()

const store = useProjectsStore()
const activeTab = ref('todos')
const showModal = ref(false)
const notesValue = ref(props.project.notes || '')

const tabs = [
  { value: 'todos', label: 'Tareas', icon: ListTodo },
  { value: 'notes', label: 'Notas', icon: FileText },
  { value: 'docs', label: 'Archivos', icon: FolderOpen },
]

watch(() => props.project.notes, (v) => { notesValue.value = v || '' })

// Escape key closes drawer, saving notes first if needed
function onKeyDown(e) {
  if (e.key === 'Escape') closeDrawer()
}
onMounted(() => document.addEventListener('keydown', onKeyDown))
onUnmounted(() => document.removeEventListener('keydown', onKeyDown))

async function closeDrawer() {
  if (activeTab.value === 'notes' && notesValue.value !== (props.project.notes || '')) {
    await saveNotes()
  }
  emit('close')
}

async function saveNotes() {
  try {
    await store.updateProject(props.project.id, { notes: notesValue.value })
  } catch {
    toast.error('No se pudieron guardar las notas')
  }
}

async function approveProject() {
  await store.updateProject(props.project.id, { status: 'active' })
  toast.success('Proyecto aprobado')
}

async function archiveProject() {
  const ok = await confirm(`Archivar "${props.project.title}"?`)
  if (!ok) return
  await store.updateProject(props.project.id, { status: 'archived', closedAt: new Date().toISOString() })
  toast.success('Proyecto archivado')
  emit('close')
}

async function toggleWaitingClose() {
  const next = !props.project.waitingClose
  await store.updateProject(props.project.id, { waitingClose: next })
  toast.success(next ? 'Marcado como en espera de cierre' : 'Indicador removido')
}
</script>

<style scoped>
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  z-index: 900;
  display: flex;
  justify-content: flex-end;
}

.drawer {
  width: 420px;
  max-width: 100vw;
  height: 100%;
  background: var(--color-bg-card);
  border-left: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.2s ease;
}

@media (max-width: 767px) {
  .drawer { width: 100%; border-left: none; }
  .drawer-backdrop { background: var(--color-bg-base); }
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
  gap: 12px;
}

.drawer-title h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 6px 0 2px;
}

.client {
  font-size: 0.78rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.drawer-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.btn-approve {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 7px;
  border: 1px solid color-mix(in srgb, var(--color-active) 40%, transparent);
  background: color-mix(in srgb, var(--color-active) 10%, transparent);
  color: var(--color-active);
  font-size: 0.75rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-approve:hover {
  background: color-mix(in srgb, var(--color-active) 18%, transparent);
}

.drawer-icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}

.drawer-icon-btn:hover { border-color: var(--color-brand); color: var(--color-brand-light); }
.drawer-icon-btn.danger:hover { border-color: var(--color-rejected); color: var(--color-rejected); }
.drawer-icon-btn.amber { color: #f59e0b; border-color: color-mix(in srgb, #f59e0b 40%, transparent); }
.drawer-icon-btn.amber:hover { border-color: #f59e0b; color: #f59e0b; }

.btn-detail {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 7px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s;
}

.btn-detail:hover {
  border-color: var(--color-brand);
  color: var(--color-brand-light);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  transition: color 0.15s;
}

.close-btn:hover {
  color: var(--color-text-primary);
}

.drawer-tabs {
  display: flex;
  gap: 2px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border);
}

.dtab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 7px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.dtab:hover {
  color: var(--color-text-secondary);
}

.dtab.active {
  background: color-mix(in srgb, var(--color-brand) 15%, transparent);
  color: var(--color-brand-light);
  border-color: color-mix(in srgb, var(--color-brand) 30%, transparent);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.todos-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}


.notes-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}

.notes-editor {
  flex: 1;
  min-height: 300px;
  width: 100%;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  padding: 12px;
  font-size: 0.875rem;
  font-family: inherit;
  line-height: 1.7;
  outline: none;
  resize: none;
  transition: border-color 0.15s;
}

.notes-editor:focus {
  border-color: var(--color-brand);
}

.notes-hint {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  margin: 0;
}
</style>
