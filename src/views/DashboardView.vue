<template>
  <div class="dashboard">
    <div class="dash-header">
      <div class="header-text">
        <h1>{{ greeting }}, {{ firstName }}</h1>
        <p>Aquí está el resumen de tus proyectos activos.</p>
      </div>
      <div class="header-btns">
        <button class="btn-outline-sm" @click="exportCSV" title="Exportar a CSV">
          <Download :size="15" />
          <span class="btn-label">Exportar</span>
        </button>
        <button class="btn-new" @click="openNewProject">
          <Plus :size="16" />
          Nuevo Proyecto
        </button>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon active-icon"><Briefcase :size="20" /></div>
        <div>
          <p class="stat-value">{{ activeProjects.length }}</p>
          <p class="stat-label">Proyectos Activos</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon pending-icon"><Clock :size="20" /></div>
        <div>
          <p class="stat-value">{{ pendingProjects.length }}</p>
          <p class="stat-label">En Espera</p>
        </div>
      </div>
      <div class="stat-card highlight">
        <div class="stat-icon revenue-icon"><DollarSign :size="20" /></div>
        <div>
          <p class="stat-value">${{ totalRevenue.toLocaleString() }}</p>
          <p class="stat-label">Valor Total Activo</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon deadline-icon"><AlertTriangle :size="20" /></div>
        <div>
          <p class="stat-value">{{ urgentCount }}</p>
          <p class="stat-label">Urgentes (&lt; 7 días)</p>
        </div>
      </div>
    </div>

    <!-- Finance bar -->
    <div class="finance-bar">
      <div class="finance-item">
        <span class="fi-label">Cobrado</span>
        <span class="fi-value collected">${{ totalCollected.toLocaleString() }}</span>
      </div>
      <div class="fi-sep"></div>
      <div class="finance-item">
        <span class="fi-label">Por cobrar</span>
        <span class="fi-value pending">${{ totalPending.toLocaleString() }}</span>
      </div>
      <div class="fi-sep"></div>
      <div class="finance-item">
        <span class="fi-label">Pro bono</span>
        <span class="fi-value probono">{{ probonoCount }} proyecto{{ probonoCount !== 1 ? 's' : '' }}</span>
      </div>
      <div class="fi-progress">
        <div class="fi-bar" :style="{ width: collectedPct + '%' }"></div>
      </div>
    </div>

    <!-- Projects Table -->
    <div class="section-card">
      <div class="card-header">
        <h2><LayoutList :size="16" /> Proyectos</h2>
        <div class="header-right">
          <div class="search-wrap">
            <Search :size="14" class="search-icon" />
            <input v-model="search" class="search-input" placeholder="Buscar proyecto o cliente..." />
          </div>
        <div class="filter-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="tab-btn"
            :class="{ active: activeTab === tab.value }"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
            <span class="tab-count">{{ tabCount(tab.value) }}</span>
          </button>
        </div>
        </div>
      </div>

      <div v-if="isClientFilter" class="global-search-banner client-banner">
        <User :size="13" />
        Filtrando por cliente: <strong>{{ clientFilter }}</strong>
        <button @click="clientFilter = ''" class="clear-search">Limpiar <X :size="11" /></button>
      </div>

      <div v-if="isGlobalSearch" class="global-search-banner">
        <Search :size="13" />
        Buscando en todos los estados — {{ filteredProjects.length }} resultado{{ filteredProjects.length !== 1 ? 's' : '' }}
        <button @click="search = ''" class="clear-search">Limpiar <X :size="11" /></button>
      </div>

      <div v-if="store.loading" class="loading-state">
        <Loader2 :size="24" class="spin" />
      </div>

      <div v-else-if="!filteredProjects.length" class="empty-state">
        <FolderOpen :size="32" />
        <p>Sin proyectos en esta categoría</p>
        <button v-if="activeTab === 'active'" class="btn-new-sm" @click="openNewProject">
          Crear primer proyecto
        </button>
      </div>

      <template v-else>
        <!-- Mobile cards -->
        <div class="mobile-cards">
          <div
            v-for="p in filteredProjects"
            :key="p.id + '-m'"
            class="mobile-card"
            @click="openDrawer(p)"
          >
            <div class="mc-top">
              <div class="mc-badges">
                <StatusBadge :status="p.status" />
                <span v-if="p.waitingClose" class="waiting-badge"><Hourglass :size="10" /> Pend. cierre</span>
                <span v-if="p.probono" class="probono-tag"><Heart :size="10" /> Pro Bono</span>
                <span v-if="p.isPersonal" class="personal-tag">φ Propio</span>
              </div>
              <div class="mc-actions" @click.stop>
                <button class="action-btn" @click="editProject(p)"><Pencil :size="13" /></button>
                <button class="action-btn danger" @click="archiveProject(p)"><Archive :size="13" /></button>
              </div>
            </div>
            <p class="mc-title">{{ p.title }}</p>
            <p class="mc-client client-link" @click.stop="clientFilter = clientFilter === p.client ? '' : p.client">{{ p.client }}</p>
            <div class="mc-footer">
              <span class="days-badge" :class="daysClass(p.deliveryDate)">{{ daysRemaining(p.deliveryDate) }}</span>
              <span class="mc-amount">
                <span v-if="p.probono || p.isPersonal" class="probono-amount">{{ p.probono ? 'Pro Bono' : 'Propio' }}</span>
                <span v-else-if="p.priceUndefined" class="undefined-amount">Por definir</span>
                <span v-else>${{ (p.totalAmount || 0).toLocaleString() }}</span>
              </span>
              <PriorityBadge :priority="p.priority || 'medium'" />
            </div>
          </div>
        </div>

        <!-- Desktop table -->
        <table class="projects-table">
        <thead>
          <tr>
            <th @click="setSort('title')" class="sortable">
              <span class="th-inner">Proyecto <SortIcon field="title" /></span>
            </th>
            <th @click="setSort('client')" class="sortable">
              <span class="th-inner">Cliente <SortIcon field="client" /></span>
            </th>
            <th @click="setSort('deliveryDate')" class="sortable">
              <span class="th-inner">Entrega <SortIcon field="deliveryDate" /></span>
            </th>
            <th @click="setSort('daysLeft')" class="sortable">
              <span class="th-inner">Días rest. <SortIcon field="daysLeft" /></span>
            </th>
            <th @click="setSort('totalAmount')" class="sortable">
              <span class="th-inner">Monto <SortIcon field="totalAmount" /></span>
            </th>
            <th @click="setSort('priority')" class="sortable">
              <span class="th-inner">Prioridad <SortIcon field="priority" /></span>
            </th>
            <th>Servicio</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in filteredProjects"
            :key="p.id"
            class="project-row"
            :class="{ 'row-selected': drawerProject?.id === p.id }"
            @click="openDrawer(p)"
          >
            <td class="td-title">
              <span class="title-text">{{ p.title }}</span>
              <span v-if="p.probono" class="probono-tag">
                <Heart :size="10" /> Pro Bono
              </span>
              <span v-if="p.isPersonal" class="personal-tag">φ Propio</span>
              <span class="content-indicators">
                <ListTodo v-if="p.todosCount > 0" :size="12" class="ind-icon" title="Tiene tareas" />
                <FileText v-if="p.notes?.trim()" :size="12" class="ind-icon" title="Tiene notas" />
                <FolderOpen v-if="p.docsCount > 0" :size="12" class="ind-icon" title="Tiene archivos" />
              </span>
            </td>
            <td class="td-secondary">
              <span class="client-link" @click.stop="clientFilter = clientFilter === p.client ? '' : p.client">
                {{ p.client }}
              </span>
            </td>
            <td class="td-secondary">{{ formatDate(p.deliveryDate) }}</td>
            <td>
              <span class="days-badge" :class="daysClass(p.deliveryDate)">
                {{ daysRemaining(p.deliveryDate) }}
              </span>
            </td>
            <td class="td-amount">
              <span v-if="p.probono || p.isPersonal" class="probono-amount">
                {{ p.probono ? 'Pro Bono' : 'Propio' }}
              </span>
              <span v-else-if="p.priceUndefined" class="undefined-amount">Por definir</span>
              <span v-else>${{ (p.totalAmount || 0).toLocaleString() }}</span>
            </td>
            <td><PriorityBadge :priority="p.priority || 'medium'" /></td>
            <td><ServiceBadge :service="p.serviceType || 'other'" /></td>
            <td>
              <div class="status-cell">
                <StatusBadge :status="p.status" />
                <span v-if="p.waitingClose" class="waiting-badge">
                  <Hourglass :size="10" /> Pend. cierre
                </span>
              </div>
            </td>
            <td @click.stop>
              <div class="row-actions">
                <button class="action-btn" title="Editar" @click="editProject(p)">
                  <Pencil :size="13" />
                </button>
                <button class="action-btn danger" title="Archivar" @click="archiveProject(p)">
                  <Archive :size="13" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      </template>
    </div>

    <ProjectModal
      v-if="showModal"
      :project="editingProject"
      @close="closeModal"
      @saved="onSaved"
    />

    <ProjectDrawer
      v-if="drawerProject"
      :project="drawerProject"
      @close="drawerProject = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  Plus, Briefcase, Clock, DollarSign, AlertTriangle,
  LayoutList, FolderOpen, Loader2, Pencil, Archive,
  ArrowUp, ArrowDown, ArrowUpDown, Heart, Search, X, User,
  ListTodo, FileText, Hourglass, Download,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import PriorityBadge from '@/components/ui/PriorityBadge.vue'
import ServiceBadge from '@/components/ui/ServiceBadge.vue'
import ProjectModal from '@/components/projects/ProjectModal.vue'
import ProjectDrawer from '@/components/projects/ProjectDrawer.vue'

const router = useRouter()
const authStore = useAuthStore()
const store = useProjectsStore()
const { user } = storeToRefs(authStore)
const { projects } = storeToRefs(store)

const toast = useToast()
const { confirm } = useConfirm()

const showModal = ref(false)
const editingProject = ref(null)
const drawerProject = ref(null)
const activeTab = ref('active')
const search = ref('')
const clientFilter = ref('')

// Inline sort icon component
const SortIcon = (props) => {
  if (sortKey.value !== props.field) return h(ArrowUpDown, { size: 12, style: 'opacity:0.3' })
  return sortDir.value === 'asc'
    ? h(ArrowUp, { size: 12 })
    : h(ArrowDown, { size: 12 })
}

const sortKey = ref(null)
const sortDir = ref('asc')

function setSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

const firstName = computed(() => {
  const name = user.value?.displayName || user.value?.email || 'usuario'
  return name.split(/[\s@]/)[0]
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
})

const activeProjects = computed(() => projects.value.filter((p) => p.status === 'active'))
const pendingProjects = computed(() => projects.value.filter((p) => p.status === 'pending'))

const billableActive = computed(() => activeProjects.value.filter((p) => !p.probono && !p.isPersonal))
const totalRevenue   = computed(() => billableActive.value.reduce((sum, p) => sum + (p.totalAmount || 0), 0))
const totalCollected = computed(() => billableActive.value.reduce((sum, p) =>
  sum + (p.advanceAmount || 0) + (p.milestonesCollected || 0), 0))
const totalPending   = computed(() => Math.max(0, totalRevenue.value - totalCollected.value))
const probonoCount   = computed(() => activeProjects.value.filter((p) => p.probono).length)
const collectedPct   = computed(() =>
  totalRevenue.value ? Math.round((totalCollected.value / totalRevenue.value) * 100) : 0
)

function daysRemaining(deliveryDate) {
  if (!deliveryDate) return '—'
  const d = deliveryDate?.toDate?.() ?? new Date(deliveryDate)
  const diff = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return `${Math.abs(diff)}d vencido`
  if (diff === 0) return 'Hoy'
  return `${diff}d`
}

function daysClass(deliveryDate) {
  if (!deliveryDate) return 'neutral'
  const d = deliveryDate?.toDate?.() ?? new Date(deliveryDate)
  const diff = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'overdue'
  if (diff <= 3) return 'critical'
  if (diff <= 7) return 'warning'
  return 'ok'
}

const urgentCount = computed(() =>
  activeProjects.value.filter((p) => {
    const cls = daysClass(p.deliveryDate)
    return cls === 'critical' || cls === 'overdue'
  }).length
)

const tabs = [
  { label: 'Activos', value: 'active' },
  { label: 'En espera', value: 'pending' },
  { label: 'No aprobado', value: 'not_approved' },
]

const PRIORITY_ORDER = { high: 3, medium: 2, low: 1 }

const isGlobalSearch = computed(() => search.value.trim().length > 0)
const isClientFilter = computed(() => clientFilter.value.length > 0)

const filteredProjects = computed(() => {
  const q = search.value.toLowerCase().trim()
  let list

  if (q) {
    list = projects.value.filter((p) =>
      p.status !== 'archived' &&
      (p.title?.toLowerCase().includes(q) || p.client?.toLowerCase().includes(q))
    )
  } else {
    list = projects.value.filter((p) => p.status === activeTab.value)
  }

  if (clientFilter.value) {
    list = list.filter((p) => p.client === clientFilter.value)
  }

  if (sortKey.value) {
    list = [...list].sort((a, b) => {
      let va = a[sortKey.value]
      let vb = b[sortKey.value]

      if (sortKey.value === 'daysLeft') {
        const toMs = (p) => {
          const d = p.deliveryDate?.toDate?.() ?? (p.deliveryDate ? new Date(p.deliveryDate) : null)
          return d ? d.getTime() : Infinity
        }
        va = toMs(a)
        vb = toMs(b)
      } else if (sortKey.value === 'deliveryDate') {
        va = va?.toDate?.()?.getTime() ?? 0
        vb = vb?.toDate?.()?.getTime() ?? 0
      } else if (sortKey.value === 'priority') {
        va = PRIORITY_ORDER[va] ?? 0
        vb = PRIORITY_ORDER[vb] ?? 0
      } else if (typeof va === 'string') {
        va = va.toLowerCase()
        vb = (vb || '').toLowerCase()
      }

      if (va < vb) return sortDir.value === 'asc' ? -1 : 1
      if (va > vb) return sortDir.value === 'asc' ? 1 : -1
      return 0
    })
  }

  return list
})

function tabCount(status) {
  return projects.value.filter((p) => p.status === status).length
}

function formatDate(val) {
  if (!val) return '—'
  const d = val?.toDate?.() ?? new Date(val)
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}

function openNewProject() {
  editingProject.value = null
  showModal.value = true
}

function editProject(p) {
  editingProject.value = p
  showModal.value = true
}

function openDrawer(p) {
  drawerProject.value = p
}

function closeModal() {
  showModal.value = false
  editingProject.value = null
}

function onSaved(status) {
  // Switch to the tab matching the saved project's status
  if (['active', 'pending', 'not_approved'].includes(status)) {
    activeTab.value = status
  }
}

function exportCSV() {
  const STATUS = { active: 'Activo', pending: 'En espera', not_approved: 'No aprobado', archived: 'Archivado' }
  const PRIORITY = { high: 'Alta', medium: 'Media', low: 'Baja' }
  const fmt = (v) => {
    if (!v) return ''
    const d = v?.toDate?.() ?? new Date(v)
    return d.toLocaleDateString('es')
  }
  const rows = [
    ['Titulo', 'Cliente', 'Estado', 'Prioridad', 'Servicio', 'Monto', 'Cobrado', 'Pendiente', 'Inicio', 'Entrega', 'Pro Bono', 'Personal'],
    ...projects.value.map((p) => [
      p.title,
      p.client,
      STATUS[p.status] ?? p.status,
      PRIORITY[p.priority] ?? '',
      p.serviceType ?? '',
      p.probono || p.isPersonal ? '' : (p.totalAmount ?? ''),
      p.probono || p.isPersonal ? '' : ((p.advanceAmount || 0) + (p.milestonesCollected || 0)),
      p.probono || p.isPersonal ? '' : Math.max(0, (p.totalAmount || 0) - (p.advanceAmount || 0) - (p.milestonesCollected || 0)),
      fmt(p.startDate),
      fmt(p.deliveryDate),
      p.probono ? 'Si' : '',
      p.isPersonal ? 'Si' : '',
    ]),
  ]
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  a.download = `phiprojects_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
}

async function archiveProject(p) {
  const ok = await confirm(`Archivar "${p.title}"?`)
  if (!ok) return
  await store.updateProject(p.id, { status: 'archived', closedAt: new Date().toISOString() })
  toast.success('Proyecto archivado')
}
</script>

<style scoped>
.dashboard {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.dash-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
}

.header-text h1 {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}

.header-text p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.header-btns {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

.btn-outline-sm {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-outline-sm:hover {
  border-color: var(--color-brand);
  color: var(--color-brand-light);
}

.btn-new {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 18px;
  background: var(--color-brand);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}

.btn-new:hover { background: var(--color-brand-dark); }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: border-color 0.15s;
}

.stat-card:hover { border-color: var(--color-border-light); }

.stat-card.highlight {
  border-color: color-mix(in srgb, var(--color-brand) 40%, transparent);
  background: color-mix(in srgb, var(--color-brand) 5%, var(--color-bg-card));
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.active-icon  { background: color-mix(in srgb, var(--color-active) 15%, transparent); color: var(--color-active); }
.pending-icon { background: color-mix(in srgb, var(--color-pending) 15%, transparent); color: var(--color-pending); }
.revenue-icon { background: color-mix(in srgb, var(--color-brand) 20%, transparent); color: var(--color-brand-light); }
.deadline-icon{ background: color-mix(in srgb, var(--color-rejected) 15%, transparent); color: var(--color-rejected); }

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin: 0;
  font-weight: 500;
}

.finance-bar {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 14px 24px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.finance-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.fi-sep {
  width: 1px;
  height: 32px;
  background: var(--color-border);
  margin: 0 24px;
  flex-shrink: 0;
}

.fi-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.fi-value {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.fi-value.collected { color: var(--color-active); }
.fi-value.pending   { color: var(--color-pending); }
.fi-value.probono   { color: #ec4899; font-size: 0.95rem; }

.fi-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-border);
}

.fi-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-active), #34d399);
  transition: width 0.6s ease;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 9px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  padding: 6px 10px 6px 30px;
  font-size: 0.8rem;
  font-family: inherit;
  outline: none;
  width: 200px;
  transition: border-color 0.15s, width 0.2s;
}

.search-input:focus {
  border-color: var(--color-brand);
  width: 240px;
}

.section-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--color-border);
  gap: 16px;
  flex-wrap: wrap;
}

.card-header h2 {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.filter-tabs { display: flex; gap: 4px; }

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 7px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn:hover { color: var(--color-text-secondary); }

.tab-btn.active {
  background: color-mix(in srgb, var(--color-brand) 15%, transparent);
  color: var(--color-brand-light);
  border-color: color-mix(in srgb, var(--color-brand) 30%, transparent);
}

.tab-count {
  background: var(--color-bg-elevated);
  border-radius: 99px;
  padding: 0 6px;
  font-size: 0.7rem;
  font-weight: 700;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.btn-new-sm {
  padding: 8px 16px;
  background: var(--color-brand);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.projects-table {
  width: 100%;
  border-collapse: collapse;
}

.projects-table thead tr {
  border-bottom: 1px solid var(--color-border);
}

.projects-table th {
  padding: 10px 20px;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  user-select: none;
}

.projects-table th.sortable {
  cursor: pointer;
  display: table-cell;
}

.projects-table th.sortable:hover {
  color: var(--color-text-secondary);
}

th.sortable {
  cursor: pointer;
}

th.sortable:hover { color: var(--color-text-secondary); }

.th-inner {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.project-row {
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
  transition: background 0.1s;
}

.project-row:last-child { border-bottom: none; }

.project-row:hover { background: var(--color-bg-elevated); }

.project-row.row-selected {
  background: color-mix(in srgb, var(--color-brand) 8%, transparent);
}

.project-row td {
  padding: 12px 20px;
  font-size: 0.8rem;
  vertical-align: middle;
}

.td-title {
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}

.title-text { flex-shrink: 0; }

.status-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.waiting-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.65rem;
  font-weight: 700;
  color: #f59e0b;
  background: color-mix(in srgb, #f59e0b 12%, transparent);
  border: 1px solid color-mix(in srgb, #f59e0b 30%, transparent);
  padding: 1px 6px;
  border-radius: 99px;
  white-space: nowrap;
}

.content-indicators {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-left: 2px;
}

.ind-icon {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.probono-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.65rem;
  font-weight: 700;
  color: #ec4899;
  background: color-mix(in srgb, #ec4899 12%, transparent);
  padding: 1px 6px;
  border-radius: 99px;
}

.probono-amount {
  font-size: 0.72rem;
  font-weight: 700;
  color: #ec4899;
}

.client-link {
  cursor: pointer;
  border-radius: 4px;
  padding: 1px 4px;
  margin: -1px -4px;
  transition: all 0.15s;
}

.client-link:hover {
  background: color-mix(in srgb, var(--color-brand) 12%, transparent);
  color: var(--color-brand-light);
}

.client-banner {
  background: color-mix(in srgb, #06b6d4 6%, transparent);
}

.global-search-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 24px;
  font-size: 0.78rem;
  color: var(--color-text-secondary);
  background: color-mix(in srgb, var(--color-brand) 6%, transparent);
  border-bottom: 1px solid var(--color-border);
}

.clear-search {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: auto;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-muted);
  font-size: 0.72rem;
  padding: 2px 8px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.clear-search:hover {
  border-color: var(--color-brand);
  color: var(--color-brand-light);
}

.undefined-amount {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text-muted);
  font-style: italic;
}

.personal-tag {
  display: inline-flex;
  align-items: center;
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--color-brand-light);
  background: color-mix(in srgb, var(--color-brand) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-brand) 30%, transparent);
  padding: 1px 6px;
  border-radius: 99px;
  font-family: Georgia, serif;
  letter-spacing: 0.03em;
}

.td-secondary { color: var(--color-text-secondary); white-space: nowrap; }

.td-amount {
  font-weight: 700;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.days-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}

.days-badge.neutral { color: var(--color-text-muted); }
.days-badge.ok      { background: color-mix(in srgb, var(--color-active) 12%, transparent); color: var(--color-active); }
.days-badge.warning { background: color-mix(in srgb, var(--color-pending) 15%, transparent); color: var(--color-pending); }
.days-badge.critical{ background: color-mix(in srgb, var(--color-rejected) 15%, transparent); color: var(--color-rejected); }
.days-badge.overdue { background: color-mix(in srgb, var(--color-rejected) 20%, transparent); color: var(--color-rejected); font-weight: 800; }

.row-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.project-row:hover .row-actions { opacity: 1; }

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover { border-color: var(--color-brand); color: var(--color-brand-light); }
.action-btn.danger:hover { border-color: var(--color-rejected); color: var(--color-rejected); }

.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsive ── */
.mobile-cards { display: none; }

@media (max-width: 767px) {
  .dashboard { padding: 16px; }

  .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .stat-card { padding: 14px; gap: 10px; }
  .stat-icon { width: 36px; height: 36px; }
  .stat-value { font-size: 1.2rem; }

  .finance-bar { flex-wrap: wrap; gap: 12px; padding: 12px 16px; }
  .fi-sep { display: none; }
  .finance-item { flex: 1; min-width: 100px; }

  .dash-header { flex-direction: column; gap: 12px; }
  .dash-header h1 { font-size: 1.3rem; }
  .header-btns { width: 100%; }
  .btn-new { flex: 1; justify-content: center; }
  .btn-outline-sm .btn-label { display: none; }
  .btn-outline-sm { padding: 9px; }

  .card-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .header-right { width: 100%; }
  .search-input { width: 100%; }
  .search-input:focus { width: 100%; }

  .mobile-cards { display: flex; flex-direction: column; gap: 0; }
  .projects-table { display: none; }
}

.mobile-card {
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background 0.1s;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mobile-card:last-child { border-bottom: none; }
.mobile-card:active { background: var(--color-bg-elevated); }

.mc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mc-badges {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.mc-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.mc-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.mc-client {
  font-size: 0.78rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.mc-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mc-amount {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-left: auto;
}

@media (min-width: 768px) and (max-width: 1023px) {
  .dashboard { padding: 20px; }
  .stats-grid { grid-template-columns: 1fr 1fr; }
}
</style>
