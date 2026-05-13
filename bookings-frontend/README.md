# Bookings Frontend

Frontend del proyecto de gestión de reservas, construido con **Next.js 16**, **React 19** y **TypeScript**. Incluye un panel administrativo con dashboard, reservas, clientes y cobros. La sección de reservas está completamente conectada al backend NestJS: permite listar, crear, editar y eliminar reservas con modal de confirmación.

## Stack técnico

- **Next.js 16** con App Router
- **React 19**
- **TypeScript**
- **CSS propio** en `globals.css`
- **fetch** nativo para llamadas a la API

## Estructura del proyecto

```text
bookings-frontend/
├─ app/
│  ├─ (admin)/
│  │  ├─ bookings/
│  │  │  ├─ BookingsClient.tsx   ← componente cliente con toda la lógica
│  │  │  └─ page.tsx             ← server component, carga datos iniciales
│  │  ├─ customers/
│  │  │  └─ page.tsx
│  │  ├─ dashboard/
│  │  │  └─ page.tsx
│  │  ├─ payments/
│  │  │  └─ page.tsx
│  │  └─ layout.tsx              ← layout compartido (Sidebar + Header)
│  ├─ favicon.ico
│  ├─ globals.css                ← estilos globales del panel
│  ├─ layout.tsx                 ← layout raíz
│  └─ page.tsx                   ← redirige a /dashboard
├─ components/
│  └─ layout/
│     ├─ Header.tsx
│     └─ Sidebar.tsx
├─ lib/
│  ├─ api.ts                     ← funciones fetch hacia el backend
│  └─ types.ts                   ← tipos compartidos
├─ public/
├─ .env.local                    
├─ next.config.ts
├─ package.json
└─ tsconfig.json
```

## Funcionalidades actuales

La sección `/bookings` está completamente conectada al backend:

- Listado real de reservas desde `GET /appointments`
- KPIs con total, pendientes, confirmadas y pagadas
- Filtro por estado
- Formulario para crear una nueva reserva (`POST /appointments`)
- Formulario para editar una reserva existente (`PATCH /appointments/:id`)
- Modal de confirmación para eliminar una reserva (`DELETE /appointments/:id`)
- Mensajes de éxito y error tras cada operación

Las secciones `/dashboard`, `/customers` y `/payments` tienen datos de ejemplo estáticos y están pendientes de conectar con el backend.

## Requisitos previos

- **Node.js 18 o superior**
- **npm**
- **Git**
- El **backend levantado** y accesible

Puedes comprobarlo con:

```bash
node -v
npm -v
git --version
```

## Cómo descargar el proyecto

### Opción 1: clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd bookings-frontend
```

### Opción 2: descargar ZIP

1. En GitHub pulsa **Code → Download ZIP**
2. Descomprime el proyecto
3. Entra en la carpeta `bookings-frontend`

## Instalación

```bash
npm install
```

## Configuración del entorno

Crea un archivo `.env.local` en la raíz con la URL del backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Si el backend corre en otro puerto, cámbialo aquí. Si modificas este archivo, reinicia el servidor de desarrollo.

## Cómo ejecutar el frontend

```bash
npm run dev
```

Como el backend suele correr en el puerto `3000`, arranca el frontend en otro puerto para evitar conflictos:

```bash
npm run dev
```

## URL de acceso

```text
http://localhost:3001
```

Rutas disponibles:

| Ruta | Descripción |
|---|---|
| `/dashboard` | Panel de resumen con métricas |
| `/bookings` | Gestión de reservas (conectada al backend) |
| `/customers` | Listado de clientes (datos estáticos) |
| `/payments` | Seguimiento de cobros (datos estáticos) |

La raíz `/` redirige automáticamente a `/dashboard`.

## Cómo funciona la conexión con el backend

Todas las llamadas a la API están centralizadas en `lib/api.ts`:

| Función | Método | Endpoint |
|---|---|---|
| `getAppointments()` | GET | `/appointments` |
| `createAppointment(data)` | POST | `/appointments` |
| `updateAppointment(id, data)` | PATCH | `/appointments/:id` |
| `deleteAppointment(id)` | DELETE | `/appointments/:id` |

Si el backend no está levantado o la URL en `.env.local` es incorrecta, la página de reservas mostrará un error al cargar.

## Flujo de trabajo recomendado

**Terminal 1 — backend:**

```bash
cd bookings-backend
npm install
npm run start:dev
```

**Terminal 2 — frontend:**

```bash
cd bookings-frontend
npm install
npm run dev
```

Después abre `http://localhost:3001` en el navegador.

## Problemas frecuentes

### La tabla de reservas aparece vacía

- Comprueba que el backend está levantado
- Comprueba que `NEXT_PUBLIC_API_URL` en `.env.local` apunta a la URL correcta
- Comprueba que el backend tiene CORS habilitado para `http://localhost:3001`

### Error de CORS en la consola del navegador

En el `main.ts` del backend debe existir:

```ts
app.enableCors({
  origin: 'http://localhost:3001',
});
```

### Los cambios en `.env.local` no se aplican

Detén el servidor y vuelve a ejecutar `npm run dev`.

### El formulario de crear da error

Comprueba que todos los campos son válidos. El backend rechazará la petición si falta algún campo obligatorio:

```json
{
  "date": "2026-04-27",
  "time": "10:30",
  "status": "pending",
  "customerId": 1,
  "businessId": 1,
  "serviceName": "Corte de pelo"
}
```

### Conflicto de puertos

Si el puerto `3000` ya está ocupado por el backend, arranca el frontend en otro:

```bash
npm run dev
```

## Scripts disponibles

```json
{
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "eslint"
  }
```

## Estado actual del proyecto

Este frontend tiene un panel administrativo funcional con la sección de reservas conectada de punta a punta al backend. Las secciones de clientes, cobros y dashboard tienen datos estáticos de ejemplo y están preparadas para que los alumnos las conecten a la API.
