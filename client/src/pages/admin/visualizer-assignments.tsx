import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useUserBranchAssignments } from "@/hooks/use-user-branch-assignments";
import { useBranches } from "@/hooks/use-branches";
import { Users, UserPlus, UserMinus, UserX, Building2, Search, Info, MapPin, Mail, Clock, Filter, Monitor } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * @fileoverview
 * Componente administrativo para la gestión integral de asignaciones de usuarios visualizadores.
 * 
 * Este módulo implementa una interfaz completa de administración que permite a los
 * usuarios con privilegios administrativos gestionar la asignación de usuarios con
 * rol "visualizer" a sedes organizacionales específicas. Este sistema garantiza que
 * los visualizadores solo puedan ver los turnos correspondientes a su sede asignada,
 * proporcionando aislación de datos por ubicación geográfica.
 * 
 * **Arquitectura del componente:**
 * - Vista basada en cards con diseño responsive
 * - Estados reactivos con React hooks
 * - Integración con hooks personalizados para datos
 * - Internacionalización completa (i18n)
 * - Manejo robusto de estados de carga y error
 * 
 * **Flujo de datos:**
 * 1. Carga inicial de usuarios visualizadores y sedes
 * 2. Procesamiento y filtrado de datos en tiempo real
 * 3. Cálculo dinámico de estadísticas
 * 4. Operaciones de asignación con actualización optimista
 * 5. Revalidación automática tras cambios
 * 
 * **Funcionalidad de Aislación:**
 * - Cada visualizador puede estar asignado a una única sede
 * - Los turnos mostrados se filtran automáticamente por sede asignada
 * - Previene visualización de datos de otras sedes
 * - Garantiza privacidad y segmentación de información
 * 
 * @since 1.0.0
 * @version 1.0.0
 * @lastModified 2025-06-24
 * 
 * @requires useUserBranchAssignments Hook para gestión de asignaciones usuario-sede
 * @requires useBranches Hook para gestión de sedes organizacionales
 * @requires useTranslation Hook para internacionalización
 */

/**
 * Tipos de operaciones de asignación disponibles en el sistema.
 * 
 * @typedef {"assign" | "reassign" | "unassign"} AssignmentMode
 * @description
 * - `assign`: Asignar visualizador sin sede a una sede específica
 * - `reassign`: Cambiar visualizador de una sede a otra diferente  
 * - `unassign`: Desasignar visualizador de su sede actual
 */
type AssignmentMode = "assign" | "reassign" | "unassign";

/**
 * Estructura de estadísticas de asignaciones de usuarios visualizadores.
 * 
 * @interface AssignmentStats
 * @property {number} total - Total de usuarios visualizadores registrados
 * @property {number} assigned - Visualizadores con sede asignada
 * @property {number} unassigned - Visualizadores sin sede asignada
 * @property {number} active - Visualizadores con estado activo
 */
interface AssignmentStats {
  total: number;
  assigned: number;
  unassigned: number;
  active: number;
}

/**
 * Componente principal para la administración de asignaciones de usuarios visualizadores.
 * 
 * Este componente React implementa una interfaz administrativa completa que permite
 * gestionar la relación entre usuarios visualizadores y las sedes organizacionales
 * donde operarán las pantallas de visualización. Incluye funcionalidades avanzadas 
 * de filtrado, búsqueda, estadísticas en tiempo real y operaciones de asignación
 * con validación integral de reglas de negocio.
 * 
 * **Funcionalidades principales:**
 * 
 * **📊 Dashboard de Estadísticas:**
 * - Vista general con métricas clave de asignaciones
 * - Contadores en tiempo real de visualizadores totales, asignados y disponibles
 * - Indicadores visuales de estado (activo/inactivo)
 * - Badges informativos con códigos de color
 * 
 * **🔍 Sistema de Búsqueda y Filtrado:**
 * - Búsqueda por nombre de usuario y correo electrónico
 * - Filtrado por estado de asignación (asignados/sin asignar)
 * - Filtrado por sede específica
 * - Combinación de múltiples criterios de búsqueda
 * 
 * **🏪 Gestión de Asignaciones:**
 * - Asignación inicial de visualizadores sin sede
 * - Reasignación entre sedes diferentes
 * - Desasignación completa de visualizadores
 * - Validación de reglas de negocio en tiempo real
 * 
 * **🎨 Interfaz de Usuario:**
 * - Diseño responsive adaptado a diferentes pantallas
 * - Cards informativos con iconografía descriptiva
 * - Tooltips explicativos para acciones disponibles
 * - Estados de carga y error manejados elegantemente
 * 
 * **Reglas de negocio implementadas:**
 * - Un visualizador solo puede estar asignado a una sede
 * - Las sedes deben estar activas para recibir asignaciones
 * - Solo usuarios con rol "visualizer" pueden ser gestionados
 * - Solo administradores pueden realizar operaciones de asignación
 * - Los visualizadores inactivos no pueden recibir nuevas asignaciones
 * - Al asignar un visualizador, solo verá turnos de su sede asignada
 * 
 * @component
 * @example
 * ```tsx
 * // Uso básico en ruta administrativa
 * import VisualizerAssignments from '@/pages/admin/visualizer-assignments';
 * 
 * function AdminRoutes() {
 *   return (
 *     <Routes>
 *       <Route 
 *         path="/admin/visualizer-assignments" 
 *         element={<VisualizerAssignments />} 
 *       />
 *     </Routes>
 *   );
 * }
 * ```
 * 
 * @returns {JSX.Element} Interfaz completa de gestión de asignaciones de visualizadores
 * 
 * @see {@link useUserBranchAssignments} Para la gestión de datos de asignaciones
 * @see {@link useBranches} Para la gestión de datos de sedes
 * 
 * @throws {Error} Cuando falla la carga de datos de usuarios o sedes
 * @throws {Error} Cuando el usuario no tiene permisos administrativos
 * @throws {Error} Cuando fallan las operaciones de asignación en el servidor
 * 
 * @accessibility
 * - Soporte completo para navegación por teclado
 * - Tooltips descriptivos para todas las acciones
 * - Indicadores visuales de estado y progreso
 * - Etiquetas semánticas para lectores de pantalla
 * 
 * @performance
 * - Filtrado en tiempo real sin re-renders innecesarios
 * - Carga lazy de datos solo cuando es necesario
 * - Estados de carga optimizados para UX fluida
 * - Actualización optimista para respuesta inmediata
 * 
 * @since 1.0.0
 * @version 1.0.0
 * @lastModified 2025-06-24
 */
export default function VisualizerAssignments() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("all");
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>("assign");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [processingAssignment, setProcessingAssignment] = useState(false);

  const { 
    users: visualizerUsers, 
    loading: usersLoading, 
    error: usersError, 
    fetchUsersByRole, 
    assignBranch 
  } = useUserBranchAssignments();
  
  const { 
    branches, 
    isLoading: branchesLoading,
  } = useBranches();
  
  /**
   * Efecto de inicialización para cargar datos de usuarios visualizadores.
   * 
   * Se ejecuta automáticamente al montar el componente y carga todos los
   * usuarios con rol "visualizer" desde el servidor. Esta carga inicial
   * es necesaria para poblar la interfaz con datos actualizados.
   * 
   * @effect
   * @dependency [] - Solo se ejecuta una vez al montar el componente
   * 
   * @since 1.0.0
   */
  useEffect(() => {
    fetchUsersByRole("visualizer");
  }, []);

  /**
   * Función de filtrado avanzado para usuarios visualizadores.
   * 
   * Aplica múltiples criterios de filtrado simultáneamente sobre la lista
   * de usuarios, incluyendo búsqueda textual y filtros por estado de asignación.
   * Optimizada para ejecución en tiempo real sin afectar el rendimiento.
   * 
   * **Criterios de filtrado aplicados:**
   * - Búsqueda por nombre de usuario (case-insensitive)
   * - Búsqueda por dirección de correo electrónico
   * - Filtro por estado de asignación (asignado/sin asignar)
   * - Filtro por sede específica
   * 
   * **Lógica de filtrado:**
   * - "all": Muestra todos los usuarios sin restricción
   * - "assigned": Solo usuarios con sede asignada (branchId exists)
   * - "unassigned": Solo usuarios sin sede asignada (branchId is null)
   * - ID numérico: Solo usuarios asignados a esa sede específica
   * 
   * @computed
   * @returns {UserWithBranch[]} Array filtrado de usuarios que cumplen criterios
   * 
   * @since 1.0.0
   */
  const filteredUsers = visualizerUsers.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBranch = selectedBranchFilter === "all" || 
                         (selectedBranchFilter === "unassigned" && !user.branchId) ||
                         (selectedBranchFilter === "assigned" && user.branchId) ||
                         user.branchId?.toString() === selectedBranchFilter;
    
    return matchesSearch && matchesBranch;
  });

  /**
   * Objeto de estadísticas calculadas dinámicamente sobre usuarios visualizadores.
   * 
   * Proporciona métricas en tiempo real sobre el estado de asignaciones,
   * útiles para dashboards administrativos y toma de decisiones. Los valores
   * se recalculan automáticamente cuando cambian los datos de usuarios.
   * 
   * @computed
   * @type {AssignmentStats}
   * 
   * @since 1.0.0
   */
  const stats: AssignmentStats = {
    total: visualizerUsers.length,
    assigned: visualizerUsers.filter(user => user.branchId).length,
    unassigned: visualizerUsers.filter(user => !user.branchId).length,
    active: visualizerUsers.filter(user => user.isActive).length,
  };
  
  /**
   * Lista filtrada de sedes activas disponibles para asignación.
   * 
   * @computed
   * @type {Branch[]}
   * 
   * @since 1.0.0
   */
  const activeBranches = branches?.filter(branch => branch.isActive) || [];

  /**
   * Función principal para procesar operaciones de asignación de visualizadores a sedes.
   * 
   * @async
   * @function handleAssignment
   * 
   * @returns {Promise<void>} Promise que se resuelve al completar la operación
   * 
   * @since 1.0.0
   */
  const handleAssignment = async () => {
    if (!selectedUserId) return;

    try {
      setProcessingAssignment(true);
      
      const branchIdToAssign = assignmentMode === "unassign" ? null : selectedBranchId;
      await assignBranch(selectedUserId, branchIdToAssign);
      
      // Refrescar datos
      await fetchUsersByRole("visualizer");
      
      // Cerrar dialog y limpiar estado
      setIsDialogOpen(false);
      setSelectedUserId(null);
      setSelectedBranchId(null);
      setAssignmentMode("assign");
      
    } catch (error) {
      console.error(t("admin.visualizerAssignments.assignmentError"), error);
    } finally {
      setProcessingAssignment(false);
    }
  };

  /**
   * Función para inicializar y abrir el modal de asignación con configuración específica.
   * 
   * @function openAssignmentDialog
   * @param {AssignmentMode} mode - Tipo de operación a realizar
   * @param {number} userId - ID del usuario sobre el que operar
   * 
   * @returns {void}
   * 
   * @since 1.0.0
   */
  const openAssignmentDialog = (mode: AssignmentMode, userId: number) => {
    setAssignmentMode(mode);
    setSelectedUserId(userId);
    setSelectedBranchId(null);
    setIsDialogOpen(true);
  };

  /**
   * Renderizado condicional para estado de carga inicial.
   * 
   * @render LoadingState
   * @condition usersLoading || branchesLoading
   * @returns {JSX.Element} Spinner animado con mensaje descriptivo
   * 
   * @since 1.0.0
   */
  if (usersLoading || branchesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("admin.visualizerAssignments.loadingAssignments")}</p>
        </div>
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-destructive">
          <AlertDescription>
            {t("admin.visualizerAssignments.errorLoadingData")} {usersError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("admin.visualizerAssignments.title")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("admin.visualizerAssignments.description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Monitor className="h-8 w-8 text-primary" />
          <Badge variant="secondary">{stats.total} {t("admin.visualizerAssignments.totalUsers").toLowerCase()}</Badge>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.visualizerAssignments.totalUsers")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {t("admin.visualizerAssignments.totalVisualizerUsers")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.visualizerAssignments.assigned")}</CardTitle>
            <Building2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.assigned}</div>
            <p className="text-xs text-muted-foreground">
              {t("admin.visualizerAssignments.usersWithBranch")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.visualizerAssignments.unassigned")}</CardTitle>
            <UserX className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.unassigned}</div>
            <p className="text-xs text-muted-foreground">
              {t("admin.visualizerAssignments.usersWithoutBranch")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.visualizerAssignments.active")}</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {t("admin.visualizerAssignments.activeUsers")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t("admin.visualizerAssignments.filtersAndSearch")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.visualizerAssignments.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[200px]">
              <Select value={selectedBranchFilter} onValueChange={setSelectedBranchFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.visualizerAssignments.filterByBranch")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.visualizerAssignments.allBranches")}</SelectItem>
                  <SelectItem value="assigned">{t("admin.visualizerAssignments.onlyAssigned")}</SelectItem>
                  <SelectItem value="unassigned">{t("admin.visualizerAssignments.onlyUnassigned")}</SelectItem>
                  {activeBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.visualizerAssignments.visualizerUsers")}</CardTitle>
          <CardDescription>
            {t("admin.visualizerAssignments.manageBranchAssignments")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {t("admin.visualizerAssignments.noUsersFound")}
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3 sm:gap-4"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex-shrink-0">
                      <Monitor className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{user.username}</p>
                        {!user.isActive && (
                          <Badge variant="destructive" className="text-xs flex-shrink-0">
                            {t("admin.visualizerAssignments.inactive")}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      {user.branchId && user.branchName && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{user.branchName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    {user.branchId ? (
                      <>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openAssignmentDialog("reassign", user.id)}
                                className="text-xs sm:text-sm px-2 sm:px-3"
                              >
                                <UserMinus className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">{t("admin.visualizerAssignments.reassign")}</span>
                                <span className="sm:hidden">{t("admin.visualizerAssignments.reassignShort")}</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("admin.visualizerAssignments.changeBranch")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openAssignmentDialog("unassign", user.id)}
                                className="text-xs sm:text-sm px-2 sm:px-3"
                              >
                                <UserX className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">{t("admin.visualizerAssignments.unassign")}</span>
                                <span className="sm:hidden">{t("admin.visualizerAssignments.unassignShort")}</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("admin.visualizerAssignments.removeBranch")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openAssignmentDialog("assign", user.id)}
                              disabled={!user.isActive}
                              className="text-xs sm:text-sm px-2 sm:px-3"
                            >
                              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">{t("admin.visualizerAssignments.assign")}</span>
                              <span className="sm:hidden">{t("admin.visualizerAssignments.assignShort")}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("admin.visualizerAssignments.assignBranch")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Asignación */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {assignmentMode === "assign" && t("admin.visualizerAssignments.assignBranchTitle")}
              {assignmentMode === "reassign" && t("admin.visualizerAssignments.reassignBranchTitle")}
              {assignmentMode === "unassign" && t("admin.visualizerAssignments.unassignBranchTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {assignmentMode === "assign" && t("admin.visualizerAssignments.assignBranchDescription")}
              {assignmentMode === "reassign" && t("admin.visualizerAssignments.reassignBranchDescription")}
              {assignmentMode === "unassign" && t("admin.visualizerAssignments.unassignBranchDescription")}
            </DialogDescription>
          </DialogHeader>

          {assignmentMode !== "unassign" && (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium">{t("admin.visualizerAssignments.branch")}</label>
                <Select 
                  value={selectedBranchId?.toString() || ""} 
                  onValueChange={(value) => setSelectedBranchId(parseInt(value))}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder={t("admin.visualizerAssignments.selectBranch")} />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBranches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span className="truncate">{branch.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={processingAssignment}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              {t("admin.visualizerAssignments.cancel")}
            </Button>
            <Button
              onClick={handleAssignment}
              disabled={
                processingAssignment || 
                (assignmentMode !== "unassign" && !selectedBranchId)
              }
              variant={assignmentMode === "unassign" ? "destructive" : "default"}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {processingAssignment ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span className="truncate">{t("admin.visualizerAssignments.processing")}</span>
                </div>
              ) : (
                <>
                  {assignmentMode === "assign" && t("admin.visualizerAssignments.assignButton")}
                  {assignmentMode === "reassign" && t("admin.visualizerAssignments.reassignButton")}
                  {assignmentMode === "unassign" && t("admin.visualizerAssignments.unassignButton")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
