/**
 * Componente principal de la aplicación VitalCare
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { AppointmentsPage } from '@/pages/appointments/AppointmentsPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { EnvironmentInfo } from '@/components/EnvironmentInfo';
import { useAuth } from '@/hooks/useAuth';
import { AccessibilityMenu } from '@/components/accessibility/AccessibilityMenu';

// Configuración del Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

// Componente para rutas protegidas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Componente para rutas públicas (solo accesibles si no está autenticado)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

// Componente de rutas de la aplicación
function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
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

      {/* Rutas protegidas */}
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

      {/* Ruta de appointments */}
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

      {/* Redireccionamiento por defecto */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Ruta 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Componente principal de la aplicación
export default function App() {
  return (
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="App min-h-screen bg-[var(--vc-bg)] text-[var(--vc-text)] transition-colors duration-300">
            <AppRoutes />
            <EnvironmentInfo />
            <AccessibilityMenu />
          </div>
        </Router>
      </QueryClientProvider>
  );
}
