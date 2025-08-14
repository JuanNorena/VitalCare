# 🏢 Sistema de Gestión de Atención Plus

Un sistema completo de gestión de citas y turnos diseñado para bancos, clínicas, oficinas gubernamentales y cualquier institución que requiera un manejo eficiente de la atención al cliente.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-v18+-green.svg)
![React](https://img.shields.io/badge/react-v18.3.1-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-v5.6.3-blue.svg)

## 📋 Tabla de Contenidos

- [🌟 Características Principales](#-características-principales)
- [🚀 Demo en Vivo](#-demo-en-vivo)
- [🛠️ Tecnologías Utilizadas](#️-tecnologías-utilizadas)
- [📦 Prerequisitos](#-prerequisitos)
- [⚡ Instalación Rápida](#-instalación-rápida)
- [🔧 Configuración Detallada](#-configuración-detallada)
- [🎯 Guía de Uso](#-guía-de-uso)
- [🏗️ Arquitectura del Sistema](#️-arquitectura-del-sistema)
- [📱 Roles de Usuario](#-roles-de-usuario)
- [🌐 Internacionalización](#-internacionalización)
- [🔒 Seguridad](#-seguridad)
- [📊 Base de Datos](#-base-de-datos)
- [🎨 Personalización](#-personalización)
- [🧪 Testing](#-testing)
- [🚀 Despliegue](#-despliegue)
- [🤝 Contribuir](#-contribuir)
- [📄 Licencia](#-licencia)

## 🌟 Características Principales

### 📅 **Gestión de Citas**
- ✅ **Reserva Online**: Interfaz intuitiva para agendar citas
- ✅ **Check-in Digital**: Sistema de códigos QR para check-in automático
- ✅ **Formularios Dinámicos**: Campos personalizables por servicio
- ✅ **Confirmaciones Automáticas**: Notificaciones por email con códigos QR
- ✅ **Estados de Cita**: Seguimiento completo (Programada → Check-in → Completada)

### 🎯 **Sistema de Turnos**
- ✅ **Cola Inteligente**: Gestión automática de turnos por orden de llegada
- ✅ **Transferencia de Citas**: Reasignación entre puntos de atención en tiempo real
- ✅ **Visualizador Público**: Pantallas de información para clientes
- ✅ **Audio Integrado**: Anuncios automáticos de turnos llamados
- ✅ **Scroll Automático**: Visualización dinámica para listas largas

### 🏢 **Multi-Sede**
- ✅ **Gestión Centralizada**: Administración de múltiples sucursales
- ✅ **Puntos de Atención**: Configuración flexible de ventanillas/módulos
- ✅ **Asignación por Sede**: Operadores específicos por ubicación
- ✅ **Servicios por Sucursal**: Disponibilidad personalizada

### 📧 **Sistema de Correo Electrónico**
- ✅ **Correos de Bienvenida**: Email automático con plantilla HTML al registrarse
- ✅ **Notificaciones Automáticas**: Confirmaciones y recordatorios de citas
- ✅ **Soporte Multi-Proveedor**: Compatible con Hostinger, Gmail, y otros SMTP
- ✅ **Plantillas Personalizadas**: Diseño profesional con branding del sistema
- ✅ **Modo Texto y HTML**: Compatibilidad con todos los clientes de correo
- ✅ **Verificación SMTP**: Endpoint para probar la conexión del servicio

### 🔊 **Experiencia de Usuario**
- ✅ **Interfaz Responsiva**: Optimizada para desktop, tablet y móvil
- ✅ **Modo Pantalla Completa**: Para displays públicos profesionales
- ✅ **Animaciones Fluidas**: Transiciones suaves y feedback visual
- ✅ **Accesibilidad**: Cumple estándares WCAG para inclusión

### 🌍 **Internacionalización**
- ✅ **Español / Inglés**: Soporte completo bilingüe
- ✅ **Detección Automática**: Idioma basado en configuración del navegador
- ✅ **Cambio Dinámico**: Intercambio de idioma sin recargar página

## 🚀 Demo en Vivo

🔗 **[Ver Demo](https://tu-demo-url.com)** _(Próximamente)_

**Credenciales de Prueba:**
- **Admin**: `admin` / `admin123`
- **Staff**: `operador` / `operador123`
- **Cliente**: `usuario` / `usuario123`

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- **React 18.3.1** - Biblioteca de UI moderna
- **TypeScript 5.6.3** - Tipado estático para JavaScript
- **Vite 5.4.9** - Build tool rápido y moderno
- **Tailwind CSS 3.4.14** - Framework CSS utility-first
- **Shadcn/ui** - Componentes accesibles y customizables
- **Framer Motion** - Animaciones fluidas
- **React Query (TanStack)** - Gestión de estado del servidor
- **React Hook Form** - Formularios performantes
- **i18next** - Sistema de internacionalización

### **Backend**
- **Node.js 18+** - Runtime JavaScript del servidor
- **Express 4.21.2** - Framework web minimalista
- **TypeScript** - Desarrollo type-safe
- **Passport.js** - Autenticación flexible
- **Express Session** - Gestión de sesiones

### **Base de Datos**
- **PostgreSQL** - Base de datos relacional robusta
- **Drizzle ORM 0.38.4** - ORM type-safe moderno
- **Drizzle Kit** - Migraciones automáticas

### **Herramientas de Desarrollo**
- **ESBuild** - Bundler ultra-rápido
- **PostCSS** - Procesamiento de CSS
- **Date-fns** - Manipulación de fechas moderna
- **QRCode.js** - Generación de códigos QR
- **Nodemailer** - Envío de emails

## 📦 Prerequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js 18.0.0+** ([Descargar](https://nodejs.org/))
- **npm 9.0.0+** (incluido con Node.js)
- **PostgreSQL 13+** ([Descargar](https://www.postgresql.org/download/))
- **Git** ([Descargar](https://git-scm.com/))

### Verificar Instalaciones

```bash
# Verificar Node.js
node --version  # Debe mostrar v18.0.0 o superior

# Verificar npm
npm --version   # Debe mostrar v9.0.0 o superior

# Verificar PostgreSQL
psql --version  # Debe mostrar PostgreSQL 13 o superior

# Verificar Git
git --version   # Debe mostrar cualquier versión reciente
```

## ⚡ Instalación Rápida

### 1. Clonar el Repositorio

```bash
# Clonar el proyecto
git clone https://github.com/tu-usuario/gestion-atencion-plus.git
cd gestion-atencion-plus
```

### 2. Instalar Dependencias

```bash
# Instalar todas las dependencias
npm install
```

### 3. Configurar Base de Datos

```bash
# Crear base de datos PostgreSQL
createdb gestion_atencion_plus

# O usando psql
psql -U postgres
CREATE DATABASE gestion_atencion_plus;
\q
```

### 4. Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar archivo .env con tus configuraciones
nano .env
```

### 5. Ejecutar Migraciones

```bash
# Aplicar esquema de base de datos
npm run db:push
```

### 6. Iniciar Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev
```

🎉 **¡Listo!** La aplicación estará disponible en `http://localhost:5000`

## 🔧 Configuración Detallada

### Variables de Entorno (.env)

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```bash
# === CONFIGURACIÓN DE BASE DE DATOS ===
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/gestion_atencion_plus"

# === CONFIGURACIÓN DEL SERVIDOR ===
PORT=5000
NODE_ENV=development

# === SEGURIDAD DE SESIONES ===
SESSION_SECRET="tu-clave-secreta-super-segura-aqui"

# === CONFIGURACIÓN DE EMAIL ===
# Para Hostinger Mail (Producción)
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="info@vacasoft.com"
SMTP_PASS="Androide3dVacaAxM"
FROM_NAME="Sistema de Gestión de Atención Plus"
FROM_EMAIL="info@vacasoft.com"

# Para Gmail (Alternativa de desarrollo)
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER="tu-email@gmail.com"
# SMTP_PASS="tu-contraseña-de-aplicacion"
# FROM_NAME="Sistema de Gestión de Atención Plus"
# FROM_EMAIL="tu-email@gmail.com"

# === CONFIGURACIÓN DE LA APLICACIÓN ===
APP_NAME="Sistema de Gestión de Atención Plus"
APP_URL="http://localhost:5000"

# === CONFIGURACIÓN DE ARCHIVOS ===
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=5242880  # 5MB en bytes
```

### Configuración de Base de Datos

#### Opción 1: PostgreSQL Local

```bash
# Instalar PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Iniciar servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear usuario y base de datos
sudo -u postgres psql
CREATE USER gestion_user WITH PASSWORD 'mi_contraseña_segura';
CREATE DATABASE gestion_atencion_plus OWNER gestion_user;
GRANT ALL PRIVILEGES ON DATABASE gestion_atencion_plus TO gestion_user;
\q
```

#### Opción 2: PostgreSQL con Docker

```bash
# Crear y ejecutar contenedor PostgreSQL
docker run --name postgres-gestion \
  -e POSTGRES_USER=gestion_user \
  -e POSTGRES_PASSWORD=mi_contraseña_segura \
  -e POSTGRES_DB=gestion_atencion_plus \
  -p 5432:5432 \
  -d postgres:15
```

#### Opción 3: Neon (Recomendado para Desarrollo)

1. Crear cuenta en [Neon](https://neon.tech)
2. Crear nuevo proyecto
3. Copiar la URL de conexión a tu `.env`

### Configuración de Email

El sistema incluye un servicio completo de correo electrónico para:
- ✅ **Correos de Bienvenida** al registrar nuevos usuarios
- ✅ **Confirmaciones de Citas** con códigos QR
- ✅ **Recordatorios** automáticos
- ✅ **Notificaciones** de cambios de estado

#### Hostinger Mail (Configuración de Producción)

```bash
# Configuración para Hostinger Mail
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="info@vacasoft.com"
SMTP_PASS="tu_contraseña_hostinger"
FROM_NAME="Sistema de Gestión de Atención Plus"
FROM_EMAIL="info@vacasoft.com"
```

#### Gmail (Alternativa para Testing)

1. Habilitar **2FA** en tu cuenta Gmail
2. Generar **Contraseña de Aplicación**:
   - Google Account → Security → 2-Step Verification
   - App passwords → Generate new password
3. Usar la contraseña generada en `SMTP_PASS`

```bash
# Ejemplo para Gmail
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="abcd-efgh-ijkl-mnop"  # Contraseña de aplicación
FROM_NAME="Sistema de Gestión de Atención Plus"
FROM_EMAIL="tu-email@gmail.com"
```

#### Verificar Configuración de Email

El sistema incluye un endpoint para probar la conexión SMTP:

```bash
# Probar conexión (requiere login como admin)
GET /api/test-email
```

## 🎯 Guía de Uso

### 🏁 Primer Inicio

#### 1. Crear Usuario Administrador

Al iniciar por primera vez, ejecuta:

```bash
# Script para crear admin inicial (crear este archivo)
node scripts/create-admin.js
```

O registra manualmente desde la interfaz y actualiza el rol en la base de datos:

```sql
UPDATE users SET role = 'admin' WHERE username = 'tu_usuario';
```

#### 2. Configuración Inicial del Sistema

1. **Iniciar sesión** como administrador
2. **Crear Primera Sede**:
   - Ve a Admin → Sedes
   - Clic en "Agregar Sede"
   - Completa información básica

3. **Configurar Servicios**:
   - Ve a Admin → Servicios
   - Crear servicios básicos (ej: "Atención General", "Consultas", etc.)
   - Asignar duración estimada

4. **Crear Puntos de Atención**:
   - Ve a Admin → Puntos de Atención
   - Crear ventanillas/módulos (ej: "Ventanilla 1", "Módulo A")
   - Asignar servicios que puede atender cada punto

5. **Configurar Horarios**:
   - Ve a Admin → Horarios
   - Definir disponibilidad por servicio y día

### 👥 Gestión de Usuarios

#### Roles del Sistema

| Rol | Descripción | Permisos Principales |
|-----|-------------|---------------------|
| **admin** | Administrador del sistema | Acceso completo, configuración global |
| **staff** | Operador de atención | Gestión de cola, atención de citas |
| **user** | Cliente final | Reservar citas, hacer check-in |
| **visualizer** | Pantalla pública | Solo visualización de turnos |
| **selfservice** | Kiosco autoservicio | Generación de turnos sin cita |

#### Crear Usuarios Staff

```sql
-- Crear operador para una sede específica
INSERT INTO users (username, email, password, role, branch_id) 
VALUES ('operador1', 'operador@empresa.com', 'hash_password', 'staff', 1);
```

### 📱 Flujo de Trabajo Típico

#### Para Clientes (role: user)

1. **Reservar Cita**:
   - Acceder al sistema
   - Seleccionar sede y servicio
   - Elegir fecha y hora disponible
   - Completar formulario si es requerido
   - Recibir confirmación con código QR

2. **Día de la Cita**:
   - Llegar a la sede
   - Hacer check-in con código QR o código de confirmación
   - Esperar llamado en pantallas públicas

#### Para Operadores (role: staff)

1. **Gestión de Cola**:
   - Ver citas con check-in pendientes
   - Agregar citas a la cola de atención
   - Transferir citas entre puntos si es necesario

2. **Atender Clientes**:
   - Llamar siguiente turno ("Comenzar Atención")
   - Transferir si el cliente necesita otro servicio
   - Completar atención cuando termine

#### Para Visualizadores Públicos

1. **Configurar Pantalla**:
   - Usuario con rol `visualizer`
   - Acceder a la vista de visualizador
   - Activar modo pantalla completa (F11)
   - Habilitar audio para anuncios

## 🏗️ Arquitectura del Sistema

### Estructura del Proyecto

```
gestion-atencion-plus/
├── 📁 client/                 # Frontend React
│   ├── 📁 src/
│   │   ├── 📁 components/     # Componentes reutilizables
│   │   │   ├── 📁 ui/         # Componentes base (shadcn/ui)
│   │   │   └── 📁 forms/      # Componentes de formularios
│   │   ├── 📁 pages/          # Páginas principales
│   │   │   ├── 📁 auth/       # Autenticación
│   │   │   ├── 📁 appointments/ # Gestión de citas
│   │   │   ├── 📁 queue/      # Gestión de cola
│   │   │   ├── 📁 admin/      # Panel administrativo
│   │   │   └── 📁 visualizer/ # Pantallas públicas
│   │   ├── 📁 hooks/          # Custom React hooks
│   │   ├── 📁 contexts/       # React contexts
│   │   ├── 📁 i18n/           # Internacionalización
│   │   │   └── 📁 locales/    # Archivos de traducción
│   │   ├── 📁 lib/            # Utilidades y configuraciones
│   │   └── 📁 utils/          # Funciones helper
│   └── 📄 index.html          # Punto de entrada HTML
├── 📁 server/                 # Backend Express
│   ├── 📄 index.ts            # Servidor principal
│   ├── 📄 routes.ts           # Definición de rutas API
│   ├── 📄 auth.ts             # Configuración de autenticación
│   ├── 📄 mailer.ts           # Sistema de emails
│   ├── 📄 vite.ts             # Configuración de Vite
│   └── 📁 utils/              # Utilidades del servidor
├── 📁 db/                     # Base de datos
│   ├── 📄 index.ts            # Conexión a la base de datos
│   └── 📄 schema.ts           # Esquemas de Drizzle ORM
├── 📁 migrations/             # Migraciones de base de datos
├── 📄 package.json            # Dependencias y scripts
├── 📄 drizzle.config.ts       # Configuración de Drizzle
├── 📄 tailwind.config.ts      # Configuración de Tailwind
├── 📄 tsconfig.json           # Configuración de TypeScript
└── 📄 vite.config.ts          # Configuración de Vite
```

### Flujo de Datos

```mermaid
graph TD
    A[Cliente Web] --> B[React Frontend]
    B --> C[React Query]
    C --> D[Express API]
    D --> E[Passport Auth]
    D --> F[Drizzle ORM]
    F --> G[PostgreSQL]
    D --> H[Nodemailer]
    H --> I[SMTP Server]
    B --> J[React i18next]
    B --> K[Tailwind CSS]
```

### 📧 Servicio de Correo Electrónico

El sistema incluye un servicio robusto de correo electrónico implementado con **Nodemailer**:

#### Características del Servicio
- **Configuración Multi-Proveedor**: Soporta Hostinger, Gmail, y cualquier servidor SMTP
- **Plantillas HTML**: Emails con diseño profesional y responsive
- **Modo Fallback**: Versión de texto plano para compatibilidad total
- **Verificación SMTP**: Endpoint para validar la configuración
- **Logging Integrado**: Registro detallado de envíos y errores

#### Tipos de Emails Implementados

**📧 Correo de Bienvenida**
- Se envía automáticamente al registrar un nuevo usuario
- Incluye información de la cuenta y funcionalidades del sistema
- Plantilla HTML con branding corporativo

**🎯 Emails Futuros Preparados**
- Confirmaciones de citas con códigos QR
- Recordatorios automáticos
- Notificaciones de cambio de estado
- Newsletters administrativas

#### Configuración Técnica

```typescript
// server/services/email.ts
class EmailService {
  private transporter: Transporter;
  
  // Configuración automática basada en variables ENV
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
}
```

### API Endpoints Principales

#### Autenticación
- `POST /api/login` - Iniciar sesión
- `POST /api/register` - Registrar usuario (envía correo de bienvenida)
- `POST /api/logout` - Cerrar sesión
- `GET /api/user` - Obtener usuario actual

#### Email y Notificaciones
- `GET /api/test-email` - Probar conexión SMTP (solo admin)

#### Citas
- `GET /api/appointments` - Listar citas
- `POST /api/appointments` - Crear cita
- `PATCH /api/appointments/:id` - Actualizar cita
- `POST /api/appointments/:id/checkin` - Hacer check-in

#### Cola de Atención
- `GET /api/queue` - Estado actual de la cola
- `POST /api/queue` - Agregar cita a cola
- `POST /api/queue/:id/status` - Actualizar estado
- `PATCH /api/queue/:id/transfer` - Transferir cita

#### Administración
- `GET /api/branches` - Listar sedes
- `POST /api/branches` - Crear sede
- `GET /api/services` - Listar servicios
- `POST /api/services` - Crear servicio
- `GET /api/service-points` - Listar puntos de atención

## 📱 Roles de Usuario

### 🔐 Admin (Administrador)

**Acceso Completo al Sistema**

**Dashboard:**
- Estadísticas globales
- Resumen de todas las sedes
- Métricas de rendimiento

**Gestión de Sedes:**
- Crear/editar/eliminar sedes
- Configurar información de contacto
- Asignar servicios por sede

**Gestión de Servicios:**
- Definir tipos de servicios
- Configurar duración estimada
- Asignar formularios dinámicos

**Gestión de Usuarios:**
- Crear operadores (staff)
- Asignar roles y permisos
- Gestionar accesos por sede

**Configuración Global:**
- Horarios de atención
- Plantillas de email
- Configuraciones del sistema

### 👔 Staff (Operador)

**Gestión de Atención al Cliente**

**Dashboard de Cola:**
- Ver citas con check-in
- Gestionar cola de espera
- Estadísticas de su turno

**Gestión de Turnos:**
- Agregar citas a cola
- Llamar siguiente turno
- Transferir entre puntos
- Completar atención

**Restricciones:**
- Solo su sede asignada
- No puede modificar configuraciones
- Acceso limitado a reportes

### 👤 User (Cliente)

**Autogestión de Citas**

**Reservar Citas:**
- Seleccionar sede y servicio
- Elegir fecha/hora disponible
- Completar formularios requeridos
- Recibir confirmación

**Gestionar Citas:**
- Ver citas programadas
- Cancelar citas
- Hacer check-in digital
- Descargar códigos QR

### 📺 Visualizer (Pantalla Pública)

**Visualización de Turnos**

**Características:**
- Vista de solo lectura
- Información en tiempo real
- Modo pantalla completa
- Anuncios de audio
- Scroll automático

**Configuración:**
- Asignable por sede
- Sin acceso a datos sensibles
- Actualización automática

### 🏪 Selfservice (Autoservicio)

**Generación de Turnos sin Cita**

**Funcionalidades:**
- Generar turnos walk-in
- Seleccionar servicio
- Imprimir comprobante
- Información básica de espera

## 🌐 Internacionalización

El sistema soporta múltiples idiomas con cambio dinámico.

### Idiomas Soportados

- 🇪🇸 **Español** (es) - Idioma principal
- 🇺🇸 **Inglés** (en) - Idioma secundario

### Estructura de Traducciones

```
client/src/i18n/
├── 📄 index.ts              # Configuración de i18next
└── 📁 locales/
    ├── 📄 es.json           # Traducciones en español
    └── 📄 en.json           # Traducciones en inglés
```

### Formato de Archivos de Traducción

```json
{
  "language": "es",
  "common": {
    "loading": "Cargando...",
    "error": "Error",
    "success": "¡Éxito!",
    "save": "Guardar",
    "cancel": "Cancelar"
  },
  "appointments": {
    "title": "Mis Citas",
    "book": "Reservar Cita",
    "status": {
      "scheduled": "Programada",
      "completed": "Completada"
    }
  },
  "queue": {
    "manage": "Gestionar Cola",
    "transfer": "Transferir"
  }
}
```

### Uso en Componentes

```typescript
import { useTranslation } from 'react-i18next';

function MiComponente() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('appointments.title')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### Agregar Nuevo Idioma

1. **Crear archivo de traducción:**
```bash
# Crear archivo para francés
cp client/src/i18n/locales/en.json client/src/i18n/locales/fr.json
```

2. **Registrar idioma:**
```typescript
// client/src/i18n/index.ts
import frTranslations from './locales/fr.json';

i18n.addResourceBundle('fr', 'translation', frTranslations);
```

3. **Agregar al selector de idioma:**
```typescript
const languages = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' } // Nuevo idioma
];
```

## 🔒 Seguridad

### Autenticación y Sesiones

- **Passport.js** con estrategia local
- **Sesiones seguras** con `express-session`
- **Cookies HttpOnly** para prevenir XSS
- **Hash de contraseñas** con scrypt

### Control de Acceso

#### Middleware de Autorización

```typescript
// Ejemplo de middleware de rol
function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    next();
  };
}

// Uso en rutas
app.get('/api/admin/users', requireRole(['admin']), getUsersHandler);
```

#### Segregación por Sede

```typescript
// Staff solo puede ver datos de su sede
if (req.user.role === 'staff' && req.user.branchId !== targetBranchId) {
  return res.status(403).json({ 
    message: 'No autorizado para esta sede' 
  });
}
```

### Validación de Datos

```typescript
import { z } from 'zod';

// Schema de validación
const createAppointmentSchema = z.object({
  serviceId: z.number().min(1),
  scheduledAt: z.string().datetime(),
  userData: z.object({
    name: z.string().min(2),
    email: z.string().email()
  })
});

// Uso en rutas
app.post('/api/appointments', validateSchema(createAppointmentSchema), handler);
```

### Mejores Prácticas Implementadas

- ✅ **SQL Injection Prevention** - Uso de ORM con queries parametrizadas
- ✅ **XSS Protection** - Sanitización de inputs
- ✅ **CSRF Protection** - Tokens de sesión
- ✅ **Rate Limiting** - Prevención de ataques de fuerza bruta
- ✅ **Secure Headers** - Configuración de seguridad HTTP
- ✅ **Input Validation** - Validación robusta con Zod
- ✅ **Error Handling** - No exposición de información sensible

## 📊 Base de Datos

### Esquema de Entidades

#### Diagrama ER Simplificado

```
👥 users
├── id (PK)
├── username
├── email
├── role
└── branchId (FK → branches)

🏢 branches (Sedes)
├── id (PK)
├── name
├── address
└── phone

🛠️ services
├── id (PK)
├── name
├── duration
└── formId (FK → forms)

📍 servicePoints
├── id (PK)
├── name
├── branchId (FK → branches)
└── isActive

📅 appointments
├── id (PK)
├── userId (FK → users)
├── serviceId (FK → services)
├── branchId (FK → branches)
├── servicePointId (FK → servicePoints)
├── confirmationCode
├── qrCode
├── status
└── scheduledAt

🎯 queues
├── id (PK)
├── appointmentId (FK → appointments)
├── counter
├── status
└── calledAt
```

### Migraciones

#### Ejecutar Migraciones

```bash
# Aplicar cambios al esquema
npm run db:push

# Generar migración automática
npx drizzle-kit generate:pg

# Ejecutar migración específica
npx drizzle-kit migrate
```

#### Ejemplo de Migración

```sql
-- Agregar nueva columna
ALTER TABLE appointments 
ADD COLUMN estimated_duration INTEGER DEFAULT 30;

-- Crear índice para performance
CREATE INDEX idx_appointments_scheduled_at 
ON appointments(scheduled_at);

-- Actualizar datos existentes
UPDATE appointments 
SET estimated_duration = services.duration 
FROM services 
WHERE appointments.service_id = services.id;
```

### Backup y Restauración

#### Backup Automático

```bash
#!/bin/bash
# scripts/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
DB_NAME="gestion_atencion_plus"

mkdir -p $BACKUP_DIR

pg_dump $DB_NAME > "$BACKUP_DIR/backup_$DATE.sql"

# Mantener solo últimos 7 backups
ls -t $BACKUP_DIR/backup_*.sql | tail -n +8 | xargs -r rm
```

#### Restauración

```bash
# Restaurar desde backup
psql gestion_atencion_plus < backups/backup_20240101_120000.sql
```

### Optimización de Performance

#### Índices Recomendados

```sql
-- Búsquedas frecuentes de citas
CREATE INDEX idx_appointments_user_status 
ON appointments(user_id, status);

-- Consultas de cola por fecha
CREATE INDEX idx_queue_created_at 
ON queues(created_at DESC);

-- Búsquedas por sede
CREATE INDEX idx_appointments_branch 
ON appointments(branch_id, scheduled_at);
```

## 🎨 Personalización

### Theming con Tailwind CSS

#### Colores Personalizados

```typescript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        brand: {
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
        }
      }
    }
  }
}
```

#### Variables CSS Dinámicas

```css
/* globals.css */
:root {
  --primary-color: 59 130 246;
  --success-color: 16 185 129;
  --warning-color: 245 158 11;
  --danger-color: 239 68 68;
}

[data-theme="dark"] {
  --primary-color: 96 165 250;
  /* ... otros colores para tema oscuro */
}
```

### Personalización de Componentes

#### Componente de Card Personalizada

```typescript
// components/ui/custom-card.tsx
interface CustomCardProps {
  variant?: 'default' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}

export function CustomCard({ variant = 'default', children }: CustomCardProps) {
  const variants = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
  };

  return (
    <div className={`rounded-lg border p-4 ${variants[variant]}`}>
      {children}
    </div>
  );
}
```

### Configuración de Audio

#### Personalizar Anuncios de Turnos

```typescript
// utils/audio.ts
interface AudioConfig {
  voice: 'male' | 'female';
  speed: number;
  language: 'es-ES' | 'en-US';
}

export function configureAudio(config: AudioConfig) {
  const synth = window.speechSynthesis;
  
  return function announceturn(turnNumber: string, servicePoint: string) {
    const text = `Turno ${turnNumber}, diríjase a ${servicePoint}`;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = config.language;
    utterance.rate = config.speed;
    
    synth.speak(utterance);
  };
}
```

## 🧪 Testing

### Estructura de Testing

```
tests/
├── 📁 unit/              # Tests unitarios
│   ├── 📁 components/    # Tests de componentes React
│   ├── 📁 hooks/         # Tests de custom hooks
│   └── 📁 utils/         # Tests de utilidades
├── 📁 integration/       # Tests de integración
│   ├── 📁 api/          # Tests de endpoints
│   └── 📁 database/     # Tests de queries
└── 📁 e2e/              # Tests end-to-end
    ├── 📁 user-flows/   # Flujos de usuario
    └── 📁 admin-flows/  # Flujos administrativos
```

### Configuración de Testing

#### Jest + Testing Library

```bash
# Instalar dependencias de testing
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event jsdom
```

#### Configuración Jest

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
  },
  collectCoverageFrom: [
    'client/src/**/*.{ts,tsx}',
    '!client/src/**/*.d.ts',
  ],
};
```

### Ejemplos de Tests

#### Test de Componente

```typescript
// tests/unit/components/AppointmentCard.test.tsx
import { render, screen } from '@testing-library/react';
import { AppointmentCard } from '@/components/AppointmentCard';

describe('AppointmentCard', () => {
  const mockAppointment = {
    id: 1,
    confirmationCode: 'ABC123',
    serviceName: 'Consulta General',
    scheduledAt: '2024-06-25T10:00:00Z',
    status: 'scheduled'
  };

  it('should render appointment information correctly', () => {
    render(<AppointmentCard appointment={mockAppointment} />);
    
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('Consulta General')).toBeInTheDocument();
  });

  it('should show correct status badge', () => {
    render(<AppointmentCard appointment={mockAppointment} />);
    
    expect(screen.getByText('Programada')).toBeInTheDocument();
  });
});
```

#### Test de API

```typescript
// tests/integration/api/appointments.test.ts
import request from 'supertest';
import { app } from '../../../server';

describe('POST /api/appointments', () => {
  it('should create appointment with valid data', async () => {
    const appointmentData = {
      serviceId: 1,
      branchId: 1,
      scheduledAt: '2024-06-25T10:00:00Z',
      userData: {
        name: 'Juan Pérez',
        email: 'juan@example.com'
      }
    };

    const response = await request(app)
      .post('/api/appointments')
      .send(appointmentData)
      .expect(201);

    expect(response.body.appointment).toHaveProperty('confirmationCode');
    expect(response.body.appointment.status).toBe('scheduled');
  });
});
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Tests con coverage
npm run test:coverage

# Tests específicos
npm test -- --testNamePattern="AppointmentCard"
```

## 🚀 Despliegue

### Opciones de Despliegue

#### 1. Vercel (Frontend) + Railway (Backend)

**Frontend en Vercel:**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configurar variables de entorno en dashboard de Vercel
```

**Backend en Railway:**

```bash
# Conectar repositorio en railway.app
# Configurar variables de entorno
# Deploy automático desde Git
```

#### 2. DigitalOcean Droplet

**Preparar Servidor:**

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# Instalar PM2 para gestión de procesos
sudo npm install -g pm2
```

**Deploy de la Aplicación:**

```bash
# Clonar proyecto
git clone https://tu-repo.git
cd gestion-atencion-plus

# Instalar dependencias
npm install

# Build de producción
npm run build

# Configurar PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

#### 3. Docker Deployment

**Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/gestion_atencion_plus
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: gestion_atencion_plus
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Ejecutar con Docker:**

```bash
# Build y ejecutar
docker-compose up -d

# Ver logs
docker-compose logs -f app
```

### Configuración de Producción

#### Variables de Entorno de Producción

```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/db
SESSION_SECRET=super-secret-key-production
SMTP_HOST=smtp.mailgun.org
SMTP_USER=postmaster@tu-dominio.com
APP_URL=https://tu-dominio.com
```

#### Nginx como Proxy Reverso

```nginx
# /etc/nginx/sites-available/gestion-atencion
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com

# Renovación automática
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Monitoreo y Logs

#### PM2 Monitoring

```bash
# Ver estado de procesos
pm2 status

# Ver logs en tiempo real
pm2 logs

# Reiniciar aplicación
pm2 restart gestion-atencion

# Ver métricas
pm2 monit
```

#### Configuración de Logs

```typescript
// utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Sigue estos pasos para contribuir al proyecto:

### Proceso de Contribución

#### 1. Fork del Proyecto

```bash
# Fork en GitHub y luego clonar tu fork
git clone https://github.com/tu-usuario/gestion-atencion-plus.git
cd gestion-atencion-plus
```

#### 2. Configurar Upstream

```bash
# Agregar repositorio original como upstream
git remote add upstream https://github.com/usuario-original/gestion-atencion-plus.git
```

#### 3. Crear Branch de Feature

```bash
# Crear y cambiar a nueva branch
git checkout -b feature/nueva-funcionalidad

# O para bug fixes
git checkout -b fix/corregir-problema
```

#### 4. Realizar Cambios

```bash
# Hacer commits con mensajes descriptivos
git add .
git commit -m "feat: agregar funcionalidad de notificaciones push"

# O para bug fixes
git commit -m "fix: corregir problema con validación de fechas"
```

#### 5. Sincronizar con Upstream

```bash
# Obtener últimos cambios
git fetch upstream
git checkout main
git merge upstream/main

# Rebase tu branch
git checkout feature/nueva-funcionalidad
git rebase main
```

#### 6. Push y Pull Request

```bash
# Push a tu fork
git push origin feature/nueva-funcionalidad

# Crear Pull Request en GitHub
```

### Convenciones de Código

#### Commits Convencionales

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Tipos de commit
feat:     # Nueva funcionalidad
fix:      # Corrección de bug
docs:     # Cambios en documentación
style:    # Cambios de formato (no afectan lógica)
refactor: # Refactorización de código
test:     # Agregar o corregir tests
chore:    # Tareas de mantenimiento

# Ejemplos
git commit -m "feat(auth): agregar autenticación con Google OAuth"
git commit -m "fix(queue): corregir transferencia entre puntos de atención"
git commit -m "docs: actualizar README con instrucciones de despliegue"
```

#### Estilo de Código

**TypeScript/React:**

```typescript
// Usar PascalCase para componentes
export function AppointmentCard({ appointment }: AppointmentCardProps) {
  // Usar camelCase para variables y funciones
  const [isLoading, setIsLoading] = useState(false);
  
  // Usar async/await en lugar de .then()
  const handleSubmit = async () => {
    try {
      await createAppointment(data);
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      {/* Usar fragmentos cortos cuando sea posible */}
      <>
        <CardHeader>
          <CardTitle>{appointment.serviceName}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Contenido del componente */}
        </CardContent>
      </>
    </Card>
  );
}

// Exportar tipos e interfaces
export interface AppointmentCardProps {
  appointment: Appointment;
  onUpdate?: (appointment: Appointment) => void;
}
```

**CSS/Tailwind:**

```typescript
// Usar clases de Tailwind de forma organizada
const classes = [
  // Layout
  "flex flex-col gap-4",
  // Sizing
  "w-full max-w-md",
  // Spacing
  "p-6 m-4",
  // Colors
  "bg-white border border-gray-200",
  // Interactive
  "hover:shadow-lg transition-shadow duration-200"
].join(" ");
```

### Reportar Issues

#### Template para Bug Reports

```markdown
## 🐛 Bug Report

### Descripción
Descripción clara y concisa del problema.

### Pasos para Reproducir
1. Ir a '...'
2. Hacer clic en '...'
3. Scroll hasta '...'
4. Ver error

### Comportamiento Esperado
Descripción de lo que esperabas que pasara.

### Comportamiento Actual
Descripción de lo que realmente pasó.

### Screenshots
Si aplica, agregar screenshots para explicar el problema.

### Entorno
- OS: [ej. Windows 11, macOS 14]
- Browser: [ej. Chrome 120, Firefox 119]
- Node.js: [ej. 18.17.0]
- Version: [ej. 1.2.3]

### Información Adicional
Cualquier otra información relevante.
```

#### Template para Feature Requests

```markdown
## 💡 Feature Request

### Problema que Resuelve
Descripción clara del problema que esta feature resolvería.

### Solución Propuesta
Descripción clara de lo que te gustaría que pase.

### Alternativas Consideradas
Descripción de alternativas que consideraste.

### Información Adicional
Contexto adicional, screenshots, mockups, etc.
```

### Código de Conducta

Nos comprometemos a mantener un ambiente acogedor e inclusivo. Por favor:

- ✅ Sé respetuoso y profesional
- ✅ Acepta críticas constructivas
- ✅ Enfócate en el bien de la comunidad
- ✅ Muestra empatía hacia otros miembros

- ❌ No uses lenguaje ofensivo o imágenes
- ❌ No hagas ataques personales o políticos
- ❌ No hagas trolling o comentarios destructivos
- ❌ No publiques información privada de otros

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

### MIT License

```
Copyright (c) 2024 Creatisoft

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Soporte y Contacto

### 🆘 Obtener Ayuda

- **📖 Documentación**: Revisa este README y los comentarios en el código
- **🐛 Issues**: [Crear Issue en GitHub](https://github.com/tu-usuario/gestion-atencion-plus/issues)
- **💬 Discusiones**: [GitHub Discussions](https://github.com/tu-usuario/gestion-atencion-plus/discussions)

### 📧 Contacto

- **Email**: contacto@creatisoft.com
- **Website**: [www.creatisoft.com](https://www.creatisoft.com)
- **LinkedIn**: [Creatisoft](https://www.linkedin.com/company/creatisoft)

### 🏆 Créditos

**Desarrollado por**: [Creatisoft](https://www.creatisoft.com)

**Tecnologías que hacen esto posible**:
- [React](https://reactjs.org/) - Biblioteca de UI
- [TypeScript](https://www.typescriptlang.org/) - Tipado estático
- [Express](https://expressjs.com/) - Framework web
- [PostgreSQL](https://www.postgresql.org/) - Base de datos
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Drizzle ORM](https://orm.drizzle.team/) - ORM moderno

---

<div align="center">

**⭐ ¡No olvides dar una estrella si este proyecto te fue útil! ⭐**

Hecho con ❤️ por [Creatisoft](https://www.creatisoft.com)

</div>
