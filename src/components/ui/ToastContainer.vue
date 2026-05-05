<template>
  <Teleport to="body">
    <div class="toast-wrap">
      <TransitionGroup name="toast" tag="div" class="toast-list">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast"
          :class="t.type"
          @click="remove(t.id)"
        >
          <CheckCircle2 v-if="t.type === 'success'" :size="16" class="toast-icon" />
          <XCircle      v-else-if="t.type === 'error'" :size="16" class="toast-icon" />
          <Info         v-else :size="16" class="toast-icon" />
          <span>{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { CheckCircle2, XCircle, Info } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
const { toasts, remove } = useToast()
</script>

<style scoped>
.toast-wrap {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  pointer-events: none;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 16px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
  color: white;
  cursor: pointer;
  pointer-events: all;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  max-width: 320px;
}

.toast.success { background: #059669; }
.toast.error   { background: #dc2626; }
.toast.info    { background: var(--color-brand); }

.toast-icon { flex-shrink: 0; }

.toast-enter-active { transition: all 0.25s ease; }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from   { opacity: 0; transform: translateY(12px) scale(0.95); }
.toast-leave-to     { opacity: 0; transform: translateX(20px); }
</style>
