import { useState } from "react";
import { useBranchSettingsSummary } from "@/hooks/use-branch-settings";
import { useBranches } from "@/hooks/use-branches";
import BranchSettingsDetail from "@/components/BranchSettingsDetail";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Settings,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  BarChart3,
  Building2,
  Shield,
  Bell,
  Calendar,
  MessageSquare,
  Wrench,
} from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Página principal para la gestión integral de configuraciones de sedes.
 * 
 * Este componente proporciona una interfaz completa para administrar todas las
 * configuraciones específicas de cada sede del sistema, incluyendo políticas de
 * cancelación, reagendamiento, recordatorios y configuraciones de emergencia.
 * 
 * @component
 * @namespace BranchSettingsManagement
 * 
 * ## Características Principales
 * 
 * ### 📊 Dashboard de Configuraciones
 * - **Resumen global**: Estadísticas consolidadas de todas las sedes
 * - **Estado de emergencia**: Vista rápida de sedes en modo emergencia
 * - **Configuraciones personalizadas**: Indicadores de sedes con configuraciones específicas
 * - **Métricas en tiempo real**: Contadores actualizados de configuraciones activas
 * 
 * ### 🏢 Gestión por Sede
 * - **Lista completa**: Todas las sedes con sus configuraciones principales
 * - **Acceso directo**: Navegación rápida a configuraciones específicas
 * - **Indicadores visuales**: Estados y configuraciones de un vistazo
 * - **Comparación rápida**: Vista lado a lado de configuraciones entre sedes
 * 
 * ### ⚡ Acciones Rápidas
 * - **Modo emergencia**: Toggle rápido desde la vista general
 * - **Configuración express**: Acceso directo a ajustes críticos
 * - **Vista detallada**: Modal con configuración completa
 * - **Edición en línea**: Modificaciones rápidas sin navegar
 * 
 * ### 🎨 Interfaz y UX
 * - **Diseño responsivo**: Adaptable a diferentes tamaños de pantalla
 * - **Navegación por pestañas**: Organización clara de contenido
 * - **Estados de carga**: Indicadores visuales durante operaciones
 * - **Alertas contextuales**: Notificaciones sobre estados críticos
 * 
 * @example
 * ```tsx
 * // Uso básico del componente
 * import BranchSettingsOverview from "@/pages/admin/branch-settings";
 * 
 * function AdminDashboard() {
 *   return (
 *     <div>
 *       <BranchSettingsOverview />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Integración con sistema de rutas
 * import { Route } from "react-router-dom";
 * 
 * <Route 
 *   path="/admin/branch-settings" 
 *   component={BranchSettingsOverview} 
 * />
 * ```
 * 
 * ## Estructura de Datos
 * 
 * ### Estadísticas del Sistema
 * ```typescript
 * interface Statistics {
 *   totalBranches: number;
 *   branchesWithCustomSettings: number;
 *   branchesInEmergencyMode: number;
 * }
 * ```
 * 
 * ### Configuración por Sede
 * ```typescript
 * interface BranchSummary {
 *   branchId: number;
 *   branchName: string;
 *   isEmergencyMode: boolean;
 *   hasCustomSettings: boolean;
 *   configuration: {
 *     cancellationHours: number;
 *     rescheduleTimeLimit: number;
 *     maxAdvanceBookingDays: number;
 *     remindersEnabled: boolean;
 *   };
 * }
 * ```
 * 
 * ## Hooks Utilizados
 * - `useBranchSettingsSummary`: Obtiene resumen y estadísticas de configuraciones
 * - `useBranches`: Lista de todas las sedes del sistema
 * - `useTranslation`: Soporte de internacionalización
 * 
 * ## Estados Internos
 * - `selectedBranchId`: ID de la sede seleccionada para edición
 * - `detailDialogOpen`: Control de visibilidad del modal de detalles
 * 
 * @since 1.0.0
 * @see {@link BranchSettingsDetail} - Componente de configuración detallada
 * @see {@link useBranchSettingsSummary} - Hook para datos de resumen
 */

/**
 * Props del componente BranchSettingsOverview.
 * 
 * Actualmente no requiere props externas, ya que maneja todo su estado
 * internamente y obtiene los datos necesarios a través de hooks.
 * 
 * @interface BranchSettingsOverviewProps
 * @since 1.0.0
 */
interface BranchSettingsOverviewProps {}

/**
 * Componente principal para la vista general de configuraciones de sedes.
 * 
 * Renderiza una interfaz completa que incluye estadísticas globales, lista de sedes
 * con sus configuraciones principales, alertas de emergencia y acceso a configuración
 * detallada a través de modales.
 * 
 * @param props - Props del componente (actualmente vacías)
 * @returns Elemento JSX con la interfaz completa de gestión de configuraciones
 * 
 * ## Flujo de Datos
 * 1. **Carga inicial**: Obtiene datos de resumen y lista de sedes
 * 2. **Procesamiento**: Filtra sedes por estado (emergencia, configuraciones personalizadas)
 * 3. **Renderizado**: Muestra estadísticas, listas y controles de gestión
 * 
 * ## Estados de la Interfaz
 * - **Cargando**: Spinner y mensaje de carga mientras obtiene datos
 * - **Error**: Alerta con mensaje de error si falla la carga
 * - **Normal**: Interfaz completa con datos disponibles
 * - **Emergencia**: Alerta destacada para sedes en modo emergencia
 * 
 * ## Interacciones del Usuario
 * - **Ver detalles**: Abre modal con configuración completa de una sede
 * - **Editar**: Acceso directo a edición de configuraciones
 * - **Actualizar**: Recarga datos del servidor
 * - **Navegación**: Cambio entre vista general y por sede
 * 
 * @example
 * ```tsx
 * // Renderizado básico
 * function AdminPage() {
 *   return <BranchSettingsOverview />;
 * }
 * ```
 * 
 * @since 1.0.0
 */
export default function BranchSettingsOverview({}: BranchSettingsOverviewProps) {
  /** Hook de traducción para soporte de internacionalización */
  const { t } = useTranslation();
  
  /** ID de la sede seleccionada para mostrar en el modal de detalles */
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  
  /** Estado de visibilidad del modal de configuración detallada */
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Cargar datos desde los hooks
  /** Datos de resumen y estadísticas de todas las configuraciones de sedes */
  const { data: summaryData, isLoading: summaryLoading, error: summaryError } = useBranchSettingsSummary();
  
  /** Lista completa de sedes del sistema */
  const { branches, isLoading: branchesLoading } = useBranches();

  /** Estado consolidado de carga (verdadero si cualquier hook está cargando) */
  const isLoading = summaryLoading || branchesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">
            {t("branchSettings.loading", "Cargando configuraciones...")}
          </p>
        </div>
      </div>
    );
  }

  if (summaryError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {t("branchSettings.error", "Error al cargar las configuraciones de sedes")}
        </AlertDescription>
      </Alert>
    );
  }

  /** Estadísticas globales del sistema de configuraciones */
  const statistics = summaryData?.statistics;
  
  /** Resumen de configuraciones por sede */
  const summary = summaryData?.summary || [];

  /** Sedes que están actualmente en modo de emergencia */
  const emergencyBranches = summary.filter(branch => branch.isEmergencyMode);
  
  /** Sedes que tienen configuraciones personalizadas (no usan valores por defecto) */
  const customSettingsBranches = summary.filter(branch => branch.hasCustomSettings);

  /**
   * Abre el modal de configuración detallada para una sede específica.
   * 
   * Establece la sede seleccionada y muestra el modal con la interfaz
   * completa de configuración para esa sede.
   * 
   * @param branchId - ID único de la sede a configurar
   * 
   * @example
   * ```tsx
   * // Abrir configuración de la sede con ID 1
   * openDetailDialog(1);
   * ```
   */
  const openDetailDialog = (branchId: number) => {
    setSelectedBranchId(branchId);
    setDetailDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 
        ENCABEZADO PRINCIPAL
        Título de la página, descripción y botones de acción global
        RESPONSIVO: Apila elementos en móviles, reduce tamaño de texto
      */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("branchSettings.title", "Configuraciones de Sedes")}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {t("branchSettings.description", "Gestiona los parámetros de configuración específicos de cada sede")}
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs sm:text-sm"
          >
            <BarChart3 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("common.refresh", "Actualizar")}</span>
          </Button>
        </div>
      </div>

      {/* 
        TARJETAS DE ESTADÍSTICAS
        Métricas principales: total de sedes, configuraciones personalizadas, modo emergencia
        RESPONSIVO: Grid de 1 columna en móviles, 3 en tablet/desktop
      */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("branchSettings.totalBranches", "Total de Sedes")}
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.totalBranches || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t("branchSettings.activeBranches", "Sedes activas en el sistema")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("branchSettings.customSettings", "Configuraciones Personalizadas")}
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.branchesWithCustomSettings || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t("branchSettings.customSettingsDesc", "Sedes con configuraciones específicas")}
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("branchSettings.emergencyMode", "Modo de Emergencia")}
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statistics?.branchesInEmergencyMode || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("branchSettings.emergencyDesc", "Sedes en modo de emergencia activo")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 
        ALERTA DE EMERGENCIA
        Se muestra solo cuando hay sedes en modo de emergencia.
        Lista las sedes afectadas con badges distintivos.
        RESPONSIVO: Badges se apilan en pantallas pequeñas
      */}
      {emergencyBranches.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <p className="font-medium">
                {t("branchSettings.emergencyAlert", "Atención: Sedes en modo de emergencia")}
              </p>
              <div className="flex flex-wrap gap-2">
                {emergencyBranches.map(branch => (
                  <Badge key={branch.branchId} variant="destructive" className="text-xs">
                    {branch.branchName}
                  </Badge>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 
        CONTENIDO PRINCIPAL CON PESTAÑAS
        - Vista General: Resumen de configuraciones y categorías
        - Por Sede: Lista detallada de todas las sedes con sus configuraciones
      */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            <Eye className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("branchSettings.overview", "Vista General")}</span>
            <span className="sm:hidden">{t("branchSettings.overviewShort", "General")}</span>
          </TabsTrigger>
          <TabsTrigger value="branches" className="text-xs sm:text-sm">
            <Building2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("branchSettings.branchList", "Por Sede")}</span>
            <span className="sm:hidden">{t("branchSettings.branchListShort", "Sedes")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 
              RESUMEN RÁPIDO DE CONFIGURACIONES
              Muestra las primeras 5 sedes con sus configuraciones principales.
              Incluye badges para estado de emergencia y configuraciones por defecto.
              RESPONSIVO: Stack vertical en móviles, información compacta
            */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5" />
                  {t("branchSettings.quickOverview", "Resumen de Configuraciones")}
                </CardTitle>
                <CardDescription>
                  {t("branchSettings.quickOverviewDesc", "Configuraciones principales por sede")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary.slice(0, 5).map(branch => (
                  <div key={branch.branchId} className="flex flex-col gap-3 p-3 border rounded-lg sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium text-sm sm:text-base">{branch.branchName}</h4>
                        {branch.isEmergencyMode && (
                          <Badge variant="destructive" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            {t("branchSettings.emergencyShort", "Emergencia")}
                          </Badge>
                        )}
                        {!branch.hasCustomSettings && (
                          <Badge variant="outline" className="text-xs">
                            {t("branchSettings.default", "Por defecto")}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1 sm:space-y-0 sm:space-x-4 sm:flex">
                        <span>{t("branchSettings.tabs.cancellation", "Cancelación")}: {branch.configuration.cancellationHours}h</span>
                        <span>{t("branchSettings.booking", "Reserva")}: {branch.configuration.maxAdvanceBookingDays}d</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetailDialog(branch.branchId)}
                      className="self-start sm:self-auto"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {summary.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    {t("branchSettings.andMore", "y {{count}} más...", { count: summary.length - 5 })}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 
              CATEGORÍAS DE CONFIGURACIÓN
              Muestra las diferentes áreas de configuración disponibles:
              - Cancelaciones: Políticas y tiempos
              - Reagendamiento: Límites y restricciones
              - Recordatorios: Configuración de notificaciones
              RESPONSIVO: Stack vertical en móviles, más compacto
            */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wrench className="h-5 w-5" />
                  {t("branchSettings.categories", "Categorías de Configuración")}
                </CardTitle>
                <CardDescription>
                  {t("branchSettings.categoriesDesc", "Áreas de configuración disponibles")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm">{t("branchSettings.cancellationSettings", "Cancelaciones")}</h4>
                      <p className="text-xs text-muted-foreground">
                        {t("branchSettings.cancellationDesc", "Políticas y tiempos de cancelación")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <Clock className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm">{t("branchSettings.scheduleSettings", "Reagendamiento")}</h4>
                      <p className="text-xs text-muted-foreground">
                        {t("branchSettings.scheduleDesc", "Límites y políticas de reagendamiento")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <Bell className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm">{t("branchSettings.reminderSettings", "Recordatorios")}</h4>
                      <p className="text-xs text-muted-foreground">
                        {t("branchSettings.reminderDesc", "Configuración de notificaciones y recordatorios")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 
          PESTAÑA: LISTA DETALLADA POR SEDE
          Muestra todas las sedes con tarjetas individuales que incluyen:
          - Información básica y badges de estado
          - Configuraciones principales en grid
          - Última actualización
          - Botón de editar para acceder a configuración detallada
          RESPONSIVO: Layout vertical en móviles, información compacta
        */}
        <TabsContent value="branches">
          <div className="space-y-4">
            <div className="grid gap-4">
              {summary.map(branch => (
                <Card key={branch.branchId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-3 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold truncate">{branch.branchName}</h3>
                          {branch.isEmergencyMode && (
                            <Badge variant="destructive" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              {t("branchSettings.emergencyShort", "Emergencia")}
                            </Badge>
                          )}
                          {!branch.hasCustomSettings && (
                            <Badge variant="outline" className="text-xs">
                              {t("branchSettings.default", "Por defecto")}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
                              {t("branchSettings.tabs.cancellation", "Cancelación")}
                            </span>
                            <span className="text-base font-semibold">{branch.configuration.cancellationHours}h</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
                              {t("branchSettings.reschedule", "Reagendamiento")}
                            </span>
                            <span className="text-base font-semibold">{branch.configuration.rescheduleTimeLimit}h</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
                              {t("branchSettings.advance", "Anticipación")}
                            </span>
                            <span className="text-base font-semibold">{branch.configuration.maxAdvanceBookingDays}d</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {branch.configuration.remindersEnabled ? (
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            )}
                            <span className="text-sm">
                              {t("branchSettings.tabs.reminders", "Recordatorios")}
                            </span>
                          </div>
                        </div>

                        {branch.configuration.lastUpdated && (
                          <p className="text-xs text-muted-foreground">
                            {t("branchSettings.lastUpdated", "Última actualización")}: {" "}
                            {new Date(branch.configuration.lastUpdated).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailDialog(branch.branchId)}
                          className="text-xs sm:text-sm"
                        >
                          <Edit className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">{t("common.edit", "Editar")}</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* 
        MODAL DE CONFIGURACIÓN DETALLADA
        Dialog modal que contiene el componente BranchSettingsDetail.
        Se abre cuando el usuario selecciona ver/editar una sede específica.
        Incluye título dinámico con el nombre de la sede seleccionada.
        RESPONSIVO: Altura y ancho adaptables, scroll interno
      */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full sm:max-w-2xl lg:max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl">
              {t("branchSettings.configure", "Configurar Sede")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedBranchId && (
                <>
                  {t("branchSettings.configureDesc", "Ajusta los parámetros específicos de")}{" "}
                  <strong>
                    {summary.find(b => b.branchId === selectedBranchId)?.branchName}
                  </strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedBranchId && (
            <BranchSettingsDetail
              branchId={selectedBranchId}
              onClose={() => setDetailDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
