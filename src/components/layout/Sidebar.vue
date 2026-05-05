<template>
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="logo-icon">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="url(#grad-sb)" />
          <text x="16" y="23" text-anchor="middle" font-family="Georgia, serif" font-size="20" font-weight="700" fill="white">φ</text>
          <defs>
            <linearGradient id="grad-sb" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stop-color="#6366f1"/>
              <stop offset="1" stop-color="#8b5cf6"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <span class="logo-text">PhiProjects</span>
      <button class="theme-icon-btn" @click="toggle" :title="dark ? 'Modo claro' : 'Modo oscuro'">
        <Sun v-if="dark" :size="15" />
        <Moon v-else :size="15" />
      </button>
    </div>

    <nav class="sidebar-nav">
      <p class="nav-section-label">Principal</p>

      <RouterLink to="/" class="nav-item" :class="{ active: route.name === 'Dashboard' }">
        <LayoutDashboard :size="18" />
        <span>Dashboard</span>
      </RouterLink>

      <RouterLink to="/tasks" class="nav-item" :class="{ active: route.name === 'Tasks' }">
        <ClipboardList :size="18" />
        <span>Tareas</span>
      </RouterLink>

      <RouterLink to="/archive" class="nav-item" :class="{ active: route.name === 'Archive' }">
        <Archive :size="18" />
        <span>Archivo</span>
      </RouterLink>
    </nav>



    <div class="sidebar-footer">
      <div class="user-info">
        <img v-if="user?.photoURL" :src="user.photoURL" :alt="user.displayName" class="user-avatar" />
        <div v-else class="user-avatar-placeholder">
          {{ user?.displayName?.[0] || user?.email?.[0] || 'U' }}
        </div>
        <div class="user-details">
          <p class="user-name">{{ user?.displayName || 'Usuario' }}</p>
          <p class="user-email">{{ user?.email }}</p>
        </div>
      </div>
      <button @click="handleLogout" class="logout-btn" title="Cerrar sesión">
        <LogOut :size="16" />
      </button>
    </div>
  </aside>
</template>

<script setup>
import { useRoute, RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { LayoutDashboard, Archive, LogOut, Sun, Moon, ClipboardList } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useTheme } from '@/composables/useTheme'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const { dark, toggle } = useTheme()

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.sidebar {
  width: 240px;
  min-height: 100vh;
  background: var(--color-bg-sidebar);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  flex-shrink: 0;
}

@media (max-width: 767px) {
  .sidebar { display: none; }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .sidebar { width: 64px; }
  .logo-text, .nav-section-label, .nav-item span,
  .user-details, .theme-icon-btn { display: none; }
  .sidebar-logo { justify-content: center; padding: 0 0 20px; }
  .nav-item { justify-content: center; padding: 10px; }
  .sidebar-footer { justify-content: center; padding: 16px 0 0; }
  .user-info { justify-content: center; }
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.theme-icon-btn {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.theme-icon-btn:hover {
  border-color: var(--color-brand);
  color: var(--color-brand-light);
}

.logo-icon svg {
  width: 32px;
  height: 32px;
}

.logo-text {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.sidebar-nav {
  flex: 1;
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-section-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  padding: 0 8px;
  margin: 0 0 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.15s ease;
}

.nav-item:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

.nav-item.active {
  background: color-mix(in srgb, var(--color-brand) 15%, transparent);
  color: var(--color-brand-light);
}

.sidebar-footer {
  padding: 16px 12px 0;
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.user-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-brand), var(--color-accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
  text-transform: uppercase;
}

.user-details {
  min-width: 0;
}

.user-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  padding: 6px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.logout-btn:hover {
  background: color-mix(in srgb, var(--color-rejected) 15%, transparent);
  color: var(--color-rejected);
}


</style>
