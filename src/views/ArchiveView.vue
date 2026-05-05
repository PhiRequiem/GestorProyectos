<template>
  <div class="archive-page">
    <div class="page-header">
      <div>
        <h1><Archive :size="22" /> Archivo Histórico</h1>
        <p>Proyectos cerrados y propuestas no aprobadas.</p>
      </div>
    </div>

    <!-- Yearly summary (only for archived) -->
    <div v-if="activeTab === 'archived' && yearSummaries.length" class="year-summaries">
      <div v-for="ys in yearSummaries" :key="ys.year" class="year-card">
        <span class="year-label">{{ ys.year }}</span>
        <div class="year-stats">
          <div class="ys-stat">
            <span class="ys-val">{{ ys.count }}</span>
            <span class="ys-lbl">proyecto{{ ys.count !== 1 ? 's' : '' }}</span>
          </div>
          <div class="ys-sep"></div>
          <div class="ys-stat">
            <span class="ys-val green">${{ ys.revenue.toLocaleString() }}</span>
            <span class="ys-lbl">facturado</span>
          </div>
          <div v-if="ys.probono" class="ys-sep"></div>
          <div v-if="ys.probono" class="ys-stat">
            <span class="ys-val pink">{{ ys.probono }} pro bono</span>
          </div>
        </div>
      </div>
    </div>

    <div class="filter-bar">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-btn"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
        <span class="tab-count">{{ countByStatus(tab.value) }}</span>
      </button>
    </div>

    <div v-if="store.loading" class="loading-state">
      <Loader2 :size="24" class="spin" />
    </div>

    <div v-else-if="!filteredProjects.length" class="empty-state">
      <FolderOpen :size="36" />
      <p>No hay proyectos en esta categoría.</p>
    </div>

    <div v-else class="projects-grid">
      <div
        v-for="p in filteredProjects"
        :key="p.id"
        class="archive-card"
        @click="router.push(`/projects/${p.id}`)"
      >
        <div class="card-top">
          <StatusBadge :status="p.status" />
          <ServiceBadge :service="p.serviceType || 'other'" />
          <span v-if="p.probono" class="probono-tag">Pro Bono</span>
        </div>

        <h3>{{ p.title }}</h3>
        <p class="client">{{ p.client }}</p>

        <div class="card-stats">
          <div class="stat">
            <span class="stat-lbl">Facturado</span>
            <span class="stat-val" :class="p.probono ? 'pink' : ''">
              {{ p.probono ? 'Pro Bono' : '$' + (p.totalAmount || 0).toLocaleString() }}
            </span>
          </div>
          <div class="stat">
            <span class="stat-lbl">Cierre</span>
            <span class="stat-val">{{ formatDate(p.closedAt || p.updatedAt) }}</span>
          </div>
        </div>

        <div class="card-footer">
          <button class="restore-btn" @click.stop="restore(p)">
            <RefreshCw :size="13" />
            Reactivar
          </button>
          <button class="del-btn" @click.stop="confirmDelete(p)">
            <Trash2 :size="13" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Archive, FolderOpen, Loader2, RefreshCw, Trash2 } from 'lucide-vue-next'
import { useProjectsStore } from '@/stores/projects'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import ServiceBadge from '@/components/ui/ServiceBadge.vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const router = useRouter()
const store = useProjectsStore()
const { projects } = storeToRefs(store)
const activeTab = ref('archived')
const toast = useToast()
const { confirm } = useConfirm()

const tabs = [
  { label: 'Archivados', value: 'archived' },
  { label: 'No aprobados', value: 'not_approved' },
]

const filteredProjects = computed(() =>
  projects.value.filter((p) => p.status === activeTab.value)
)

const archivedProjects = computed(() =>
  projects.value.filter((p) => p.status === 'archived')
)

const yearSummaries = computed(() => {
  const map = {}
  for (const p of archivedProjects.value) {
    const raw = p.closedAt ?? p.updatedAt
    const d = raw?.toDate?.() ?? (raw ? new Date(raw) : null)
    const year = d ? d.getFullYear() : 'Sin fecha'
    if (!map[year]) map[year] = { year, count: 0, revenue: 0, probono: 0 }
    map[year].count++
    if (p.probono) map[year].probono++
    else map[year].revenue += p.totalAmount || 0
  }
  return Object.values(map).sort((a, b) => {
    if (a.year === 'Sin fecha') return 1
    if (b.year === 'Sin fecha') return -1
    return b.year - a.year
  })
})

function countByStatus(status) {
  return projects.value.filter((p) => p.status === status).length
}

function formatDate(val) {
  if (!val) return '—'
  const d = val?.toDate?.() ?? new Date(val)
  return d.toLocaleDateString('es', { month: 'short', year: 'numeric' })
}

async function restore(p) {
  await store.updateProject(p.id, { status: 'active' })
  toast.success(`"${p.title}" reactivado`)
}

async function confirmDelete(p) {
  const ok = await confirm(`Eliminar permanentemente "${p.title}"? Esta accion no se puede deshacer.`, { danger: true })
  if (!ok) return
  await store.deleteProject(p.id)
  toast.success('Proyecto eliminado')
}
</script>

<style scoped>
.archive-page {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}

.page-header p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

/* Year summaries */
.year-summaries {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.year-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 20px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.year-label {
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  min-width: 48px;
}

.year-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ys-stat {
  display: flex;
  align-items: center;
  gap: 5px;
}

.ys-val {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.ys-val.green { color: var(--color-active); }
.ys-val.pink  { color: #ec4899; }

.ys-lbl {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.ys-sep {
  width: 1px;
  height: 16px;
  background: var(--color-border);
}

/* Filter */
.filter-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
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
  padding: 64px 24px;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

/* Cards */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.archive-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.archive-card:hover {
  border-color: var(--color-border-light);
  transform: translateY(-1px);
}

.card-top {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.probono-tag {
  font-size: 0.65rem;
  font-weight: 700;
  color: #ec4899;
  background: color-mix(in srgb, #ec4899 12%, transparent);
  padding: 1px 6px;
  border-radius: 99px;
}

.archive-card h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.client {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.card-stats {
  display: flex;
  gap: 20px;
  padding: 10px 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.stat { display: flex; flex-direction: column; gap: 2px; }

.stat-lbl {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.stat-val {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.stat-val.pink { color: #ec4899; }

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.restore-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--color-active) 30%, transparent);
  background: color-mix(in srgb, var(--color-active) 8%, transparent);
  color: var(--color-active);
  font-size: 0.75rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.restore-btn:hover {
  background: color-mix(in srgb, var(--color-active) 15%, transparent);
}

.del-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.del-btn:hover {
  border-color: var(--color-rejected);
  color: var(--color-rejected);
}

.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
