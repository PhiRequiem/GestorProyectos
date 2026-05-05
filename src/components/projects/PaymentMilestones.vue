<template>
  <div class="milestones-section">
    <div class="section-header">
      <h3><Milestone :size="16" /> Hitos de Pago</h3>
    </div>

    <p v-if="!milestones.length" class="empty-hint">Sin hitos. Agrega pagos parciales abajo.</p>
    <ul class="milestone-list">
      <li v-for="m in milestones" :key="m.id" class="milestone-item" :class="{ extra: m.isExtra }">
        <button class="check-btn" :class="{ paid: m.paid }" @click="toggle(m)">
          <Check v-if="m.paid" :size="11" />
        </button>
        <div class="milestone-info">
          <div class="milestone-meta">
            <span class="milestone-label" :class="{ paid: m.paid }">{{ m.label }}</span>
            <span v-if="m.isExtra" class="extra-tag">+ cargo extra</span>
          </div>
          <span class="milestone-amount" :class="{ extra: m.isExtra }">
            {{ m.isExtra ? '+' : '' }}${{ m.amount?.toLocaleString() || 0 }}
          </span>
        </div>
        <button class="del-btn" @click="remove(m.id)"><X :size="13" /></button>
      </li>
    </ul>

    <form class="add-form" @submit.prevent="addNew">
      <div class="add-inputs">
        <input v-model="newLabel" placeholder="Descripción del hito..." class="input-label" />
        <input v-model.number="newAmount" type="number" placeholder="$" min="0" class="input-amount" />
        <button type="submit" :disabled="!newLabel.trim()" :class="{ 'btn-extra': newIsExtra }">
          <Check :size="15" />
        </button>
      </div>
      <div class="extra-toggle" @click="newIsExtra = !newIsExtra" :class="{ active: newIsExtra }">
        <div class="extra-toggle-check">
          <TrendingUp :size="11" />
        </div>
        <div class="extra-toggle-text">
          <span class="extra-toggle-label">Cargo extra</span>
          <span class="extra-toggle-hint">Suma este monto al total acordado del proyecto</span>
        </div>
      </div>
    </form>

    <p v-if="overLimitWarning" class="over-limit">
      La suma de hitos de pago supera el monto acordado.
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { Milestone, Check, X, TrendingUp } from 'lucide-vue-next'
import { useProjectsStore } from '@/stores/projects'

const props = defineProps({
  projectId: { type: String, required: true },
  totalAmount: { type: Number, default: null },
})

const store = useProjectsStore()
const milestones = ref([])
const newLabel = ref('')
const newAmount = ref(0)
const newIsExtra = ref(false)

const unsub = store.subscribeMilestones(props.projectId, (data) => {
  milestones.value = data
})
onUnmounted(() => unsub())

const regularMilestonesTotal = computed(() =>
  milestones.value.filter((m) => !m.isExtra).reduce((s, m) => s + (m.amount || 0), 0)
)

const overLimitWarning = computed(() => {
  if (props.totalAmount == null || props.totalAmount === 0) return false
  return regularMilestonesTotal.value > props.totalAmount
})

async function toggle(m) {
  await store.toggleMilestone(props.projectId, m.id, !m.paid)
}

async function remove(id) {
  const m = milestones.value.find((x) => x.id === id)
  await store.deleteMilestone(props.projectId, id)
  if (m?.isExtra && m.amount && props.totalAmount != null) {
    await store.updateProject(props.projectId, {
      totalAmount: Math.max(0, props.totalAmount - m.amount),
    })
  }
}

async function addNew() {
  if (!newLabel.value.trim()) return
  await store.addMilestone(props.projectId, {
    label: newLabel.value.trim(),
    amount: newAmount.value || 0,
    isExtra: newIsExtra.value,
  })
  if (newIsExtra.value && newAmount.value > 0) {
    await store.updateProject(props.projectId, {
      totalAmount: (props.totalAmount || 0) + newAmount.value,
    })
  }
  newLabel.value = ''
  newAmount.value = 0
  newIsExtra.value = false
}
</script>

<style scoped>
.milestones-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-hint {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  font-style: italic;
  margin: 0;
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

.milestone-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.milestone-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background 0.1s;
}

.milestone-item:hover { background: var(--color-bg-elevated); }
.milestone-item:hover .del-btn { opacity: 1; }

.milestone-item.extra {
  border-left: 2px solid var(--color-accent);
  padding-left: 6px;
}

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
  transition: all 0.15s;
  color: white;
}

.check-btn.paid {
  background: var(--color-active);
  border-color: var(--color-active);
}

.milestone-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.milestone-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}

.milestone-label {
  font-size: 0.875rem;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.milestone-label.paid {
  text-decoration: line-through;
  color: var(--color-text-muted);
}

.extra-tag {
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  padding: 1px 5px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.milestone-amount {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-active);
  flex-shrink: 0;
}

.milestone-amount.extra { color: var(--color-accent); }

.del-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 2px;
  display: flex;
  opacity: 0;
  transition: all 0.15s;
}

.del-btn:hover { color: var(--color-rejected); }

.add-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.add-inputs {
  display: flex;
  gap: 5px;
  align-items: center;
}

.input-label { flex: 1; }
.input-amount { width: 72px; }

.add-form input {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  padding: 7px 10px;
  font-size: 0.8rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}

.add-form input:focus { border-color: var(--color-brand); }

.add-form button[type="submit"] {
  background: var(--color-brand);
  border: none;
  border-radius: 8px;
  color: white;
  padding: 7px 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: background 0.15s;
}

.add-form button[type="submit"]:hover:not(:disabled) { background: var(--color-brand-dark); }
.add-form button[type="submit"]:disabled { opacity: 0.4; cursor: not-allowed; }
.add-form button.btn-extra { background: var(--color-accent); }
.add-form button.btn-extra:hover:not(:disabled) { background: #7c3aed; }

.extra-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px dashed var(--color-border);
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}

.extra-toggle:hover {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 4%, transparent);
}

.extra-toggle.active {
  border-style: solid;
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 8%, transparent);
}

.extra-toggle-check {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1.5px solid var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-text-muted);
  transition: all 0.15s;
}

.extra-toggle.active .extra-toggle-check {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: white;
}

.extra-toggle-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.extra-toggle-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.extra-toggle-hint {
  font-size: 0.68rem;
  color: var(--color-text-muted);
}

.over-limit {
  font-size: 0.75rem;
  color: var(--color-pending);
  margin: 0;
  padding: 6px 10px;
  background: color-mix(in srgb, var(--color-pending) 10%, transparent);
  border-radius: 6px;
}
</style>
