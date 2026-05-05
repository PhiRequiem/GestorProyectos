<template>
  <div class="docs-section">
    <div class="section-header">
      <h3><FolderOpen :size="16" /> Documentos</h3>
    </div>

    <p v-if="!documents.length" class="empty-hint">Sin documentos. Agrega contratos, propuestas o referencias.</p>
    <ul class="doc-list">
      <li v-for="d in documents" :key="d.id" class="doc-item">
        <div class="doc-icon" :class="d.type">
          <FileText v-if="d.type === 'contract'" :size="15" />
          <FilePenLine v-else :size="15" />
        </div>
        <div class="doc-info">
          <span class="doc-name">{{ d.name }}</span>
          <span class="doc-type">{{ docTypeLabel(d.type) }}</span>
        </div>
        <a v-if="d.url && isWebUrl(d.url)" :href="d.url" target="_blank" class="doc-link" title="Abrir enlace">
          <ExternalLink :size="13" />
        </a>
        <span v-else-if="d.url" class="doc-path-wrap">
          <FolderSymlink :size="13" />
          <span class="path-tooltip">{{ d.url }}</span>
        </span>
        <button class="del-btn" @click="remove(d.id)"><X :size="13" /></button>
      </li>
    </ul>

    <form class="add-form" @submit.prevent="addNew">
      <select v-model="newType" class="type-select">
        <option value="contract">Contrato</option>
        <option value="proposal">Propuesta</option>
        <option value="reference">Referencia</option>
        <option value="input">Insumo</option>
        <option value="report">Reporte</option>
        <option value="annex">Anexo</option>
        <option value="other">Otro</option>
      </select>
      <input v-model="newName" placeholder="Nombre del documento..." />
      <input v-model="newUrl" placeholder="URL o ruta del archivo (opcional)" />
      <button type="submit" :disabled="!newName.trim()">
        <Plus :size="16" />
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { FolderOpen, FileText, FilePenLine, ExternalLink, FolderSymlink, X, Plus } from 'lucide-vue-next'
import { useProjectsStore } from '@/stores/projects'

const props = defineProps({
  projectId: { type: String, required: true },
})

const store = useProjectsStore()

const DOC_LABELS = {
  contract: 'Contrato', proposal: 'Propuesta', reference: 'Referencia',
  input: 'Insumo', report: 'Reporte', annex: 'Anexo', other: 'Otro',
}
const docTypeLabel = (type) => DOC_LABELS[type] ?? type
const isWebUrl = (val) => /^https?:\/\//i.test(val)
const documents = ref([])
const newType = ref('contract')
const newName = ref('')
const newUrl = ref('')

const unsub = store.subscribeDocuments(props.projectId, (data) => {
  documents.value = data
})
onUnmounted(() => unsub())

async function remove(id) {
  await store.deleteDocument(props.projectId, id)
}

async function addNew() {
  if (!newName.value.trim()) return
  await store.addDocument(props.projectId, {
    type: newType.value,
    name: newName.value.trim(),
    url: newUrl.value.trim(),
  })
  newName.value = ''
  newUrl.value = ''
}
</script>

<style scoped>
.docs-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.doc-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.doc-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 6px;
  transition: background 0.1s;
}

.doc-item:hover {
  background: var(--color-bg-elevated);
}

.doc-item:hover .del-btn {
  opacity: 1;
}

.doc-icon {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.doc-icon.contract {
  background: color-mix(in srgb, var(--color-brand) 15%, transparent);
  color: var(--color-brand-light);
}

.doc-icon.proposal {
  background: color-mix(in srgb, var(--color-accent) 15%, transparent);
  color: var(--color-accent);
}

.doc-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.doc-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-type {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.doc-link {
  color: var(--color-text-muted);
  padding: 3px;
  border-radius: 4px;
  display: flex;
  transition: color 0.15s;
}

.doc-link:hover {
  color: var(--color-brand-light);
}

.doc-path-wrap {
  position: relative;
  color: var(--color-text-muted);
  padding: 3px;
  border-radius: 4px;
  display: flex;
  cursor: default;
}

.doc-path-wrap:hover { color: var(--color-text-secondary); }

.path-tooltip {
  display: none;
  position: absolute;
  bottom: calc(100% + 6px);
  right: 0;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: 7px;
  padding: 6px 10px;
  font-size: 0.72rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 50;
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  pointer-events: none;
}

.doc-path-wrap:hover .path-tooltip { display: block; }

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

.del-btn:hover {
  color: var(--color-rejected);
}

.add-form {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.type-select {
  width: 110px;
  flex-shrink: 0;
}

.add-form input,
.add-form select {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  padding: 7px 10px;
  font-size: 0.8rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
  flex: 1;
  min-width: 80px;
}

.add-form input:focus,
.add-form select:focus {
  border-color: var(--color-brand);
}

.add-form select option {
  background: var(--color-bg-card);
}

.add-form button {
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

.add-form button:hover:not(:disabled) {
  background: var(--color-brand-dark);
}

.add-form button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
