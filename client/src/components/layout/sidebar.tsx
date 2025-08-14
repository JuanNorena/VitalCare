import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { Calendar, Settings, Users, Monitor, MapPin, Box, FileText, Cog, Clock, Eye, CheckCircle, Building2, UserCheck, MonitorSpeaker, MonitorX, MessageSquare, Palette, Wrench, BarChart3 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";

/**
 * Tipos de roles de usuario soportados por el sistema
 */
type UserRole = 'admin' | 'staff' | 'selfservice' | 'visualizer' | 'user';

/**
 * Estructura de un enlace de navegación en el sidebar
 * 
 * @interface NavigationLink
 * @property {string} href - Ruta de destino del enlace
 * @property {React.ComponentType} icon - Componente de icono de Lucide React
 * @property {string} label - Texto descriptivo del enlace (internacionalizado)
 */
interface NavigationLink {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

/**
 * Propiedades del componente Sidebar
 * 
 * @interface SidebarProps
 * @property {boolean} [isMobile] - Indica si el sidebar se renderiza en vista móvil
 * @property {() => void} [onClose] - Función callback para cerrar el sidebar en móvil
 */
interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

/**
 * Componente de barra lateral de navegación con control de acceso basado en roles.
 * 
 * Este componente proporciona una navegación contextual que se adapta dinámicamente
 * según el rol del usuario autenticado, mostrando únicamente las opciones y funcionalidades
 * apropiadas para cada tipo de usuario en el sistema de gestión de citas médicas.
 * 
 * **Características principales:**
 * - **Control de acceso por roles**: Muestra enlaces específicos según el rol del usuario
 * - **Navegación responsiva**: Adaptable para vistas desktop y móvil
 * - **Internacionalización**: Soporte completo para múltiples idiomas
 * - **Estado visual activo**: Resalta la página actual en la navegación
 * - **Cierre automático**: En móvil, cierra el sidebar al seleccionar un enlace
 * 
 * **Roles soportados:**
 * - **Admin**: Acceso completo a gestión, configuración y administración
 * - **Staff**: Gestión de colas y check-in de pacientes
 * - **Selfservice**: Generación de turnos en modo autoservicio
 * - **Visualizer**: Visualización de dashboards y pantallas públicas
 * - **User**: Reserva y visualización de citas personales
 * 
 * **Flujo de navegación:**
 * 1. Determina el rol del usuario autenticado
 * 2. Genera los enlaces de navegación apropiados para ese rol
 * 3. Renderiza la interfaz adaptada para desktop o móvil
 * 4. Maneja la navegación y el estado activo de las rutas
 * 
 * @component
 * @example
 * ```tsx
 * // Uso en vista desktop
 * <Sidebar />
 * 
 * // Uso en vista móvil con callback de cierre
 * <Sidebar 
 *   isMobile={true} 
 *   onClose={() => setMobileMenuOpen(false)} 
 * />
 * 
 * // Integración en layout principal
 * function AppLayout({ children }) {
 *   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 *   
 *   return (
 *     <div className="flex">
 *       <Sidebar isMobile={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
 *       <main>{children}</main>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @param {SidebarProps} props - Propiedades del componente
 * @returns {JSX.Element} Componente de navegación lateral con enlaces contextuales por rol
 * 
 * @see {@link useUser} Para obtener información del usuario autenticado
 * @see {@link useLocation} Para gestión de rutas y estado activo
 * @see {@link useTranslation} Para internacionalización de textos
 * 
 * @since 1.0.0
 * @version 1.3.0
 * @lastModified 2025-01-28
 */
export function Sidebar({ isMobile, onClose }: SidebarProps) {  // Hooks para gestión de usuario, ubicación y traducción
  const { user } = useUser();
  const [location] = useLocation();
  const { t } = useTranslation();
  
  /**
   * Determina si una ruta específica está actualmente activa.
   * 
   * Compara la ubicación actual con la ruta proporcionada para aplicar
   * estilos visuales que indiquen al usuario en qué sección se encuentra.
   * 
   * @function isActive
   * @param {string} path - Ruta a verificar contra la ubicación actual
   * @returns {boolean} True si la ruta está activa, false en caso contrario
   * 
   * @example
   * ```tsx
   * const isHomeActive = isActive('/dashboard');
   * // Retorna true si estamos en '/dashboard'
   * ```
   */
  const isActive = (path: string) => location === path;  /**
   * Enlaces de navegación para usuarios regulares.
   * 
   * Disponibles para todos los usuarios excepto 'selfservice' y 'visualizer',
   * que tienen interfaces especializadas. Incluye funcionalidades básicas
   * de reserva y visualización de citas personales.
   * 
   * @computed
   * @type {NavigationLink[]}
   */
  const links = user?.role !== "selfservice" && user?.role !== "visualizer" ? [
    { href: "/appointments/book", icon: Calendar, label: t('appointments.book') },
    { href: "/appointments/view", icon: Calendar, label: t('appointments.view') },
  ] : [];  /**
   * Enlaces de administración para usuarios con rol de administrador.
   * 
   * Proporciona acceso completo a todas las funcionalidades del sistema:
   * - Gestión de servicios y puntos de atención
   * - Configuración de autoservicios y horarios
   * - Administración de usuarios y formularios
   * - Dashboard administrativo y herramientas de check-in
   * 
   * @computed
   * @type {NavigationLink[]}
   */  const adminLinks = user?.role === "admin" ? [
    { href: "/admin/services", icon: Cog, label: t('services.title') },
    { href: "/admin/branches", icon: Building2, label: t('branches.title') },
    { href: "/admin/branch-settings", icon: Wrench, label: t('branchSettings.title') },
    { href: "/admin/custom-pages", icon: Palette, label: t('customPages.title') },
    { href: "/admin/service-points", icon: MapPin, label: t('servicePoints.manage') },
    { href: "/admin/self-services", icon: Box, label: t('selfServices.title') },
    { href: "/admin/generate-turn", icon: Clock, label: t('generateTurn.title') },
    { href: "/admin/schedule", icon: Calendar, label: t('schedule.title') },
    { href: "/admin/forms", icon: FileText, label: t('forms.title') },
    { href: "/admin/surveys", icon: MessageSquare, label: t('surveys.title') },
    { href: "/admin/users", icon: Users, label: t('admin.users.title') },    { href: "/admin/staff-assignments", icon: UserCheck, label: t('admin.staffAssignments.title') },
    { href: "/admin/selfservice-assignments", icon: MonitorSpeaker, label: t('admin.selfServiceAssignments.title') },
    { href: "/admin/visualizer-assignments", icon: MonitorX, label: t('admin.visualizerAssignments.title') },
    { href: "/admin/wait-time-reports", icon: BarChart3, label: t('admin.waitTimeReports.title') },
    { href: "/admin/dashboard", icon: Monitor, label: t('admin.dashboard') },
    { href: "/appointments/checkin", icon: CheckCircle, label: t('checkin.title') },
  ] : [];/**
   * Enlaces para personal médico y administrativo (staff).
   * 
   * Proporciona acceso a herramientas operativas para la gestión diaria:
   * - Gestión de colas de espera y turnos
   * - Check-in de pacientes y control de flujo
   * 
   * @computed
   * @type {NavigationLink[]}
   */  const staffLinks = user?.role === "staff" ? [
    { href: "/queue/manage", icon: Users, label: t('queue.manage') },
    { href: "/appointments/checkin", icon: CheckCircle, label: t('checkin.title') },
  ] : [];
  
  /**
   * Enlaces para usuarios de autoservicio (kioscos y terminales).
   * 
   * Interfaz simplificada para generación autónoma de turnos,
   * diseñada para uso público en terminales de autoservicio.
   * 
   * @computed
   * @type {NavigationLink[]}
   */
  const selfServiceLinks = user?.role === "selfservice" ? [
    { href: "/self-services/generate-turn", icon: Clock, label: t('generateTurn.title') },
  ] : [];

  /**
   * Enlaces para usuarios visualizadores (pantallas públicas).
   * 
   * Acceso a dashboards de información pública para mostrar
   * en pantallas de sala de espera y áreas comunes.
   * 
   * @computed
   * @type {NavigationLink[]}
   */
  const visualizerLinks = user?.role === "visualizer" ? [
    { href: "/visualizer/dashboard", icon: Eye, label: t('visualizer.dashboard') },
  ] : [];
  /**
   * Enlace de configuración del sistema.
   * 
   * Acceso exclusivo para administradores a la configuración general
   * del sistema, parámetros globales y ajustes avanzados.
   * 
   * @computed
   * @type {NavigationLink | null}
   */
  const settingsLink = user?.role === "admin" 
    ? { href: "/admin/settings", icon: Settings, label: t('settings.title') }
    : null;
  /**
   * Maneja el evento de clic en los enlaces de navegación.
   * 
   * En vista móvil, cierra automáticamente el sidebar después de
   * la navegación para mejorar la experiencia del usuario.
   * 
   * @function handleClick
   * @param {React.MouseEvent<HTMLAnchorElement>} e - Evento de clic del enlace
   * @returns {void}
   * 
   * @example
   * ```tsx
   * <Link href="/dashboard" onClick={handleClick}>
   *   <Button>Dashboard</Button>
   * </Link>
   * ```
   */
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isMobile && onClose) {
      onClose();
    }
  };
  /**
   * Componente interno que renderiza todos los enlaces de navegación.
   * 
   * Organiza y presenta los enlaces según el rol del usuario, aplicando
   * estilos consistentes y manejando el estado activo de cada enlace.
   * 
   * **Secciones de navegación:**
   * - Enlaces regulares (reserva/visualización de citas)
   * - Enlaces administrativos (gestión completa del sistema)
   * - Enlaces de staff (operaciones diarias)
   * - Enlaces de autoservicio (generación de turnos)
   * - Enlaces de visualizador (dashboards públicos)
   * - Enlace de configuración (solo administradores)
   * 
   * @component NavLinks
   * @returns {JSX.Element} Lista completa de enlaces de navegación contextuales
   * 
   * @example
   * ```tsx
   * // Renderizado interno automático según el rol
   * <NavLinks />
   * ```
   */
  const NavLinks = () => (    <div className="space-y-1">
      {/* Enlaces de navegación regulares para usuarios estándar */}
      {links.map((link) => (
        <Link key={link.href} href={link.href} onClick={handleClick}>
          <Button
            variant={isActive(link.href) ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start text-left whitespace-normal break-words min-h-[2.5rem] h-auto py-2",
              isActive(link.href) && "bg-secondary"
            )}
          >
            <link.icon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-2">{link.label}</span>
          </Button>
        </Link>
      ))}

      {/* Enlaces administrativos con acceso completo al sistema */}
      {adminLinks.map((link) => (
        <Link key={link.href} href={link.href} onClick={handleClick}>
          <Button
            variant={isActive(link.href) ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start text-left whitespace-normal break-words min-h-[2.5rem] h-auto py-2",
              isActive(link.href) && "bg-secondary"
            )}
          >
            <link.icon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-2">{link.label}</span>
          </Button>
        </Link>
      ))}

      {/* Enlaces para personal médico y administrativo */}
      {staffLinks.map((link) => (
        <Link key={link.href} href={link.href} onClick={handleClick}>
          <Button
            variant={isActive(link.href) ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start text-left whitespace-normal break-words min-h-[2.5rem] h-auto py-2",
              isActive(link.href) && "bg-secondary"
            )}
          >
            <link.icon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-2">{link.label}</span>
          </Button>
        </Link>
      ))}
      
      {/* Enlaces para terminales de autoservicio */}
      {selfServiceLinks.map((link) => (
        <Link key={link.href} href={link.href} onClick={handleClick}>
          <Button
            variant={isActive(link.href) ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start text-left whitespace-normal break-words min-h-[2.5rem] h-auto py-2",
              isActive(link.href) && "bg-secondary"
            )}
          >
            <link.icon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-2">{link.label}</span>
          </Button>
        </Link>
      ))}

      {/* Enlaces para pantallas de visualización pública */}
      {visualizerLinks.map((link) => (
        <Link key={link.href} href={link.href} onClick={handleClick}>
          <Button
            variant={isActive(link.href) ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start text-left whitespace-normal break-words min-h-[2.5rem] h-auto py-2",
              isActive(link.href) && "bg-secondary"
            )}
          >
            <link.icon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-2">{link.label}</span>
          </Button>
        </Link>
      ))}

      {/* Enlace de configuración (exclusivo para administradores) */}
      {settingsLink && (
        <Link key={settingsLink.href} href={settingsLink.href} onClick={handleClick}>
          <Button
            variant={isActive(settingsLink.href) ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start text-left whitespace-normal break-words min-h-[2.5rem] h-auto py-2",
              isActive(settingsLink.href) && "bg-secondary"
            )}
          >
            <settingsLink.icon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-2">{settingsLink.label}</span>
          </Button>
        </Link>
      )}
    </div>  );

  /**
   * Renderizado condicional del sidebar según el contexto de uso.
   * 
   * **Vista móvil**: Layout optimizado para pantallas pequeñas con altura flexible y scroll
   * **Vista desktop**: Layout fijo con altura completa de pantalla
   * 
   * @returns {JSX.Element} Sidebar adaptado al contexto de visualización
   */
  if (isMobile) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <NavLinks />
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:block h-screen">
      <div className="h-full py-4">
        <div className="px-3 py-2">
          <NavLinks />
        </div>
      </div>
    </div>
  );
}