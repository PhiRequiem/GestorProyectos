<template>
  <div class="tasks-page">
    <!-- Mobile tab switcher -->
    <div class="mobile-tabs">
      <button :class="{ active: mobileTab === 'lists' }" @click="mobileTab = 'lists'">Listas</button>
      <button :class="{ active: mobileTab === 'tasks' }" @click="mobileTab = 'tasks'" :disabled="!selectedList">Tareas</button>
    </div>

    <!-- Lists panel -->
    <aside class="lists-panel" :class="{ 'mobile-hidden': mobileTab !== 'lists' }">
      <div class="lists-header">
        <h2>Mis Listas</h2>
        <button class="icon-btn" @click="showNewList = true" title="Nueva lista">
          <Plus :size="16" />
        </button>
      </div>

      <form v-if="showNewList" class="new-list-form" @submit.prevent="submitNewList">
        <input v-model="newListName" placeholder="Nombre de la lista..." autofocus />
        <div class="color-picker">
          <button
            v-for="c in COLORS" :key="c"
            type="button"
            class="color-dot"
            :style="{ background: c }"
            :class="{ selected: newListColor === c }"
            @click="newListColor = c"
          />
        </div>
        <div class="new-list-actions">
          <button type="button" class="btn-sm secondary" @click="showNewList = false">Cancelar</button>
          <button type="submit" class="btn-sm primary" :disabled="!newListName.trim()">Crear</button>
        </div>
      </form>

      <ul class="list-nav">
        <template v-for="l in store.lists" :key="l.id">
          <!-- Edit mode -->
          <li v-if="editingListId === l.id" class="list-edit-form" @click.stop>
            <input v-model="editingName" class="edit-list-input" @keydown.enter="saveListEdit" @keydown.escape="editingListId = null" />
            <div class="color-picker">
              <button
                v-for="c in COLORS" :key="c"
                type="button"
                class="color-dot"
                :style="{ background: c }"
                :class="{ selected: editingColor === c }"
                @click="editingColor = c"
              />
            </div>
            <div class="new-list-actions">
              <button class="btn-sm secondary" @click="editingListId = null">Cancelar</button>
              <button class="btn-sm primary" :disabled="!editingName.trim()" @click="saveListEdit">Guardar</button>
            </div>
          </li>
          <!-- Normal mode -->
          <li
            v-else
            class="list-item"
            :class="{ active: selectedList?.id === l.id }"
            @click="selectList(l)"
          >
            <span class="list-dot" :style="{ background: l.color || '#6366f1' }"></span>
            <span class="list-name">{{ l.name }}</span>
            <span v-if="l.pendingCount" class="list-count">{{ l.pendingCount }}</span>
            <button class="edit-list-btn" @click.stop="startEditList(l)" title="Editar lista">
              <Pencil :size="11" />
            </button>
            <button class="del-list-btn" @click.stop="confirmDeleteList(l)" title="Eliminar lista">
              <X :size="12" />
            </button>
          </li>
        </template>
      </ul>

      <p v-if="!store.lists.length" class="lists-empty">
        Crea tu primera lista con el botón +
      </p>
    </aside>

    <!-- Tasks panel -->
    <div class="tasks-panel" :class="{ 'mobile-hidden': mobileTab !== 'tasks' }">
      <div v-if="!selectedList" class="no-list">
        <ClipboardList :size="40" />
        <p>Selecciona una lista para ver sus tareas</p>
      </div>

      <template v-else>
        <div class="tasks-header">
          <div class="tasks-title">
            <span class="list-dot-lg" :style="{ background: selectedList.color || '#6366f1' }"></span>
            <h2>{{ selectedList.name }}</h2>
            <span class="task-count">{{ pendingCount }}/{{ tasks.length }}</span>
            <button
              v-if="tasks.length"
              class="clear-done-btn"
              :disabled="!tasks.some(t => t.completed)"
              title="Eliminar tareas completadas"
              @click="clearCompleted"
            >
              <CheckCheck :size="13" />
              Limpiar
            </button>
          </div>
        </div>

        <!-- Progress -->
        <div v-if="tasks.length" class="progress-wrap">
          <div class="progress-bar" :style="{ width: progressPct + '%' }"></div>
        </div>

        <!-- Task list -->
        <ul class="task-list">
          <li v-for="t in sortedTasks" :key="t.id" class="task-item" :class="{ done: t.completed }">
            <button class="check-btn" :class="{ done: t.completed }" @click="toggle(t)">
              <Check v-if="t.completed" :size="11" />
            </button>
            <div class="task-body">
              <span
              class="task-text"
              :contenteditable="!t.completed"
              @blur="e => saveTaskEdit(t, e)"
              @keydown.enter.prevent="e => e.target.blur()"
            >{{ t.text }}</span>
              <div class="task-meta">
                <span v-if="t.priority" class="task-priority" :class="t.priority">
                  {{ priorityLabel(t.priority) }}
                </span>
                <span v-if="t.dueDate" class="task-due" :class="dueClass(t.dueDate)">
                  <CalendarClock :size="11" />
                  {{ formatDue(t.dueDate) }}
                </span>
              </div>
            </div>
            <button class="del-btn" @click="removeTask(t.id)"><X :size="13" /></button>
          </li>
        </ul>

        <!-- Add task form -->
        <form class="add-task-form" @submit.prevent="submitTask">
          <div class="add-task-main">
            <input v-model="newText" placeholder="Nueva tarea..." class="task-input" />
            <button type="submit" :disabled="!newText.trim()" class="add-btn">
              <Plus :size="16" />
            </button>
          </div>
          <div class="add-task-options">
            <select v-model="newPriority" class="opt-select">
              <option value="">Sin prioridad</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
            <input v-model="newDue" type="date" class="opt-date" />
          </div>
        </form>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Plus, X, Check, ClipboardList, CalendarClock, CheckCheck, Pencil } from 'lucide-vue-next'
import { useTasksStore } from '@/stores/tasks'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'

const store = useTasksStore()
const { confirm } = useConfirm()
const toast = useToast()

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#64748b']

const selectedList = ref(null)
const mobileTab = ref('lists')
const editingListId = ref(null)
const editingName = ref('')
const editingColor = ref(COLORS[0])

onMounted(() => {
  // If lists already loaded (navigating from another page), select first immediately
  if (store.lists.length && !selectedList.value) {
    selectedList.value = store.lists[0]
  }
})
const tasks = ref([])
const showNewList = ref(false)
const newListName = ref('')
const newListColor = ref(COLORS[0])
const newText = ref('')
const newPriority = ref('')
const newDue = ref('')

let unsubTasks = null

watch(selectedList, (list) => {
  if (unsubTasks) unsubTasks()
  tasks.value = []
  if (list) {
    unsubTasks = store.subscribeTasks(list.id, (data) => { tasks.value = data })
  }
}, { immediate: true })

// Auto-select first list on load, keep in sync on rename/delete
watch(() => store.lists, (lists) => {
  if (selectedList.value) {
    const updated = lists.find((l) => l.id === selectedList.value.id)
    if (!updated) selectedList.value = lists[0] ?? null
    else selectedList.value = updated
  } else if (lists.length) {
    selectedList.value = lists[0]
    mobileTab.value = 'lists'
  }
}, { deep: true })

onUnmounted(() => { if (unsubTasks) unsubTasks() })

const pendingCount = computed(() => tasks.value.filter((t) => !t.completed).length)
const progressPct = computed(() =>
  tasks.value.length ? Math.round(((tasks.value.length - pendingCount.value) / tasks.value.length) * 100) : 0
)

const PRIORITY_ORDER = { high: 3, medium: 2, low: 1, null: 0 }
const sortedTasks = computed(() => [...tasks.value].sort((a, b) => {
  if (a.completed !== b.completed) return a.completed ? 1 : -1
  return (PRIORITY_ORDER[b.priority] ?? 0) - (PRIORITY_ORDER[a.priority] ?? 0)
}))

function priorityLabel(p) {
  return { high: 'Alta', medium: 'Media', low: 'Baja' }[p] ?? ''
}

function formatDue(val) {
  if (!val) return ''
  const d = new Date(val)
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short' })
}

function dueClass(val) {
  if (!val) return ''
  const diff = Math.ceil((new Date(val) - new Date()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'overdue'
  if (diff <= 2) return 'soon'
  return ''
}

async function submitNewList() {
  if (!newListName.value.trim()) return
  await store.createList(newListName.value.trim(), newListColor.value)
  showNewList.value = false
  newListName.value = ''
  newListColor.value = COLORS[0]
}

function selectList(list) {
  selectedList.value = list
  mobileTab.value = 'tasks'
}

function startEditList(list) {
  editingListId.value = list.id
  editingName.value = list.name
  editingColor.value = list.color || COLORS[0]
}

async function saveListEdit() {
  if (!editingName.value.trim()) return
  await store.updateList(editingListId.value, {
    name: editingName.value.trim(),
    color: editingColor.value,
  })
  editingListId.value = null
}

async function confirmDeleteList(list) {
  const ok = await confirm(`Eliminar lista "${list.name}"? Se pierden todas sus tareas.`, { danger: true })
  if (!ok) return
  if (selectedList.value?.id === list.id) selectedList.value = null
  await store.deleteList(list.id)
  toast.success('Lista eliminada')
}

async function clearCompleted() {
  await store.clearCompletedTasks(selectedList.value.id)
  toast.success('Tareas completadas eliminadas')
}

async function toggle(t) {
  await store.toggleTask(selectedList.value.id, t.id, !t.completed)
}

async function removeTask(id) {
  await store.deleteTask(selectedList.value.id, id)
}

async function saveTaskEdit(t, e) {
  const newText = e.target.innerText.trim()
  if (!newText || newText === t.text) {
    e.target.innerText = t.text
    return
  }
  await store.updateTask(selectedList.value.id, t.id, { text: newText })
}

async function submitTask() {
  if (!newText.value.trim()) return
  await store.addTask(selectedList.value.id, {
    text: newText.value.trim(),
    priority: newPriority.value || null,
    dueDate: newDue.value || null,
  })
  newText.value = ''
  newPriority.value = ''
  newDue.value = ''
}
</script>

<style scoped>
.tasks-page {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* Lists panel */
.lists-panel {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border);
  background: var(--color-bg-sidebar);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.lists-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 12px;
  border-bottom: 1px solid var(--color-border);
}

.lists-header h2 {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.icon-btn:hover { border-color: var(--color-brand); color: var(--color-brand-light); }

.new-list-form {
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.new-list-form input {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 7px;
  color: var(--color-text-primary);
  padding: 7px 10px;
  font-size: 0.8rem;
  font-family: inherit;
  outline: none;
}

.new-list-form input:focus { border-color: var(--color-brand); }

.color-picker {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.color-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.1s;
  padding: 0;
}

.color-dot.selected {
  border-color: white;
  transform: scale(1.15);
}

.new-list-actions {
  display: flex;
  gap: 6px;
}

.btn-sm {
  flex: 1;
  padding: 6px;
  border-radius: 7px;
  font-size: 0.78rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}

.btn-sm.primary { background: var(--color-brand); color: white; }
.btn-sm.primary:hover:not(:disabled) { background: var(--color-brand-dark); }
.btn-sm.primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-sm.secondary { background: var(--color-bg-elevated); color: var(--color-text-secondary); border: 1px solid var(--color-border); }
.btn-sm.secondary:hover { color: var(--color-text-primary); }

.list-nav {
  list-style: none;
  padding: 8px 0;
  margin: 0;
  flex: 1;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 8px;
  margin: 0 6px 2px;
  transition: background 0.1s;
}

.list-item:hover { background: var(--color-bg-elevated); }
.list-item.active { background: color-mix(in srgb, var(--color-brand) 12%, transparent); }

.list-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.list-name {
  flex: 1;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-edit-form {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: color-mix(in srgb, var(--color-brand) 5%, var(--color-bg-sidebar));
}

.edit-list-input {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-brand);
  border-radius: 7px;
  color: var(--color-text-primary);
  padding: 7px 10px;
  font-size: 0.8rem;
  font-family: inherit;
  outline: none;
  width: 100%;
}

.edit-list-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 2px;
  display: flex;
  flex-shrink: 0;
  transition: color 0.15s;
  opacity: 0;
}

.list-item:hover .edit-list-btn { opacity: 0.5; }
.edit-list-btn:hover { color: var(--color-brand-light); opacity: 1 !important; }

.del-list-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 2px;
  display: flex;
  flex-shrink: 0;
  transition: color 0.15s;
  opacity: 0.5;
}

.del-list-btn:hover { color: var(--color-rejected); opacity: 1; }

@media (hover: none) {
  .edit-list-btn { opacity: 0.4; }
  .del-list-btn { opacity: 0.4; }
}

.lists-empty {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  text-align: center;
  padding: 24px 16px;
  line-height: 1.5;
}

/* Tasks panel */
.tasks-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-bg-base);
}

.no-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.tasks-header {
  padding: 20px 28px 12px;
  border-bottom: 1px solid var(--color-border);
}

.tasks-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.list-dot-lg {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tasks-title h2 {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.clear-done-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  padding: 4px 10px;
  border-radius: 7px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.clear-done-btn:hover:not(:disabled) {
  border-color: var(--color-active);
  color: var(--color-active);
}

.clear-done-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.task-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background: var(--color-bg-elevated);
  padding: 2px 8px;
  border-radius: 99px;
  font-weight: 600;
}

.progress-wrap {
  height: 3px;
  background: var(--color-border);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-brand), var(--color-accent));
  transition: width 0.4s ease;
}

.task-list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  padding: 12px 16px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  transition: background 0.1s;
}

.task-item:hover { background: var(--color-bg-card); }
.task-item:hover .del-btn { opacity: 1; }

.check-btn {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--color-border-light);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
  transition: all 0.15s;
  color: white;
}

.check-btn.done { background: var(--color-brand); border-color: var(--color-brand); }

.task-body { flex: 1; min-width: 0; }

.task-text {
  display: block;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  line-height: 1.4;
  outline: none;
  border-radius: 4px;
  padding: 1px 3px;
  cursor: text;
}

.task-text:focus {
  background: var(--color-bg-elevated);
  box-shadow: 0 0 0 2px var(--color-brand);
}

.task-item.done .task-text {
  text-decoration: line-through;
  color: var(--color-text-muted);
  cursor: default;
  pointer-events: none;
}

.list-count {
  font-size: 0.65rem;
  font-weight: 700;
  background: var(--color-brand);
  color: white;
  border-radius: 99px;
  padding: 1px 6px;
  min-width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
  flex-wrap: wrap;
}

.task-priority {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}

.task-priority.high { background: color-mix(in srgb, var(--color-priority-high) 15%, transparent); color: var(--color-priority-high); }
.task-priority.medium { background: color-mix(in srgb, var(--color-priority-medium) 15%, transparent); color: var(--color-priority-medium); }
.task-priority.low { background: color-mix(in srgb, var(--color-priority-low) 15%, transparent); color: var(--color-priority-low); }

.task-due {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.task-due.soon { color: var(--color-pending); }
.task-due.overdue { color: var(--color-rejected); font-weight: 700; }

.del-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 2px;
  display: flex;
  opacity: 0;
  transition: all 0.15s;
  flex-shrink: 0;
}

.del-btn:hover { color: var(--color-rejected); }

.add-task-form {
  padding: 12px 16px 16px;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--color-bg-card);
}

.add-task-main {
  display: flex;
  gap: 6px;
}

.task-input {
  flex: 1;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 9px;
  color: var(--color-text-primary);
  padding: 9px 12px;
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}

.task-input:focus { border-color: var(--color-brand); }

.add-btn {
  background: var(--color-brand);
  border: none;
  border-radius: 9px;
  color: white;
  padding: 9px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: background 0.15s;
}

.add-btn:hover:not(:disabled) { background: var(--color-brand-dark); }
.add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.add-task-options {
  display: flex;
  gap: 8px;
}

.opt-select, .opt-date {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 7px;
  color: var(--color-text-primary);
  padding: 6px 10px;
  font-size: 0.78rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}

.opt-select { flex: 1; }
.opt-date { flex: 1; }
.opt-select:focus, .opt-date:focus { border-color: var(--color-brand); }
.opt-select option { background: var(--color-bg-card); }
input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }

/* ── Responsive ── */
.mobile-tabs { display: none; }

@media (max-width: 767px) {
  .tasks-page { flex-direction: column; height: auto; min-height: calc(100vh - 70px); }

  .mobile-tabs {
    display: flex;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg-sidebar);
    flex-shrink: 0;
  }

  .mobile-tabs button {
    flex: 1;
    padding: 12px;
    background: transparent;
    border: none;
    font-size: 0.875rem;
    font-weight: 600;
    font-family: inherit;
    color: var(--color-text-muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
  }

  .mobile-tabs button.active {
    color: var(--color-brand-light);
    border-bottom-color: var(--color-brand);
  }

  .mobile-tabs button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .lists-panel {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }

  .tasks-panel { flex: 1; }

  .mobile-hidden { display: none !important; }
}
</style>
