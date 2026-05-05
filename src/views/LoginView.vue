<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="12" fill="url(#grad-login)" />
          <text x="20" y="29" text-anchor="middle" font-family="Georgia, serif" font-size="26" font-weight="700" fill="white">φ</text>
          <defs>
            <linearGradient id="grad-login" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stop-color="#6366f1"/>
              <stop offset="1" stop-color="#8b5cf6"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <h1>PhiProjects</h1>
      <p class="subtitle">Inicia sesión para continuar</p>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Email</label>
          <div class="input-wrap">
            <Mail :size="15" class="input-icon" />
            <input
              v-model="email"
              type="email"
              placeholder="tu@email.com"
              autocomplete="email"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label>Contraseña</label>
          <div class="input-wrap">
            <Lock :size="15" class="input-icon" />
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
            <button type="button" class="toggle-pw" @click="showPassword = !showPassword">
              <Eye v-if="!showPassword" :size="14" />
              <EyeOff v-else :size="14" />
            </button>
          </div>
        </div>

        <p v-if="error" class="error-msg">
          <AlertCircle :size="14" />
          {{ error }}
        </p>

        <button type="submit" class="submit-btn" :disabled="loading">
          <Loader2 v-if="loading" :size="16" class="spin" />
          <LogIn v-else :size="16" />
          Iniciar sesión
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2, AlertCircle } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const errorMessages = {
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/user-not-found': 'No existe una cuenta con ese email.',
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
  'auth/invalid-email': 'El email no es válido.',
}

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await authStore.loginWithEmail(email.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = errorMessages[e.code] || 'Error al iniciar sesión. Intenta de nuevo.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: var(--color-bg-base);
  display: flex;
  align-items: center;
  justify-content: center;
  background-image:
    radial-gradient(ellipse at 20% 50%, color-mix(in srgb, var(--color-brand) 8%, transparent) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, color-mix(in srgb, var(--color-accent) 6%, transparent) 0%, transparent 50%);
}

.login-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: 20px;
  padding: 40px 36px;
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.login-logo svg {
  width: 52px;
  height: 52px;
  margin-bottom: 4px;
}

.login-card h1 {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.03em;
  margin: 0;
}

.subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0 0 8px;
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: var(--color-text-muted);
  pointer-events: none;
}

.input-wrap input {
  width: 100%;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 9px;
  color: var(--color-text-primary);
  padding: 10px 36px;
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}

.input-wrap input:focus {
  border-color: var(--color-brand);
}

.toggle-pw {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}

.toggle-pw:hover {
  color: var(--color-text-secondary);
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--color-rejected);
  background: color-mix(in srgb, var(--color-rejected) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-rejected) 25%, transparent);
  border-radius: 8px;
  padding: 8px 12px;
  margin: 0;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 11px;
  background: var(--color-brand);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 4px;
}

.submit-btn:hover:not(:disabled) {
  background: var(--color-brand-dark);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
