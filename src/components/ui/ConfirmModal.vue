<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div v-if="pending" class="confirm-backdrop" @click.self="respond(false)">
        <div class="confirm-box">
          <div class="confirm-icon" :class="{ danger: pending.danger }">
            <AlertTriangle v-if="pending.danger" :size="22" />
            <HelpCircle v-else :size="22" />
          </div>
          <p class="confirm-msg">{{ pending.message }}</p>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="respond(false)">Cancelar</button>
            <button class="btn-confirm" :class="{ danger: pending.danger }" @click="respond(true)">
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { AlertTriangle, HelpCircle } from 'lucide-vue-next'
import { useConfirm } from '@/composables/useConfirm'
const { pending, respond } = useConfirm()
</script>

<style scoped>
.confirm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.confirm-box {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: 16px;
  padding: 28px 24px 20px;
  width: 100%;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.confirm-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-brand) 15%, transparent);
  color: var(--color-brand-light);
}

.confirm-icon.danger {
  background: color-mix(in srgb, var(--color-rejected) 15%, transparent);
  color: var(--color-rejected);
}

.confirm-msg {
  font-size: 0.9rem;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 8px;
  width: 100%;
  margin-top: 4px;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 9px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}

.btn-cancel {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.btn-cancel:hover { color: var(--color-text-primary); }

.btn-confirm {
  background: var(--color-brand);
  color: white;
}

.btn-confirm:hover { background: var(--color-brand-dark); }

.btn-confirm.danger { background: var(--color-rejected); }
.btn-confirm.danger:hover { background: #b91c1c; }

.confirm-enter-active, .confirm-leave-active { transition: all 0.2s ease; }
.confirm-enter-from, .confirm-leave-to { opacity: 0; }
.confirm-enter-from .confirm-box, .confirm-leave-to .confirm-box {
  transform: scale(0.94);
}
</style>
