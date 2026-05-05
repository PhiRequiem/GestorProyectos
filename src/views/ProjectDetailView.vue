<template>
  <div v-if="project" class="detail-page">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <RouterLink to="/">Dashboard</RouterLink>
      <ChevronRight :size="14" />
      <span>{{ project.title }}</span>
    </div>

    <!-- Header -->
    <div class="detail-header">
      <div class="header-left">
        <div class="badges-row">
          <StatusBadge :status="project.status" />
          <PriorityBadge :priority="project.priority || 'medium'" />
          <ServiceBadge :service="project.serviceType || 'other'" />
          <span v-if="project.probono" class="kind-badge probono-badge"><Heart :size="11" /> Pro Bono</span>
          <span v-if="project.isPersonal" class="kind-badge personal-badge">φ Propio</span>
        </div>
        <h1>{{ project.title }}</h1>
        <p class="client-name"><Building2 :size="14" /> {{ project.client }}</p>
      </div>
      <div class="header-actions">
        <button class="btn-outline" @click="showModal = true">
          <Pencil :size="15" /> Editar
        </button>
        <button
          v-if="project.status === 'active' && project.waitingClose"
          class="btn-outline close-btn-action"
          @click="closeProject"
        >
          <CheckCheck :size="15" /> Cerrar proyecto
        </button>
        <button
          v-else-if="project.status === 'active'"
          class="btn-outline warning"
          @click="changeStatus('archived')"
        >
          <Archive :size="15" /> Archivar
        </button>
        <button v-if="project.status !== 'active'" class="btn-outline success" @click="changeStatus('active')">
          <RefreshCw :size="15" /> Reactivar
        </button>
      </div>
    </div>

    <!-- Delivery countdown -->
    <div v-if="project.deliveryDate" class="countdown-banner" :class="daysClass">
      <div class="countdown-left">
        <Clock :size="18" />
        <span class="countdown-label">Fecha de entrega</span>
        <span class="countdown-date">{{ formatDate(project.deliveryDate) }}</span>
      </div>
      <div class="countdown-right">
        <span class="countdown-days">{{ daysRemainingText }}</span>
      </div>
    </div>

    <!-- Grid layout -->
    <div class="detail-grid">
      <!-- Finance Card -->
      <div class="card finance-card">
        <h3 class="card-title"><DollarSign :size="15" /> Finanzas</h3>

        <div class="finance-rows">
          <div class="finance-row">
            <span>Monto total</span>
            <strong v-if="project.priceUndefined" class="muted-val">Por definir</strong>
            <strong v-else>${{ (project.totalAmount || 0).toLocaleString() }}</strong>
          </div>
          <div class="finance-row">
            <span>Adelanto</span>
            <strong class="green">${{ (project.advanceAmount || 0).toLocaleString() }}</strong>
          </div>
          <div v-if="milestonesCollectedLive > 0" class="finance-row">
            <span>Hitos cobrados</span>
            <strong class="green">${{ milestonesCollectedLive.toLocaleString() }}</strong>
          </div>
          <div class="finance-row highlight-row">
            <span>Total cobrado</span>
            <strong class="green">${{ totalCollected.toLocaleString() }}</strong>
          </div>
          <div class="finance-row total">
            <span>Pendiente</span>
            <strong :class="pending === 0 ? 'green' : 'orange'">${{ pending.toLocaleString() }}</strong>
          </div>
        </div>

        <div class="paid-progress">
          <div class="paid-bar" :style="{ width: paidPct + '%' }"></div>
        </div>
        <p class="paid-label">{{ paidPct }}% cobrado</p>

        <div class="dates-grid">
          <div class="date-item">
            <span class="date-label">Inicio</span>
            <span class="date-val">{{ formatDate(project.startDate) }}</span>
          </div>
          <div class="date-item">
            <span class="date-label">Entrega</span>
            <span class="date-val">{{ formatDate(project.deliveryDate) }}</span>
          </div>
        </div>
      </div>

      <!-- Todo Card -->
      <div class="card">
        <TodoList :projectId="projectId" />
      </div>

      <!-- Notes Card -->
      <div class="card notes-card">
        <div class="notes-header">
          <h3 class="card-title"><FileText :size="15" /> Notas</h3>
          <button v-if="!editingNotes" class="icon-btn" @click="startEditNotes">
            <Pencil :size="13" />
          </button>
          <button v-else class="icon-btn success" @click="saveNotes" :disabled="savingNotes">
            <Loader2 v-if="savingNotes" :size="13" class="spin" />
            <Check v-else :size="13" />
          </button>
        </div>
        <textarea
          v-if="editingNotes"
          v-model="notesValue"
          class="notes-editor"
          rows="8"
          placeholder="Escribe tus notas aquí..."
          ref="notesRef"
        ></textarea>
        <p v-else-if="project.notes" class="notes-content">{{ project.notes }}</p>
        <p v-else class="notes-empty">Sin notas. Usa el icono <Pencil :size="12" style="display:inline;vertical-align:middle;" /> para añadir.</p>
      </div>

      <!-- Milestones Card -->
      <div class="card">
        <PaymentMilestones :projectId="projectId" :totalAmount="project?.totalAmount" />
      </div>

      <!-- Documents Card -->
      <div class="card">
        <DocumentsSection :projectId="projectId" />
      </div>
    </div>

    <ProjectModal v-if="showModal" :project="project" @close="showModal = false" />
  </div>

  <div v-else-if="loading" class="loading-page">
    <Loader2 :size="32" class="spin" />
  </div>

  <div v-else class="not-found">
    <p>Proyecto no encontrado.</p>
    <RouterLink to="/">Volver al Dashboard</RouterLink>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useRoute, RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  ChevronRight, Building2, Pencil, Archive, RefreshCw, Clock,
  DollarSign, FileText, Check, Loader2, CheckCheck, Heart,
} from 'lucide-vue-next'
import { useProjectsStore } from '@/stores/projects'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import PriorityBadge from '@/components/ui/PriorityBadge.vue'
import ServiceBadge from '@/components/ui/ServiceBadge.vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import TodoList from '@/components/projects/TodoList.vue'
import PaymentMilestones from '@/components/projects/PaymentMilestones.vue'
import DocumentsSection from '@/components/projects/DocumentsSection.vue'
import ProjectModal from '@/components/projects/ProjectModal.vue'

const route = useRoute()
const router = useRouter()
const store = useProjectsStore()
const toast = useToast()
const projectId = computed(() => route.params.id)
const loading = computed(() => store.loading)
const showModal = ref(false)

// Live milestone subscription for accurate finance calculation
const milestones = ref([])
let unsubMilestones = null

watch(projectId, (id) => {
  if (unsubMilestones) unsubMilestones()
  if (id) {
    unsubMilestones = store.subscribeMilestones(id, (data) => {
      milestones.value = data
    })
  }
}, { immediate: true })

onUnmounted(() => { if (unsubMilestones) unsubMilestones() })
const editingNotes = ref(false)
const notesValue = ref('')
const savingNotes = ref(false)
const notesRef = ref(null)


const project = computed(() =>
  store.projects.find((p) => p.id === projectId.value) ?? null
)


const milestonesCollectedLive = computed(() =>
  milestones.value.filter((m) => m.paid).reduce((sum, m) => sum + (m.amount || 0), 0)
)

const totalCollected = computed(() => {
  const p = project.value
  if (!p) return 0
  const raw = (p.advanceAmount || 0) + milestonesCollectedLive.value
  return Math.min(raw, p.totalAmount || 0) // never exceed total
})

const pending = computed(() => {
  const p = project.value
  if (!p) return 0
  return Math.max(0, (p.totalAmount || 0) - totalCollected.value)
})

const paidPct = computed(() => {
  const p = project.value
  if (!p || !p.totalAmount) return 0
  return Math.min(100, Math.round((totalCollected.value / p.totalAmount) * 100))
})

function formatDate(val) {
  if (!val) return '—'
  const d = val?.toDate?.() ?? new Date(val)
  return d.toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })
}

const daysRemaining = computed(() => {
  if (!project.value?.deliveryDate) return null
  const d = project.value.deliveryDate?.toDate?.() ?? new Date(project.value.deliveryDate)
  return Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24))
})

const daysRemainingText = computed(() => {
  const d = daysRemaining.value
  if (d === null) return '—'
  if (d < 0) return `Vencido hace ${Math.abs(d)} días`
  if (d === 0) return 'Vence hoy'
  if (d === 1) return '1 día restante'
  return `${d} días restantes`
})

const daysClass = computed(() => {
  const d = daysRemaining.value
  if (d === null) return 'neutral'
  if (d < 0) return 'overdue'
  if (d <= 3) return 'critical'
  if (d <= 7) return 'warning'
  return 'ok'
})

async function changeStatus(status) {
  const extra = status === 'archived' ? { closedAt: new Date().toISOString() } : {}
  await store.updateProject(projectId.value, { status, ...extra })
  const labels = { archived: 'Proyecto archivado', active: 'Proyecto reactivado' }
  toast.success(labels[status] || 'Estado actualizado')
}

async function closeProject() {
  const { confirm } = useConfirm()
  const ok = await confirm('Cerrar proyecto como terminado y pagado? Se movera al archivo.')
  if (!ok) return
  try {
    await store.updateProject(projectId.value, { status: 'archived', waitingClose: false, closedAt: new Date().toISOString() })
    toast.success('Proyecto cerrado y archivado')
    router.push('/')
  } catch {
    toast.error('Error al cerrar el proyecto')
  }
}

async function startEditNotes() {
  notesValue.value = project.value?.notes || ''
  editingNotes.value = true
  await nextTick()
  notesRef.value?.focus()
}

async function saveNotes() {
  savingNotes.value = true
  await store.updateProject(projectId.value, { notes: notesValue.value })
  savingNotes.value = false
  editingNotes.value = false
  toast.success('Notas guardadas')
}
</script>

<style scoped>
.detail-page {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.loading-page,
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 16px;
  color: var(--color-text-muted);
}

.not-found a {
  color: var(--color-brand-light);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 20px;
}

.breadcrumb a {
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.15s;
}

.breadcrumb a:hover {
  color: var(--color-brand-light);
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
}

.badges-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.kind-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 700;
}

.probono-badge {
  background: color-mix(in srgb, #ec4899 12%, transparent);
  color: #ec4899;
  border: 1px solid color-mix(in srgb, #ec4899 30%, transparent);
}

.personal-badge {
  background: color-mix(in srgb, var(--color-brand) 15%, transparent);
  color: var(--color-brand-light);
  border: 1px solid color-mix(in srgb, var(--color-brand) 30%, transparent);
  font-family: Georgia, serif;
}

.detail-header h1 {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0 0 6px;
  letter-spacing: -0.02em;
}

.client-name {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-outline {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-outline:hover {
  border-color: var(--color-brand);
  color: var(--color-brand-light);
}

.btn-outline.warning:hover {
  border-color: var(--color-archived);
  color: var(--color-archived);
}

.btn-outline.close-btn-action {
  border-color: color-mix(in srgb, #06b6d4 40%, transparent);
  color: #06b6d4;
}

.btn-outline.close-btn-action:hover {
  background: color-mix(in srgb, #06b6d4 10%, transparent);
}

.btn-outline.success:hover {
  border-color: var(--color-active);
  color: var(--color-active);
}

.countdown-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-radius: 12px;
  border: 1px solid;
  margin-bottom: 24px;
}

.countdown-banner.ok {
  background: color-mix(in srgb, var(--color-active) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-active) 25%, transparent);
}

.countdown-banner.warning {
  background: color-mix(in srgb, var(--color-pending) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-pending) 30%, transparent);
}

.countdown-banner.critical,
.countdown-banner.overdue {
  background: color-mix(in srgb, var(--color-rejected) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-rejected) 30%, transparent);
}

.countdown-banner.neutral {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

.countdown-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.countdown-date {
  font-weight: 600;
  color: var(--color-text-primary);
}

.countdown-days {
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-text-primary);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 20px;
  transition: border-color 0.15s;
}

.card:hover {
  border-color: var(--color-border-light);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 16px;
}

.finance-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.finance-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

.finance-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.finance-row.total {
  font-weight: 700;
}

.muted-val {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-style: italic;
  font-weight: 500;
}

.finance-row.highlight-row {
  background: color-mix(in srgb, var(--color-active) 6%, transparent);
  margin: 0 -8px;
  padding: 8px 8px;
  border-radius: 6px;
  border-bottom: none;
}

.finance-row span {
  color: var(--color-text-secondary);
}

.finance-row strong {
  color: var(--color-text-primary);
}

.finance-row strong.green {
  color: var(--color-active);
}

.finance-row strong.orange {
  color: var(--color-pending);
}

.paid-progress {
  height: 5px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.paid-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-active), #34d399);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.paid-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0 0 16px;
}

.dates-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.date-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.date-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.date-val {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.notes-card .notes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.notes-card .card-title {
  margin-bottom: 0;
}

.icon-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.icon-btn:hover {
  border-color: var(--color-brand);
  color: var(--color-brand-light);
}

.icon-btn.success {
  border-color: var(--color-active);
  color: var(--color-active);
}

.notes-editor {
  width: 100%;
  min-height: 160px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  padding: 10px 12px;
  font-size: 0.875rem;
  font-family: inherit;
  line-height: 1.6;
  outline: none;
  resize: vertical;
  transition: border-color 0.15s;
}

.notes-editor:focus {
  border-color: var(--color-brand);
}

.notes-content {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
}

.notes-empty {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-style: italic;
  margin: 0;
}

.spin {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
