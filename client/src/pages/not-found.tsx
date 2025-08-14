/**
 * @fileoverview Página de error 404 - Página No Encontrada
 * 
 * Este componente implementa una página de error 404 completamente funcional y amigable
 * al usuario que se muestra cuando se accede a una ruta que no existe en la aplicación.
 * Proporciona múltiples opciones de navegación y información contextual para ayudar
 * al usuario a recuperarse del error y continuar usando la aplicación.
 * 
 * **Características principales:**
 * - Navegación inteligente basada en roles de usuario
 * - Múltiples opciones de recuperación (Inicio, Atrás, Actualizar)
 * - Información de debugging que muestra la ruta intentada
 * - Diseño responsive y profesional
 * - Completamente internacionalizado
 * - Integración con el sistema de autenticación
 * 
 * **Flujo de recuperación:**
 * 1. Usuario accede a una URL inexistente
 * 2. Se muestra información clara sobre el error
 * 3. Se proporcionan opciones de navegación contextuales
 * 4. Usuario puede elegir la mejor opción para continuar
 * 
 * @version 2.0.0
 * @since 1.0.0
 * @lastModified 2025-06-24
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Home, ArrowLeft, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";

/**
 * Tipos de roles de usuario soportados por el sistema de navegación.
 * 
 * @typedef {("admin" | "staff" | "selfservice" | "visualizer" | "user")} UserRole
 */
type UserRole = "admin" | "staff" | "selfservice" | "visualizer" | "user";

/**
 * Componente de página de error 404 con navegación inteligente y recuperación de errores.
 * 
 * Este componente proporciona una experiencia completa de manejo de errores 404,
 * transformando una simple página de error en una herramienta de retención de usuarios
 * que facilita la navegación y mejora la experiencia general de la aplicación.
 * 
 * **Funcionalidades implementadas:**
 * 
 * **🏠 Navegación Inteligente:**
 * - Detecta automáticamente el rol del usuario autenticado
 * - Redirige a la página principal apropiada según el contexto del usuario
 * - Maneja usuarios no autenticados con ruta de fallback
 * 
 * **🔄 Opciones de Recuperación:**
 * - **Ir al Inicio**: Navegación contextual según rol del usuario
 * - **Volver Atrás**: Utiliza el historial del navegador para retroceder
 * - **Actualizar**: Recarga la página para casos de errores temporales
 * 
 * **🎯 Información Contextual:**
 * - Muestra la URL que el usuario intentó acceder para debugging
 * - Proporciona mensajes claros y orientados al usuario final
 * - Incluye sugerencias de acción y información de ayuda
 * 
 * **🎨 Diseño y UX:**
 * - Layout centrado y responsive para todos los dispositivos
 * - Iconografía contextual con código de colores apropiado
 * - Gradientes y sombras para una apariencia moderna
 * - Organización visual clara con separadores y agrupación
 * 
 * **Rutas por defecto según rol:**
 * - **Admin**: `/admin/dashboard` - Panel administrativo completo
 * - **Staff**: `/queue/manage` - Gestión de colas operativas
 * - **Selfservice**: `/self-services/generate-turn` - Autoservicio de turnos
 * - **Visualizer**: `/visualizer/dashboard` - Dashboards de visualización
 * - **User/Default**: `/appointments/book` - Reserva de citas
 * 
 * @component
 * @example
 * ```tsx
 * // Uso automático en el router principal
 * <Switch>
 *   <Route path="/existing-route" component={SomeComponent} />
 *   // Esta página se activa automáticamente para rutas no encontradas
 *   <Route component={NotFound} />
 * </Switch>
 * 
 * // También puede usarse directamente para casos específicos
 * <NotFound />
 * ```
 * 
 * @returns {JSX.Element} Página completa de error 404 con opciones de navegación
 * 
 * @see {@link useUser} Para obtener información del usuario autenticado
 * @see {@link useLocation} Para gestión de rutas y navegación
 * @see {@link useTranslation} Para internacionalización de textos
 * 
 * @accessibility
 * - Estructura semántica con headers y regiones claramente definidas
 * - Contraste de colores apropiado para legibilidad
 * - Botones con iconos descriptivos y textos claros
 * - Navegación por teclado completamente funcional
 * 
 * @responsive
 * - Layout adaptable para móviles, tablets y desktop
 * - Botones organizados en grid responsive
 * - Espaciado y tamaños optimizados para cada breakpoint
 * 
 * @i18n
 * - Todos los textos completamente internacionalizados
 * - Soporte para español e inglés
 * - Mensajes contextuales y orientados al usuario
 * 
 * @performance
 * - Componente ligero sin dependencias pesadas
 * - Renderizado eficiente con hooks optimizados
 * - Navegación instantánea sin recargas innecesarias
 */
export default function NotFound() {
  // Hooks para gestión de estado, navegación y traducción
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const { user } = useUser();
  
  /**
   * Determina la ruta de destino principal según el rol del usuario autenticado.
   * 
   * Esta función implementa la lógica de navegación contextual que redirige
   * a cada usuario a su página principal más relevante, mejorando la experiencia
   * de usuario al proporcionar navegación inteligente tras un error 404.
   * 
   * @function getDefaultRoute
   * @param {string} role - Rol del usuario autenticado
   * @returns {string} Ruta de destino apropiada para el rol especificado
   * 
   * @example
   * ```tsx
   * const adminRoute = getDefaultRoute("admin");        // "/admin/dashboard"
   * const staffRoute = getDefaultRoute("staff");        // "/queue/manage"
   * const userRoute = getDefaultRoute("user");          // "/appointments/book"
   * ```
   * 
   * @since 2.0.0
   */
  const getDefaultRoute = (role: string): string => {
    switch (role) {
      case "admin":
        return "/admin/dashboard";
      case "staff":
        return "/queue/manage";
      case "selfservice":
        return "/self-services/generate-turn";
      case "visualizer":
        return "/visualizer/dashboard";
      default:
        return "/appointments/book";
    }
  };

  /**
   * Maneja la navegación al inicio según el contexto del usuario.
   * 
   * Implementa navegación inteligente que considera el estado de autenticación
   * del usuario y su rol para determinar la mejor página de destino. Para
   * usuarios no autenticados, redirige a la página de inicio general.
   * 
   * @function handleGoHome
   * @returns {void}
   * 
   * @example
   * ```tsx
   * <Button onClick={handleGoHome}>
   *   <Home className="h-4 w-4" />
   *   Ir al Inicio
   * </Button>
   * ```
   * 
   * @since 2.0.0
   */
  const handleGoHome = (): void => {
    if (user) {
      setLocation(getDefaultRoute(user.role));
    } else {
      setLocation("/");
    }
  };

  /**
   * Utiliza el historial del navegador para retroceder a la página anterior.
   * 
   * Proporciona una opción de navegación natural que permite al usuario
   * volver al punto donde estaba antes de encontrar el error 404, manteniendo
   * el flujo de navegación esperado.
   * 
   * @function handleGoBack
   * @returns {void}
   * 
   * @example
   * ```tsx
   * <Button onClick={handleGoBack} variant="outline">
   *   <ArrowLeft className="h-4 w-4" />
   *   Volver Atrás
   * </Button>
   * ```
   * 
   * @since 2.0.0
   */
  const handleGoBack = (): void => {
    window.history.back();
  };

  /**
   * Recarga la página actual para casos de errores temporales.
   * 
   * Útil para situaciones donde el error 404 puede ser temporal debido a
   * problemas de conectividad, cache, o actualizaciones del sistema. Permite
   * al usuario intentar cargar la página nuevamente.
   * 
   * @function handleRefresh
   * @returns {void}
   * 
   * @example
   * ```tsx
   * <Button onClick={handleRefresh} variant="outline">
   *   <RefreshCw className="h-4 w-4" />
   *   Actualizar
   * </Button>
   * ```
   * 
   * @since 2.0.0
   */
  const handleRefresh = (): void => {
    window.location.reload();
  };
  
  return (
    // Contenedor principal con layout de pantalla completa y fondo con gradiente
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Card principal con sombra y responsive width */}
      <Card className="w-full max-w-lg mx-4 shadow-lg">
        {/* Header con icono prominente y título */}
        <CardHeader className="text-center pb-4">
          {/* Contenedor del icono con background circular */}
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          {/* Título principal internacionalizado */}
          <CardTitle className="text-3xl font-bold text-gray-900">
            {t('notFound.title')}
          </CardTitle>
        </CardHeader>
        
        {/* Contenido principal con espaciado organizado */}
        <CardContent className="space-y-6">
          {/* Sección de información y contexto */}
          <div className="text-center space-y-3">
            {/* Descripción del error */}
            <p className="text-gray-600 leading-relaxed">
              {t('notFound.description')}
            </p>
            
            {/* Información de debugging - muestra la ruta intentada si existe */}
            {location && (
              <div className="p-3 bg-gray-100 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">
                  {t('notFound.attemptedRoute')}:
                </p>
                <code className="text-sm font-mono text-gray-700 break-all">
                  {location}
                </code>
              </div>
            )}
          </div>

          {/* Separador visual */}
          <Separator />

          {/* Sección de acciones y navegación */}
          <div className="space-y-4">
            {/* Texto de sugerencias */}
            <p className="text-sm text-gray-600 text-center">
              {t('notFound.suggestions')}
            </p>
            
            {/* Grid de botones de navegación */}
            <div className="grid grid-cols-1 gap-3">
              {/* Botón principal - Ir al Inicio (navegación inteligente) */}
              <Button 
                onClick={handleGoHome}
                className="w-full flex items-center justify-center gap-2"
                size="lg"
              >
                <Home className="h-4 w-4" />
                {t('notFound.goHome')}
              </Button>
              
              {/* Grid de botones secundarios */}
              <div className="grid grid-cols-2 gap-3">
                {/* Botón Volver Atrás */}
                <Button 
                  onClick={handleGoBack}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('notFound.goBack')}
                </Button>
                
                {/* Botón Actualizar */}
                <Button 
                  onClick={handleRefresh}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {t('notFound.refresh')}
                </Button>
              </div>
            </div>
          </div>

          {/* Footer con información de ayuda */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500">
              {t('notFound.help')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
