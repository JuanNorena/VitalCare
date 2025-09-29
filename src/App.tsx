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
 * @see {@link AppRoutes} para la configuración completa de rutas.
 * @see {@link ProtectedRoute} para rutas que requieren autenticación.
 * @see {@link PublicRoute} para rutas solo accesibles sin autenticación.
 * @see {@link MainLayout} para el layout principal de la aplicación.
 * @see {@link useAuth} para el hook de autenticación.
 * @see {@link AccessibilityMenu} para controles de accesibilidad.
 */

import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EnvironmentInfo } from '@/components/EnvironmentInfo';
import { AccessibilityMenu } from '@/components/accessibility/AccessibilityMenu';
import { ToastProvider } from '@/contexts/ToastContext';
import { AppRoutes } from './routes';

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
