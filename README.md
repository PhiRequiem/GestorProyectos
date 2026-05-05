# PhiProjects

Herramienta personal de gestión de proyectos de desarrollo y consultoría. Centraliza el seguimiento de proyectos, finanzas, tareas, documentos y clientes en un solo lugar.

**Demo:** [phiprojects.web.app](https://phiprojects.web.app)

---

## Stack

- **Frontend:** Vue 3 + Vite
- **Estilos:** Tailwind CSS 4
- **Backend:** Firebase — Authentication (email/password) + Firestore (base de datos en tiempo real)
- **Deploy:** Firebase Hosting

---

## Requisitos previos

- Node.js 18+
- Una cuenta de Firebase con un proyecto creado
- Firebase CLI: `npm install -g firebase-tools`

---

## Configuración inicial

### 1. Clonar e instalar

```bash
git clone https://github.com/tu-usuario/phiprojects.git
cd phiprojects
npm install
```

### 2. Variables de entorno

Copia el archivo de ejemplo y rellena con los datos de tu proyecto Firebase:

```bash
cp .env.example .env.local
```

Edita `.env.local` con los valores que encuentras en Firebase Console → Configuración del proyecto → Tus apps:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Configurar Firebase

#### Authentication
En Firebase Console → Authentication → Sign-in method → habilitar **Email/Password**.

Crea tu usuario en Authentication → Users → Agregar usuario.

#### Firestore
En Firebase Console → Firestore Database → Crear base de datos (modo producción).

Configura las reglas de seguridad en Firestore → Reglas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read, write: if request.auth != null;
      match /{subcollection}/{docId} {
        allow read, write: if request.auth != null;
      }
    }
    match /settings/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Levantar en desarrollo

```bash
npm run dev
```

---

## Deploy a Firebase Hosting

```bash
# Conectar al proyecto Firebase
firebase login
firebase use tu-project-id

# Construir y desplegar
npm run build
firebase deploy --only hosting
```

---

## Manual de uso

### Dashboard

Vista principal con todos los proyectos organizados por estado.

- **Tabs:** Activos / En espera de aprobación / No aprobado
- **Búsqueda:** Filtra por nombre de proyecto o cliente en tiempo real
- **Ordenar:** Haz clic en cualquier encabezado de columna (Proyecto, Cliente, Entrega, Días rest., Monto, Prioridad)
- **Panel lateral:** Haz clic en una fila para abrir el panel rápido con Tareas, Notas y Archivos sin salir del dashboard
- **Indicadores:** Iconos pequeños junto al nombre muestran si el proyecto tiene tareas, notas o archivos
- **Barra financiera:** Muestra el total cobrado vs. pendiente de todos los proyectos activos

#### Crear un proyecto

Botón **Nuevo Proyecto** (esquina superior derecha).

Campos disponibles:
- Título y cliente
- **Tipo:** Pro Bono (sin cobro) / Personal (propio, sin pago)
- **Monto:** con opción "Por definir" si el precio aún no está acordado
- Fechas de inicio y entrega (opcionales si está en espera)
- Estado, prioridad y tipo de servicio
- Notas iniciales

> El adelanto no tiene campo propio — se registra como un hito de pago para mayor trazabilidad.

#### Tipos de servicio

Los tipos de servicio se crean desde el formulario de proyecto usando el botón **+** junto al selector. Se guardan en Firestore y están disponibles en todos los proyectos.

---

### Detalle de proyecto

Accede haciendo clic en **Ver detalle** desde el panel lateral, o navegando directamente.

#### Finanzas
Muestra el desglose completo:
- Monto total acordado
- Adelanto recibido (si lo registraste como hito)
- Hitos cobrados
- Total cobrado y pendiente
- Barra de progreso de cobro

#### Tareas (Todos)
Lista de tareas con estado de cumplimiento. El porcentaje de avance se calcula automáticamente.

#### Hitos de pago
Registra pagos parciales. Dos tipos:
- **Hito normal:** se contabiliza contra el monto total
- **Cargo extra:** activa el toggle "Cargo extra" al agregar — suma este monto al total acordado del proyecto

#### Notas
Editor de texto libre. Se guarda al hacer clic fuera o al cerrar el panel.

#### Documentos
Adjunta referencias a documentos con nombre, tipo y URL o ruta de archivo local.

Tipos disponibles: Contrato, Propuesta, Referencia, Insumo, Reporte, Anexo, Otro.

#### Estado del proyecto

El flujo de vida de un proyecto es:

```
En espera → Aprobado (Activo) → [Marcar terminado] → Cerrar proyecto → Archivado
```

- **Aprobar:** desde el panel lateral cuando el proyecto está en "En espera"
- **Marcar terminado:** en el tab Tareas del panel lateral — activa el indicador "Pend. cierre" en el dashboard sin cambiar el estado
- **Cerrar proyecto:** cuando está marcado como terminado, el botón de archivar cambia a "Cerrar proyecto" — lo mueve al archivo y registra la fecha de cierre

---

### Archivo histórico

Muestra proyectos cerrados y propuestas no aprobadas.

- **Resumen anual:** total de proyectos y monto facturado por año
- **Reactivar:** devuelve un proyecto al estado Activo
- **Eliminar:** eliminación permanente con confirmación

---

## Estructura del proyecto

```
src/
├── firebase/          # Inicialización de Firebase
├── router/            # Vue Router con guard de autenticación
├── stores/
│   ├── auth.js        # Estado de autenticación
│   ├── projects.js    # CRUD de proyectos y subcollecciones
│   └── settings.js    # Tipos de servicio (Firestore)
├── composables/
│   ├── useToast.js    # Sistema de notificaciones
│   ├── useConfirm.js  # Modal de confirmación
│   ├── useTheme.js    # Dark / Light mode
│   └── useServiceTypes.js
├── components/
│   ├── layout/        # Sidebar y AppLayout
│   ├── ui/            # Badges, Toast, ConfirmModal
│   └── projects/      # Modal, Drawer, TodoList, Milestones, Docs
└── views/
    ├── LoginView.vue
    ├── DashboardView.vue
    ├── ProjectDetailView.vue
    └── ArchiveView.vue
```

## Modelo de datos en Firestore

```
projects/{projectId}
  title, client, status, priority, serviceType
  totalAmount, milestonesCollected
  probono, isPersonal, priceUndefined, waitingClose
  startDate, deliveryDate, closedAt
  notes, todosCount, docsCount
  createdAt, updatedAt

  todos/{todoId}
    text, completed, createdAt

  milestones/{milestoneId}
    label, amount, paid, isExtra, createdAt

  documents/{docId}
    name, type, url, createdAt

settings/app
  serviceTypes: [{ value, label }]
```

---

## Licencia

Uso personal. No distribuir sin autorización.
