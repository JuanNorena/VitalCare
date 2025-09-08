/**
 * Componente MainLayout para el layout principal de la aplicación autenticada.
 *
 * Este componente proporciona la estructura base de la aplicación para usuarios autenticados,
 * incluyendo el sidebar de navegación y el área de contenido principal. Maneja la responsividad
 * para dispositivos móviles y de escritorio.
 *
 * @component
 * @example
 * ```tsx
 * import { MainLayout } from '@/components/layout/MainLayout';
 *
 * function Dashboard() {
 *   return (
 *     <MainLayout>
 *       <div>
 *         <h1>Contenido del Dashboard</h1>
 *       </div>
 *     </MainLayout>
 *   );
 * }
 * ```
 *
 * @description
 * El layout utiliza un diseño flexible con sidebar lateral y área de contenido principal.
 * En dispositivos móviles, incluye una barra superior con botón para abrir el sidebar.
 * El menú de accesibilidad se renderiza globalmente en el componente App.
 *
 * Estructura del layout:
 * - Sidebar fijo en desktop, deslizable en móvil.
 * - Área de contenido principal con scroll.
 * - Header móvil con logo y botón de menú.
 * - Fondo consistente con variables CSS del tema.
 *
 * @see {@link Sidebar} para el componente de navegación lateral.
 */

import { useState } from 'react';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Button } from '@/components/ui/Button';

/**
 * Props para el componente MainLayout.
 * @interface MainLayoutProps
 */
interface MainLayoutProps {
  /** Contenido React que se renderizará en el área principal */
  children: React.ReactNode;
}

/**
 * Componente funcional que renderiza el layout principal de la aplicación.
 * @param {MainLayoutProps} props - Las props del componente.
 * @returns {JSX.Element} El layout renderizado con sidebar y contenido.
 */
export function MainLayout({ children }: MainLayoutProps) {
  /**
   * Estado para controlar la apertura y cierre del sidebar en dispositivos móviles.
   * @type {boolean}
   */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[var(--vc-bg)]">
      {/* Sidebar de navegación lateral */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Nota: El menú de accesibilidad se renderiza globalmente en App */}

      {/* Área de contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Barra superior visible solo en dispositivos móviles */}
        <header className="lg:hidden bg-[var(--vc-bg)] border-b border-[var(--vc-border)] px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Botón para abrir el sidebar en móvil */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </Button>

            {/* Logo y nombre de la aplicación */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-bold text-[var(--vc-text)]">VitalCare</span>
            </div>
          </div>
        </header>

        {/* Contenido de la página con scroll */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
