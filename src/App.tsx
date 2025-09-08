/**
 * Componente principal de la aplicación VitalCare.
 *
 * Este es el punto de entrada principal de la aplicación React que configura
 * todos los proveedores globales, el sistema de routing y la estructura base.
 * Maneja la autenticación, navegación y configuración de estado global.
 *
 * @example
 * ```tsx
 * // La aplicación se renderiza automáticamente en el DOM
 * import App from './App';
 * // No se necesita instanciación manual, React lo maneja
 * ```
 *
 * @description
 * El componente App configura:
 * - React Query para manejo de estado del servidor
 * - React Router para navegación
 * - Sistema de autenticación con rutas protegidas/públicas
 * - Proveedor de toasts para notificaciones
 * - Tema y accesibilidad global
 * - Layout principal con sidebar y navegación
 *
 * La aplicación sigue una arquitectura de rutas protegidas donde:
 * - Rutas públicas: /login, /register (solo para usuarios no autenticados)
 * - Rutas protegidas: /dashboard, /appointments, /create-appointment
 * - Redireccionamiento automático basado en estado de autenticación
 *
 * @see {@link ProtectedRoute} para rutas que requieren autenticación.
 * @see {@link PublicRoute} para rutas solo accesibles sin autenticación.
 * @see {@link MainLayout} para el layout principal de la aplicación.
 * @see {@link useAuth} para el hook de autenticación.
 * @see {@link AccessibilityMenu} para controles de accesibilidad.
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { AppointmentsPage } from '@/pages/appointments/AppointmentsPage';
import { CreateAppointmentPage } from '@/pages/appointments/CreateAppointmentPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { EnvironmentInfo } from '@/components/EnvironmentInfo';
import { useAuth } from '@/hooks/useAuth';
import { AccessibilityMenu } from '@/components/accessibility/AccessibilityMenu';
import { ToastProvider } from '@/contexts/ToastContext';

// ========================================
// CONFIGURACIÓN GLOBAL
// ========================================

/**
 * Configuración del cliente de React Query.
 *
 * Define el comportamiento por defecto para todas las consultas:
 * - Reintentos automáticos en caso de error
 * - Tiempo de vida de los datos en caché
 * - Configuración de stale time para optimización
 *
 * @type {QueryClient}
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                    // Reintentar una vez en caso de error
      staleTime: 5 * 60 * 1000,   // 5 minutos - datos considerados frescos
    },
  },
});

// ========================================
// COMPONENTES DE RUTEO
// ========================================

/**
 * Componente que protege rutas que requieren autenticación.
 *
 * Verifica el estado de autenticación del usuario y:
 * - Muestra loading mientras se verifica la autenticación
 * - Redirige a /login si el usuario no está autenticado
 * - Renderiza el contenido si el usuario está autenticado
 *
 * @component
 * @param {Object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Contenido a renderizar si autenticado.
 * @returns {JSX.Element} Componente renderizado o redirección.
 *
 * @example
 * ```tsx
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 * ```
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Estado de carga - mostrar spinner mientras se verifica autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          {/* Spinner de carga animado */}
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  // Redirigir a login si no autenticado, sino renderizar children
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

/**
 * Componente que protege rutas públicas (solo accesibles sin autenticación).
 *
 * Útil para páginas como login y registro que solo deben mostrarse
 * cuando el usuario NO está autenticado. Si el usuario ya está autenticado,
 * lo redirige automáticamente al dashboard.
 *
 * @component
 * @param {Object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Contenido a renderizar si no autenticado.
 * @returns {JSX.Element} Componente renderizado o redirección.
 *
 * @example
 * ```tsx
 * <PublicRoute>
 *   <LoginPage />
 * </PublicRoute>
 * ```
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Estado de carga - mostrar spinner mientras se verifica autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          {/* Spinner de carga animado */}
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si autenticado, redirigir a dashboard; sino renderizar children
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

/**
 * Componente que define todas las rutas de la aplicación.
 *
 * Centraliza la configuración del sistema de routing con:
 * - Rutas públicas: login y registro
 * - Rutas protegidas: dashboard, appointments, crear cita
 * - Redireccionamiento automático para rutas no encontradas
 * - Manejo de layouts según el tipo de ruta
 *
 * @component
 * @returns {JSX.Element} Sistema completo de rutas de la aplicación.
 *
 * @example
 * ```tsx
 * // Se usa dentro del Router en el componente App principal
 * <AppRoutes />
 * ```
 */
function AppRoutes() {
  return (
    <Routes>
      {/* ======================================== */}
      {/* RUTAS PÚBLICAS - Solo accesibles sin autenticación */}
      {/* ======================================== */}

      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* ======================================== */}
      {/* RUTAS PROTEGIDAS - Requieren autenticación */}
      {/* ======================================== */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <MainLayout>
              <AppointmentsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/create-appointment"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CreateAppointmentPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* ======================================== */}
      {/* REDIRECCIONAMIENTOS */}
      {/* ======================================== */}

      {/* Redireccionamiento por defecto al dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Ruta 404 - redirigir al dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

/**
 * Componente raíz de la aplicación VitalCare.
 *
 * Este componente configura todos los proveedores globales y la estructura
 * base de la aplicación. Es el punto de entrada que React usa para renderizar
 * toda la aplicación en el DOM.
 *
 * @component
 * @returns {JSX.Element} Aplicación completa con todos los proveedores configurados.
 *
 * @example
 * ```tsx
 * // En main.tsx
 * import App from './App';
 * ReactDOM.render(<App />, document.getElementById('root'));
 * ```
 *
 * @description
 * La estructura jerárquica de proveedores es:
 * 1. QueryClientProvider - Para React Query (manejo de estado del servidor)
 * 2. ToastProvider - Para notificaciones globales
 * 3. Router - Para navegación entre páginas
 * 4. AppRoutes - Definición de todas las rutas
 * 5. EnvironmentInfo - Información de desarrollo
 * 6. AccessibilityMenu - Controles de accesibilidad globales
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router>
          <div className="App min-h-screen bg-[var(--vc-bg)] text-[var(--vc-text)] transition-colors duration-300">
            <AppRoutes />
            <EnvironmentInfo />
            <AccessibilityMenu />
          </div>
        </Router>
      </ToastProvider>
    </QueryClientProvider>
  );
}
