/**
 * Configuración de rutas de la aplicación VitalCare.
 *
 * Este archivo centraliza toda la configuración de rutas de la aplicación,
 * separando la lógica de routing del componente principal App. Esto mejora
 * la mantenibilidad y organización del código.
 *
 * @description
 * Define todas las rutas de la aplicación con:
 * - Rutas públicas: login y registro (solo sin autenticación)
 * - Rutas protegidas: dashboard, appointments, crear cita
 * - Redireccionamientos automáticos
 * - Manejo de rutas no encontradas
 *
 * @see {@link ProtectedRoute} para rutas que requieren autenticación.
 * @see {@link PublicRoute} para rutas solo accesibles sin autenticación.
 * @see {@link MainLayout} para el layout principal de la aplicación.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ProfilePage } from '@/pages/auth/ProfilePage';
import { AppointmentsPage } from '@/pages/appointments/AppointmentsPage';
import { CreateAppointmentPage } from '@/pages/appointments/CreateAppointmentPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { useAuth } from '@/hooks/useAuth';

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
export function AppRoutes() {
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

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ProfilePage />
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