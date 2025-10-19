/**
 * Componente Sidebar de navegación principal para la aplicación VitalCare.
 *
 * Este componente proporciona la navegación lateral principal de la aplicación,
 * con elementos de menú que varían según el rol del usuario autenticado.
 * Incluye funcionalidades de cierre de sesión y navegación responsiva.
 *
 * @component
 * @example
 * ```tsx
 * import { Sidebar } from '@/components/navigation/Sidebar';
 *
 * function Layout() {
 *   const [sidebarOpen, setSidebarOpen] = useState(false);
 *
 *   return (
 *     <div>
 *       <Sidebar
 *         isOpen={sidebarOpen}
 *         onClose={() => setSidebarOpen(false)}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @description
 * El sidebar utiliza React Router para la navegación y filtra los elementos del menú
 * basándose en el rol del usuario (paciente, doctor, staff). Incluye un overlay
 * para dispositivos móviles y estados activos visuales para la navegación actual.
 *
 * Funcionalidades principales:
 * - Navegación basada en roles de usuario.
 * - Estados activos visuales para la ruta actual.
 * - Cierre de sesión con manejo de errores.
 * - Diseño responsivo con overlay móvil.
 * - Información del usuario en el header.
 *
 * Elementos de navegación por rol:
 * - Dashboard: Disponible para todos los roles.
 * - Mis Citas: Solo para pacientes.
 * - Gestión de Citas: Para doctores y staff.
 * - Nueva Cita: Disponible para todos (comportamiento diferente por rol).
 *
 * @see {@link useAuth} para gestión de autenticación.
 * @see {@link authService} para servicios de autenticación.
 * @see {@link useToast} para notificaciones.
 */

import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import { useToast } from '@/contexts/ToastContext';
import {authService} from "@/services/auth.ts";

/**
 * Props para el componente Sidebar.
 * @interface SidebarProps
 */
interface SidebarProps {
  /** Indica si el sidebar está abierto (visible) */
  isOpen: boolean;
  /** Función callback para cerrar el sidebar */
  onClose: () => void;
}

/**
 * Componente funcional que renderiza el sidebar de navegación.
 * @param {SidebarProps} props - Las props del componente.
 * @returns {JSX.Element} El sidebar renderizado.
 */
export function Sidebar({ isOpen, onClose }: SidebarProps) {
  /**
   * Hook de ubicación de React Router para determinar la ruta activa.
   * @type {Location}
   */
  const location = useLocation();

  /**
   * Hook de autenticación para obtener información del usuario y función de logout.
   * @type {Object}
   * @property {Object} user - Información del usuario autenticado.
   * @property {Function} logout - Función para cerrar sesión.
   */
  const { user, logout } = useAuth();

  /**
   * Hook de contexto para mostrar notificaciones de éxito y error.
   * @type {Object}
   * @property {Function} showSuccess - Función para mostrar notificación de éxito.
   * @property {Function} showError - Función para mostrar notificación de error.
   */
  const { showSuccess, showError } = useToast();

  // Logs para debugging
  console.log('Current user in Sidebar:', user);

  /**
   * Determina si el usuario actual es un paciente basado en su rol.
   * @type {boolean}
   */
  const isPatient = user?.role?.toLowerCase().includes('patient');

  /**
   * Determina si el usuario actual es un doctor basado en su rol.
   * @type {boolean}
   */
  const isDoctor = user?.role?.toLowerCase().includes('doctor');

  /**
   * Determina si el usuario actual es personal administrativo basado en su rol.
   * @type {boolean}
   */
  const isStaff = user?.role?.toLowerCase().includes('staff');

  /**
   * Función manejadora para cerrar sesión del usuario.
   * Realiza logout tanto en el servicio como en el hook de autenticación.
   * @async
   * @returns {Promise<void>}
   */
  const handleLogout = async () => {
    try {
      await authService.logout();
      await logout(undefined, undefined); // del hook useAuth
      showSuccess('Sesión cerrada', 'Has cerrado sesión correctamente');
    } catch (error) {
      showError('Error al cerrar sesión', 'Ocurrió un problema al cerrar tu sesión');
    }
  };

  /**
   * Array de elementos de navegación con configuración por rol.
   * Cada elemento incluye nombre, ruta, icono, condición de visibilidad y descripción.
   * @type {Array<Object>}
   */
  const navigationItems = [
    // DASHBOARD - Todos los roles
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      ),
      show: true, // Todos los usuarios pueden ver el dashboard
      description: 'Vista general del sistema'
    },

    // PARA PACIENTES - Sus citas y solicitar nueva cita
    {
      name: 'Mis Citas',
      href: '/appointments',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      ),
      show: isPatient,
      description: 'Ver todas mis citas médicas'
    },

    // PARA DOCTORES Y STAFF - Ver todas las citas
    {
      name: 'Gestión de Citas',
      href: '/appointments',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      ),
      show: isDoctor || isStaff,
      description: 'Ver y gestionar todas las citas del sistema'
    },

    // PARA DOCTORES - Módulo de atención médica
    {
      name: 'Atención Médica',
      href: '/doctor/appointments',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
        </svg>
      ),
      show: isDoctor,
      description: 'Realizar consultas y atender pacientes'
    },

    // CREAR NUEVA CITA - Todos los usuarios (pero se comporta diferente según el rol)
    {
      name: 'Nueva Cita',
      href: '/create-appointment',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      ),
      show: true, // Todos pueden crear citas
      description: isPatient ? 'Solicitar una nueva cita médica' : 'Agendar nueva cita para pacientes'
    },
  ];

  /**
   * Filtra los elementos de navegación basándose en la condición 'show' de cada elemento.
   * @type {Array<Object>}
   */
  const filteredItems = navigationItems.filter(item => item.show);

  return (
    <>
      {/* Overlay oscuro para dispositivos móviles cuando el sidebar está abierto */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" 
          onClick={onClose}
        />
      )}

      {/* Contenedor principal del sidebar con animaciones de transformación */}
      <div className={cn(
        "fixed top-0 left-0 z-30 h-full w-64 bg-[var(--vc-card-bg)] shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-10 border-r border-[var(--vc-border)]",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header del sidebar con logo y botón de cierre */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--vc-border)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="font-bold text-[var(--vc-text)]">VitalCare</h2>
            </div>
            
            {/* Botón de cierre visible solo en móvil */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-[var(--vc-hover)] transition-colors"
            >
              <svg className="w-5 h-5 text-[var(--vc-text)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Sección de información del usuario */}
          <div className="p-6 border-b border-[var(--vc-border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--vc-hover)] rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--vc-text)]/70" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  to="/profile"
                  onClick={onClose}
                  className="text-sm font-medium text-[var(--vc-text)] truncate hover:text-[var(--vc-accent)] transition-colors duration-200 cursor-pointer block"
                  title="Ver perfil completo"
                >
                  {user?.email}
                </Link>
                <p className="text-xs text-[var(--vc-text)]/70">
                  {isPatient && 'Paciente'}
                  {isDoctor && 'Doctor'}
                  {isStaff && 'Personal'}
                </p>
              </div>
            </div>
          </div>

          {/* Navegación principal con elementos filtrados por rol */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {filteredItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                      : "text-[var(--vc-text)] hover:bg-[var(--vc-hover)] hover:text-[var(--vc-accent)]"
                  )}
                  title={item.description}
                >
                  {/* Icono del elemento de navegación */}
                  <span className={cn(
                    "transition-colors duration-200",
                    isActive ? "text-blue-600 dark:text-blue-400" : "text-[var(--vc-text)]/70 group-hover:text-[var(--vc-accent)]"
                  )}>
                    {item.icon}
                  </span>
                  {/* Nombre del elemento */}
                  <span className="flex-1">{item.name}</span>
                  {/* Indicador visual de elemento activo */}
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sección de cierre de sesión en el footer */}
          <div className="p-4 border-t border-[var(--vc-border)]">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
