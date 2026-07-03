# PhiProjects

Herramienta personal de gestión de proyectos de desarrollo y consultoría. Centraliza el seguimiento de proyectos, finanzas, tareas, documentos y clientes en un solo lugar.

**Demo:** [phiprojects.web.app](https://phiprojects.web.app)

---

## Stack

- **Frontend:** Vue 3 + Vite
- **Estilos:** Tailwind CSS 4
- **Backend:** Firebase — Authentication (email/password) + Firestore
- **Deploy:** Firebase Hosting
- **PWA:** Instalable en desktop y mobile

---

## Requisitos previos

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`

---

## Configuración

```bash
git clone https://github.com/tu-usuario/phiprojects.git
cd phiprojects
npm install
cp .env.example .env.local   # Rellenar con tus credenciales Firebase
```

### Variables de entorno (`.env.local`)

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Firebase Console

**Authentication:** Habilitar Email/Password. Crear usuario en Authentication → Users.

**Firestore rules:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read, write: if request.auth != null && resource.data.ownerId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
      match /{subcollection}/{docId} {
        allow read, write: if request.auth != null
          && get(/databases/$(database)/documents/projects/$(projectId)).data.ownerId == request.auth.uid;
      }
    }
    match /settings/{docId} { allow read, write: if request.auth != null; }
    match /taskLists/{listId} {
      allow read, write: if request.auth != null && resource.data.ownerId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
      match /tasks/{taskId} {
        allow read, write: if request.auth != null
          && get(/databases/$(database)/documents/taskLists/$(listId)).data.ownerId == request.auth.uid;
      }
    }
  }
}
```

---

## Desarrollo y deploy

```bash
npm run dev                                          # Servidor local
npm run build && firebase deploy --only hosting:phiprojects  # Deploy
firebase deploy --only firestore:rules               # Solo reglas
```

---

## Funcionalidades

### Dashboard
- Tabla de proyectos con ordenamiento por cualquier columna
- **Búsqueda global** — busca en todos los estados simultáneamente
- **Filtro por cliente** — clic en un nombre de cliente para ver solo sus proyectos
- Tabs: Activos / Pend. cierre / En espera / No aprobado
- **Filtro "Grants"** — muestra solo las postulaciones a grants, sobre cualquier estado
- Barra financiera: total cobrado vs pendiente de proyectos activos, más una línea propia de **Grants** (monto postulado + nº de postulaciones), separada de la facturación de clientes
- Export a CSV (incluye columnas Grant / URL / Organismo)
- Indicadores de contenido en cada fila (tareas, notas, archivos)
- Panel lateral (drawer) con acceso rápido a tareas, notas y archivos sin salir del dashboard

### Proyectos
Cada proyecto gestiona:
- **Identidad:** título, cliente, tipo de servicio (configurable)
- **Tipo:** Normal / Pro Bono / Personal (φ)
- **Finanzas:** monto acordado (o "por definir"), hitos de pago con trazabilidad completa, cargos extra que suman al total
- **Cronograma:** inicio, entrega, indicador de días restantes con colores
- **Estado:** Activo → Pendiente de cierre → Cerrar proyecto → Archivado
- **Contenido:** notas editables, todos con edición inline, documentos con soporte de URL y rutas locales
- **Indicador "Pend. cierre"** — marca el trabajo como terminado sin archivar (pendiente de revisión o pago)

### Postulaciones a grants
Un grant es un proyecto marcado como **Postulación a Grant** (`isGrant`): reutiliza todo el ciclo de estados, hitos, tareas, notas y deadline de un proyecto normal, con campos propios:
- **URL de la convocatoria** (`grantUrl`) — enlace directo, clicable desde el detalle y el drawer
- **Organismo / Fundación** (`funder`) — quién otorga el grant
- El **monto** se interpreta como el monto del grant y la **fecha de entrega** como deadline
- Se rastrean **aparte** de la facturación de clientes (filtro y línea financiera dedicados en el Dashboard) y son distinguibles por un tag ámbar "Grant"

### Archivo histórico
- Proyectos cerrados y propuestas no aprobadas
- Resumen financiero anual (proyectos, facturación, pro bono) usando fecha de cierre real (`closedAt`)
- Reactivar o eliminar proyectos

### Tareas personales
- Listas independientes de proyectos con colores personalizables
- Tareas con prioridad (Alta/Media/Baja) y fecha límite
- Edición inline de tareas
- Contador de pendientes por lista
- Indicador de fecha vencida o próxima a vencer

### UX y rendimiento
- Dark/Light mode con preferencia persistente
- PWA — instalable en desktop y mobile
- Diseño responsive: sidebar en desktop, bottom nav en mobile, sidebar compacto en tablet
- Notificaciones de deadline (cuando la app está instalada como PWA)
- Caché offline con Firestore `persistentLocalCache`
- Bundle dividido (Firebase, Vue, iconos en chunks independientes)
- Toasts de confirmación, modales de confirmación sin `confirm()` nativo

---

## Modelo de datos

```
projects/{projectId}
  title, client, status, priority, serviceType
  totalAmount, milestonesCollected
  probono, isPersonal, priceUndefined, waitingClose
  isGrant, grantUrl, funder          — postulaciones a grants
  startDate, deliveryDate, closedAt
  notes, todosCount, docsCount, ownerId
  createdAt, updatedAt

  todos/{todoId}        — text, completed
  milestones/{id}       — label, amount, paid, isExtra
  documents/{id}        — name, type, url

taskLists/{listId}      — name, color, ownerId, pendingCount
  tasks/{taskId}        — text, completed, priority, dueDate

settings/app            — serviceTypes: [{value, label}]
```

---

## Licencia

[Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
