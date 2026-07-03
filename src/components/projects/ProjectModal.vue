<template>
  <Teleport to="body">
    <div class="modal-backdrop">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ isEdit ? 'Editar Proyecto' : 'Nuevo Proyecto' }}</h2>
          <button class="close-btn" @click="$emit('close')">
            <X :size="18" />
          </button>
        </div>

        <form class="modal-body" @submit.prevent="handleSubmit">
          <div class="form-grid">
            <div class="form-group col-span-2">
              <label>Título del Proyecto *</label>
              <input v-model="form.title" type="text" placeholder="ej. E-commerce para Tienda XYZ" required />
            </div>

            <div class="form-group col-span-2">
              <label>Cliente</label>
              <input v-model="form.client" type="text" placeholder="Nombre del cliente (opcional en proyectos personales)" />
            </div>

            <!-- Tipo de proyecto -->
            <div class="col-span-2 type-toggles">
              <div class="toggle-row" :class="{ active: form.probono }" @click="setProjectKind('probono')">
                <input type="radio" :checked="form.probono" class="toggle-radio" @click.stop />
                <Heart :size="13" class="toggle-icon pink" />
                <span class="toggle-label">Pro Bono</span>
                <span class="toggle-hint">Sin cobro, para cliente</span>
              </div>
              <div class="toggle-row" :class="{ active: form.isPersonal }" @click="setProjectKind('personal')">
                <input type="radio" :checked="form.isPersonal" class="toggle-radio" @click.stop />
                <User :size="13" class="toggle-icon purple" />
                <span class="toggle-label">Proyecto Personal</span>
                <span class="toggle-hint">Sin pago, sin cliente</span>
              </div>
            </div>

            <!-- Postulación a grant (independiente: conserva el monto) -->
            <div class="col-span-2 grant-toggle">
              <div class="toggle-row grant-row" :class="{ active: form.isGrant }" @click="form.isGrant = !form.isGrant">
                <input type="checkbox" :checked="form.isGrant" class="toggle-radio" @click.stop />
                <Landmark :size="13" class="toggle-icon amber" />
                <span class="toggle-label">Postulación a Grant</span>
                <span class="toggle-hint">Convocatoria / financiamiento</span>
              </div>
            </div>

            <!-- Campos específicos de grant -->
            <template v-if="form.isGrant">
              <div class="form-group col-span-2">
                <label>URL de la convocatoria</label>
                <input v-model="form.grantUrl" type="url" placeholder="https://..." />
              </div>
              <div class="form-group col-span-2">
                <label>Organismo / Fundación</label>
                <input v-model="form.funder" type="text" placeholder="ej. CONACYT, NSF, Fundación XYZ" />
              </div>
            </template>

            <!-- Precio -->
            <div class="col-span-2 price-section" :class="{ dimmed: form.probono || form.isPersonal }">
              <div class="price-header">
                <label>{{ form.isGrant ? 'Monto del grant ($)' : 'Monto acordado ($)' }}</label>
                <div class="undefined-toggle" @click="form.priceUndefined = !form.priceUndefined">
                  <input type="checkbox" v-model="form.priceUndefined" @click.stop />
                  <span>Por definir</span>
                </div>
              </div>
              <input
                v-model.number="form.totalAmount"
                type="number"
                placeholder="0"
                min="0"
                :disabled="form.probono || form.isPersonal || form.priceUndefined"
              />
              <p class="price-hint">El adelanto y pagos parciales se registran como hitos de pago.</p>
            </div>

            <div class="form-group">
              <label>Fecha de Inicio</label>
              <input v-model="form.startDate" type="date" />
            </div>

            <div class="form-group">
              <label>
                {{ form.isGrant ? 'Deadline' : 'Fecha de Entrega' }}
                <span v-if="form.status === 'pending'" class="optional-tag">opcional en pendientes</span>
              </label>
              <input v-model="form.deliveryDate" type="date" />
            </div>

            <div class="form-group">
              <label>Estado</label>
              <select v-model="form.status">
                <option value="active">Activo</option>
                <option value="pending">En espera de aprobación</option>
                <option value="not_approved">No aprobado</option>
              </select>
            </div>

            <div class="form-group">
              <label>Prioridad</label>
              <select v-model="form.priority">
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>

            <div class="form-group col-span-2">
              <label>Tipo de Servicio</label>
              <div class="service-row">
                <select v-model="form.serviceType" class="service-select">
                  <option v-if="!settings.serviceTypes.length" value="" disabled>Sin tipos — agrega uno con +</option>
                  <option v-for="t in settings.serviceTypes" :key="t.value" :value="t.value">
                    {{ t.label }}
                  </option>
                </select>
                <button type="button" class="add-type-btn" @click="showAddType = !showAddType" title="Agregar tipo">
                  <Plus :size="15" />
                </button>
              </div>
              <div v-if="showAddType" class="add-type-form">
                <input v-model="newTypeName" placeholder="Nombre del nuevo tipo..." @keydown.enter.prevent="saveNewType" />
                <button type="button" @click="saveNewType" :disabled="!newTypeName.trim()">Agregar</button>
              </div>
            </div>

            <div class="form-group col-span-2">
              <label>Notas Iniciales</label>
              <textarea v-model="form.notes" rows="3" placeholder="Contexto, detalles, minutas..."></textarea>
            </div>
          </div>

          <p v-if="validationError" class="validation-error">{{ validationError }}</p>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" @click="$emit('close')">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              <Loader2 v-if="saving" :size="15" class="spin" />
              {{ isEdit ? 'Guardar Cambios' : 'Crear Proyecto' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { X, Loader2, Plus, Heart, User, Landmark } from 'lucide-vue-next'
import { useProjectsStore } from '@/stores/projects'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  project: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

function onKeyDown(e) { if (e.key === 'Escape' && !saving.value) emit('close') }
onMounted(() => document.addEventListener('keydown', onKeyDown))
onUnmounted(() => document.removeEventListener('keydown', onKeyDown))
const store = useProjectsStore()
const settings = useSettingsStore()
const toast = useToast()
const saving = ref(false)
const isEdit = computed(() => !!props.project)
const showAddType = ref(false)
const newTypeName = ref('')
const validationError = ref('')

const toDateInput = (val) => {
  if (!val) return ''
  const d = val?.toDate?.() ?? new Date(val)
  return d.toISOString().split('T')[0]
}

const form = ref({
  title: props.project?.title || '',
  client: props.project?.client || '',
  probono: props.project?.probono || false,
  isPersonal: props.project?.isPersonal || false,
  isGrant: props.project?.isGrant || false,
  grantUrl: props.project?.grantUrl || '',
  funder: props.project?.funder || '',
  priceUndefined: props.project?.priceUndefined || false,
  totalAmount: props.project?.totalAmount || 0,
  startDate: toDateInput(props.project?.startDate),
  deliveryDate: toDateInput(props.project?.deliveryDate),
  status: props.project?.status || 'active',
  priority: props.project?.priority || 'medium',
  serviceType: props.project?.serviceType || '',
  notes: props.project?.notes || '',
})

function setProjectKind(kind) {
  const wasPersonal = form.value.isPersonal
  form.value.probono = kind === 'probono' ? !form.value.probono : false
  form.value.isPersonal = kind === 'personal' ? !form.value.isPersonal : false

  if (form.value.isPersonal && !wasPersonal) {
    form.value.client = 'φ'
  } else if (!form.value.isPersonal && wasPersonal && form.value.client === 'φ') {
    form.value.client = ''
  }
}

// Clear price when switching to no-pay mode
watch([() => form.value.probono, () => form.value.isPersonal], ([pb, pp]) => {
  if (pb || pp) {
    form.value.totalAmount = 0
    form.value.priceUndefined = false
  }
})

async function saveNewType() {
  if (!newTypeName.value.trim()) return
  const value = await settings.addServiceType(newTypeName.value)
  if (value) form.value.serviceType = value
  newTypeName.value = ''
  showAddType.value = false
}

async function handleSubmit() {
  validationError.value = ''

  if (form.value.startDate && form.value.deliveryDate && form.value.deliveryDate < form.value.startDate) {
    validationError.value = 'La fecha de entrega no puede ser antes que la de inicio.'
    return
  }

  saving.value = true
  const noPay = form.value.probono || form.value.isPersonal
  const payload = {
    ...form.value,
    totalAmount: noPay ? 0 : (form.value.priceUndefined ? null : form.value.totalAmount),
    advanceAmount: 0,
    startDate: form.value.startDate || null,
    deliveryDate: form.value.deliveryDate || null,
    grantUrl: form.value.isGrant ? (form.value.grantUrl || '') : '',
    funder: form.value.isGrant ? (form.value.funder || '') : '',
  }
  try {
    if (isEdit.value) {
      await store.updateProject(props.project.id, payload)
      toast.success('Proyecto actualizado')
    } else {
      await store.createProject(payload)
      toast.success('Proyecto creado')
    }
    emit('saved', payload.status)
    emit('close')
  } catch {
    toast.error('Error al guardar. Intenta de nuevo.')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: 16px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
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

.modal-body {
  padding: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.col-span-2 {
  grid-column: 1 / -1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: opacity 0.2s;
}

.form-group.dimmed {
  opacity: 0.35;
  pointer-events: none;
}

.form-group label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  letter-spacing: 0.02em;
}

.form-group input,
.form-group select,
.form-group textarea {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  padding: 9px 12px;
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--color-brand);
}

.form-group textarea { resize: vertical; }

.form-group select option {
  background: var(--color-bg-card);
}

input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(0.5);
}

/* Optional tag */
.optional-tag {
  font-size: 0.68rem;
  font-weight: 500;
  color: var(--color-text-muted);
  margin-left: 6px;
  font-style: italic;
}

/* Project kind toggles */
.type-toggles {
  display: flex;
  gap: 8px;
}

.toggle-row {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 12px;
  border-radius: 9px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  cursor: pointer;
  transition: all 0.15s;
}

.toggle-row.active {
  border-color: color-mix(in srgb, var(--color-brand) 40%, transparent);
  background: color-mix(in srgb, var(--color-brand) 6%, var(--color-bg-elevated));
}

.toggle-row.active:first-child {
  border-color: color-mix(in srgb, #ec4899 40%, transparent);
  background: color-mix(in srgb, #ec4899 6%, var(--color-bg-elevated));
}

.toggle-radio {
  width: 14px;
  height: 14px;
  accent-color: var(--color-brand);
  cursor: pointer;
  flex-shrink: 0;
  margin: 0;
}

.toggle-icon { flex-shrink: 0; }
.toggle-icon.pink { color: #ec4899; }
.toggle-icon.purple { color: var(--color-accent); }
.toggle-icon.amber { color: #f59e0b; }

/* Grant toggle (full width, independent of no-pay kinds) */
.grant-toggle { display: flex; }
.grant-row { flex: 1; }
.grant-row.active {
  border-color: color-mix(in srgb, #f59e0b 40%, transparent) !important;
  background: color-mix(in srgb, #f59e0b 6%, var(--color-bg-elevated)) !important;
}
.grant-row .toggle-radio { accent-color: #f59e0b; }

.toggle-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-primary);
  flex: 1;
}

.toggle-hint {
  font-size: 0.68rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* Price section */
.price-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: opacity 0.2s;
}

.price-section.dimmed {
  opacity: 0.35;
  pointer-events: none;
}

.price-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price-header label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.undefined-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  cursor: pointer;
}

.undefined-toggle input {
  width: 13px;
  height: 13px;
  accent-color: var(--color-brand);
  cursor: pointer;
  margin: 0;
}

.price-section input {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  padding: 9px 12px;
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
}

.price-section input:focus { border-color: var(--color-brand); }
.price-section input:disabled { opacity: 0.5; }

.price-hint {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  margin: 0;
}

/* Pro bono (legacy, kept for compat) */
.probono-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 9px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  user-select: none;
}

.probono-row.active {
  border-color: color-mix(in srgb, #ec4899 40%, transparent);
  background: color-mix(in srgb, #ec4899 6%, var(--color-bg-elevated));
}

.probono-check {
  width: 15px;
  height: 15px;
  accent-color: #ec4899;
  cursor: pointer;
  flex-shrink: 0;
  margin: 0;
}

.probono-icon {
  color: #ec4899;
  flex-shrink: 0;
}

.probono-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  flex: 1;
}

.probono-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

/* Service type */
.service-row {
  display: flex;
  gap: 6px;
}

.service-select {
  flex: 1;
}

.add-type-btn {
  padding: 0 10px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.15s;
  flex-shrink: 0;
}

.add-type-btn:hover {
  border-color: var(--color-brand);
  color: var(--color-brand-light);
}

.add-type-form {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.add-type-form input {
  flex: 1;
}

.add-type-form button {
  padding: 8px 14px;
  background: var(--color-brand);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}

.add-type-form button:hover:not(:disabled) {
  background: var(--color-brand-dark);
}

.add-type-form button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.btn-primary {
  background: var(--color-brand);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-brand-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  color: var(--color-text-primary);
}

.validation-error {
  font-size: 0.8rem;
  color: var(--color-rejected);
  background: color-mix(in srgb, var(--color-rejected) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-rejected) 25%, transparent);
  border-radius: 8px;
  padding: 8px 12px;
  margin: 0 0 12px;
}

.spin {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 600px) {
  .modal-backdrop { padding: 0; align-items: flex-end; }
  .modal {
    max-width: 100%;
    max-height: 92vh;
    border-radius: 16px 16px 0 0;
  }
  .modal-header { padding: 16px 18px; }
  .modal-body { padding: 18px; }
  .form-grid { grid-template-columns: 1fr; gap: 14px; }
  .type-toggles { flex-direction: column; }
  .modal-footer { position: sticky; bottom: 0; }
  .btn-primary, .btn-secondary { flex: 1; justify-content: center; }
}
</style>
