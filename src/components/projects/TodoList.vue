<template>
  <div class="todo-section">
    <div class="section-header">
      <h3>
        <ListTodo :size="16" />
        Tareas
      </h3>
      <span class="counter">{{ completed }}/{{ todos.length }}</span>
    </div>

    <div v-if="todos.length" class="progress-bar-wrap">
      <div class="progress-bar" :style="{ width: progressPct + '%' }"></div>
    </div>

    <p v-if="!todos.length" class="empty-state">
      <ListTodo :size="14" /> Sin tareas aún. Agrega la primera abajo.
    </p>

    <ul class="todo-list">
      <li v-for="todo in todos" :key="todo.id" class="todo-item">
        <button class="check-btn" :class="{ done: todo.completed }" @click="toggle(todo)">
          <Check v-if="todo.completed" :size="11" />
        </button>
        <span
      class="todo-text"
      :class="{ done: todo.completed }"
      :contenteditable="!todo.completed"
      @blur="e => saveEdit(todo, e)"
      @keydown.enter.prevent="e => e.target.blur()"
    >{{ todo.text }}</span>
        <button class="del-btn" @click="remove(todo.id)">
          <X :size="13" />
        </button>
      </li>
    </ul>

    <form class="add-todo-form" @submit.prevent="addNew">
      <input v-model="newText" placeholder="Nueva tarea..." />
      <button type="submit" :disabled="!newText.trim()">
        <Plus :size="16" />
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { ListTodo, Check, X, Plus } from 'lucide-vue-next'
import { useProjectsStore } from '@/stores/projects'

const props = defineProps({
  projectId: { type: String, required: true },
})

const store = useProjectsStore()
const todos = ref([])
const newText = ref('')

const completed = computed(() => todos.value.filter((t) => t.completed).length)
const progressPct = computed(() =>
  todos.value.length ? Math.round((completed.value / todos.value.length) * 100) : 0
)

const unsub = store.subscribeTodos(props.projectId, (data) => {
  todos.value = data
})
onUnmounted(() => unsub())

async function toggle(todo) {
  await store.toggleTodo(props.projectId, todo.id, !todo.completed)
}

async function remove(id) {
  await store.deleteTodo(props.projectId, id)
}

async function saveEdit(todo, e) {
  const newText = e.target.innerText.trim()
  if (!newText || newText === todo.text) {
    e.target.innerText = todo.text
    return
  }
  await store.updateTodo(props.projectId, todo.id, newText)
}

async function addNew() {
  if (!newText.value.trim()) return
  await store.addTodo(props.projectId, newText.value.trim())
  newText.value = ''
}
</script>

<style scoped>
.todo-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-header h3 {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.counter {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  background: var(--color-bg-elevated);
  padding: 2px 8px;
  border-radius: 99px;
}

.progress-bar-wrap {
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-brand), var(--color-accent));
  border-radius: 2px;
  transition: width 0.4s ease;
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background 0.1s;
}

.todo-item:hover {
  background: var(--color-bg-elevated);
}

.todo-item:hover .del-btn {
  opacity: 1;
}

.check-btn {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1.5px solid var(--color-border-light);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
  color: white;
}

.check-btn.done {
  background: var(--color-brand);
  border-color: var(--color-brand);
}

.todo-text {
  flex: 1;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  transition: all 0.15s;
  outline: none;
  border-radius: 4px;
  padding: 1px 3px;
  cursor: text;
}

.todo-text:not(.done):focus {
  background: var(--color-bg-elevated);
  box-shadow: 0 0 0 2px var(--color-brand);
}

.todo-text.done {
  text-decoration: line-through;
  color: var(--color-text-muted);
  cursor: default;
  pointer-events: none;
}

.empty-state {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-style: italic;
  margin: 0;
  padding: 4px 0;
}

.del-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  display: flex;
  opacity: 0;
  transition: all 0.15s;
}

.del-btn:hover {
  color: var(--color-rejected);
}

.add-todo-form {
  display: flex;
  gap: 6px;
}

.add-todo-form input {
  flex: 1;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  padding: 7px 12px;
  font-size: 0.8rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}

.add-todo-form input:focus {
  border-color: var(--color-brand);
}

.add-todo-form button {
  background: var(--color-brand);
  border: none;
  border-radius: 8px;
  color: white;
  padding: 7px 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background 0.15s;
}

.add-todo-form button:hover:not(:disabled) {
  background: var(--color-brand-dark);
}

.add-todo-form button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
