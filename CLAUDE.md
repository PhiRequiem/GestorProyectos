# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server (Vite)
npm run build      # Production build → dist/
npm run preview    # Preview production build locally

# Deploy
npm run build && firebase deploy --only hosting:phiprojects
firebase deploy --only firestore:rules
```

No linter or test suite is configured.

## Stack

- **Vue 3** (Composition API, `<script setup>`) + **Vite 6**
- **Tailwind CSS 4** (configured via `@tailwindcss/vite` plugin, not PostCSS)
- **Pinia** for state management
- **Firebase 12**: Authentication (email/password only) + Firestore (with `persistentLocalCache` for offline support)
- **lucide-vue-next** for icons
- Path alias `@` → `src/`

## Architecture

### State / Data flow

All data lives in Firestore and is owned per-user (`ownerId == auth.uid`). The four Pinia stores map to Firestore collections:

| Store | Collection | Pattern |
|---|---|---|
| `auth.js` | — | Singleton `onAuthStateChanged` listener; `init()` is idempotent |
| `projects.js` | `projects/` | Real-time `onSnapshot` subscription; subcollections for `todos`, `milestones`, `documents` |
| `tasks.js` | `taskLists/` | Real-time subscription for lists; per-list `subscribeTasks(listId, cb)` returns unsubscribe fn |
| `settings.js` | `settings/app` | Single shared doc with `serviceTypes: [{value, label}]` |

Stores expose `subscribe()` / `unsubscribeAll()` methods. Components call `subscribe()` on mount and `unsubscribeAll()` on auth logout. Auth logout tears down all store subscriptions to prevent dangling listeners after sign-out.

`milestonesCollected` and `pendingCount` / `todosCount` / `docsCount` are **denormalized counters** kept in sync by the store after each mutation — never increment them locally, always recalculate from source.

### Routing

Router lives in `src/router/index.js`. All authenticated routes are nested under `AppLayout`. Route guard in `beforeEach` awaits `authStore.init()` before deciding. Two meta flags: `meta.requiresAuth` and `meta.public`.

### Component layout

```
AppLayout        — wraps all authenticated views; renders Sidebar + BottomNav
  Sidebar        — desktop navigation
  BottomNav      — mobile navigation
  ProjectDrawer  — slide-in panel for quick project access from Dashboard
```

### Shared UI utilities

- `useToast()` — module-level singleton (`toasts` ref shared across all callers). Call `success()`, `error()`, `info()`. `ToastContainer` must be mounted once in `AppLayout`.
- `useConfirm()` — promise-based confirm modal (replaces `window.confirm`). `ConfirmModal` must be mounted once; call `confirm(message, { danger })` and await the result.
- `useTheme()` — persists to `localStorage` and sets `data-theme` on `<html>`.
- `useNotifications()` — PWA deadline notifications.

### Project status lifecycle

`active` → `waitingClose: true` (pending closure) → `status: archived` → optionally reactivated.
`status: not_approved` — proposals that were rejected (shown in Archive, not Dashboard).

### Financial model

`totalAmount` = sum of all milestones (including `isExtra: true` ones). `milestonesCollected` = sum of paid milestones. "Extra charges" (`isExtra: true` milestones) add to the project total. Milestone amounts must not exceed total unless they are extras.

## Environment

Copy `.env.example` to `.env.local` and fill Firebase credentials. All vars are prefixed `VITE_FIREBASE_`.

## Firebase

- Firestore security rules are in `firestore.rules` — deploy separately with `firebase deploy --only firestore:rules`.
- `settings/app` is readable/writable by any authenticated user (intentional — single-user app).
- Subcollections (`todos`, `milestones`, `documents`, `tasks`) are protected by parent document ownership check via `get()`.
