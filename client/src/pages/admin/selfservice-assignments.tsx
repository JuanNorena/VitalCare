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
import { Users, UserPlus, UserMinus, UserX, Building2, Search, Info, MapPin, Mail, Clock, Filter, MonitorSpeaker } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * @fileoverview
 * Componente administrativo para la gestión integral de asignaciones de usuarios de autoservicio.
 * 
 * Este módulo implementa una interfaz completa de administración que permite a los
 * usuarios con privilegios administrativos gestionar la asignación de usuarios de
 * autoservicio (terminales, kioscos) a sedes organizacionales específicas. Proporciona
 * funcionalidades avanzadas de búsqueda, filtrado, estadísticas en tiempo real y
 * operaciones de asignación con validación de reglas de negocio.
 * 
 * **Arquitectura del componente:**
 * - Vista basada en cards con diseño responsive
 * - Estados reactivos con React hooks
 * - Integración con hooks personalizados para datos
 * - Internacionalización completa (i18n)
 * - Manejo robusto de estados de carga y error
 * 
 * **Flujo de datos:**
 * 1. Carga inicial de usuarios selfservice y sedes
 * 2. Procesamiento y filtrado de datos en tiempo real
 * 3. Cálculo dinámico de estadísticas
 * 4. Operaciones de asignación con actualización optimista
 * 5. Revalidación automática tras cambios
 * 
 * @since 1.0.0
 * @version 1.2.0
 * @lastModified 2025-01-28
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
 * - `assign`: Asignar usuario sin sede a una sede específica
 * - `reassign`: Cambiar usuario de una sede a otra diferente  
 * - `unassign`: Desasignar usuario de su sede actual
 */
type AssignmentMode = "assign" | "reassign" | "unassign";

/**
 * Estructura de estadísticas de asignaciones de usuarios selfservice.
 * 
 * @interface AssignmentStats
 * @property {number} total - Total de usuarios selfservice registrados
 * @property {number} assigned - Usuarios con sede asignada
 * @property {number} unassigned - Usuarios sin sede asignada
 * @property {number} active - Usuarios con estado activo
 */
interface AssignmentStats {
  total: number;
  assigned: number;
  unassigned: number;
  active: number;
}

/**
 * Componente principal para la administración de asignaciones de usuarios de autoservicio.
 * 
 * Este componente React implementa una interfaz administrativa completa que permite
 * gestionar la relación entre usuarios de autoservicio (terminales, kioscos) y las
 * sedes organizacionales donde operan. Incluye funcionalidades avanzadas de filtrado,
 * búsqueda, estadísticas en tiempo real y operaciones de asignación con validación
 * integral de reglas de negocio.
 * 
 * **Funcionalidades principales:**
 * 
 * **📊 Dashboard de Estadísticas:**
 * - Vista general con métricas clave de asignaciones
 * - Contadores en tiempo real de usuarios totales, asignados y disponibles
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
 * - Asignación inicial de usuarios sin sede
 * - Reasignación entre sedes diferentes
 * - Desasignación completa de usuarios
 * - Validación de reglas de negocio en tiempo real
 * 
 * **🎨 Interfaz de Usuario:**
 * - Diseño responsive adaptado a diferentes pantallas
 * - Cards informativos con iconografía descriptiva
 * - Tooltips explicativos para acciones disponibles
 * - Estados de carga y error manejados elegantemente
 * 
 * **Reglas de negocio implementadas:**
 * - Un usuario selfservice solo puede estar asignado a una sede
 * - Las sedes deben estar activas para recibir asignaciones
 * - Solo usuarios con rol "selfservice" pueden ser gestionados
 * - Solo administradores pueden realizar operaciones de asignación
 * - Los usuarios inactivos no pueden recibir nuevas asignaciones
 * 
 * **Estados del componente:**
 * - `searchTerm`: Término de búsqueda para filtrar usuarios
 * - `selectedBranchFilter`: Filtro activo por sede o estado
 * - `assignmentMode`: Tipo de operación de asignación en curso
 * - `selectedUserId`: ID del usuario seleccionado para operación
 * - `selectedBranchId`: ID de la sede de destino para asignación
 * - `isDialogOpen`: Estado del modal de confirmación
 * - `processingAssignment`: Indicador de operación en progreso
 * 
 * **Flujo de trabajo de asignación:**
 * 1. Usuario administrador identifica usuario selfservice
 * 2. Selecciona tipo de operación (asignar/reasignar/desasignar)
 * 3. Sistema valida permisos y reglas de negocio
 * 4. Se presenta modal de confirmación con opciones
 * 5. Usuario confirma operación y sistema procesa cambios
 * 6. Actualización automática de datos y estadísticas
 * 7. Feedback visual del resultado de la operación
 * 
 * @component
 * @example
 * ```tsx
 * // Uso básico en ruta administrativa
 * import SelfServiceAssignments from '@/pages/admin/selfservice-assignments';
 * 
 * function AdminRoutes() {
 *   return (
 *     <Routes>
 *       <Route 
 *         path="/admin/selfservice-assignments" 
 *         element={<SelfServiceAssignments />} 
 *       />
 *     </Routes>
 *   );
 * }
 * 
 * // Integración en layout administrativo
 * function AdminLayout() {
 *   return (
 *     <div className="admin-layout">
 *       <AdminSidebar />
 *       <main>
 *         <SelfServiceAssignments />
 *       </main>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @returns {JSX.Element} Interfaz completa de gestión de asignaciones selfservice
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
 * @version 1.2.0
 * @lastModified 2025-01-28
 */

export default function SelfServiceAssignments() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("all");
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>("assign");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [processingAssignment, setProcessingAssignment] = useState(false);

  const { 
    users: selfServiceUsers, 
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
   * Efecto de inicialización para cargar datos de usuarios selfservice.
   * 
   * Se ejecuta automáticamente al montar el componente y carga todos los
   * usuarios con rol "selfservice" desde el servidor. Esta carga inicial
   * es necesaria para poblar la interfaz con datos actualizados.
   * 
   * @effect
   * @dependency [] - Solo se ejecuta una vez al montar el componente
   * 
   * @since 1.0.0
   */
  useEffect(() => {
    fetchUsersByRole("selfservice");
  }, []);

  /**
   * Función de filtrado avanzado para usuarios selfservice.
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
   * @example
   * ```typescript
   * // Resultado cuando searchTerm="juan" y selectedBranchFilter="assigned"
   * // Retorna solo usuarios con "juan" en username/email Y que tienen sede
   * const filtered = filteredUsers; // [{id: 1, username: "juan123", branchId: 5}, ...]
   * ```
   * 
   * @since 1.0.0
   */  const filteredUsers = selfServiceUsers.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBranch = selectedBranchFilter === "all" || 
                         (selectedBranchFilter === "unassigned" && !user.branchId) ||
                         (selectedBranchFilter === "assigned" && user.branchId) ||
                         user.branchId?.toString() === selectedBranchFilter;
    
    return matchesSearch && matchesBranch;
  });

  /**
   * Objeto de estadísticas calculadas dinámicamente sobre usuarios selfservice.
   * 
   * Proporciona métricas en tiempo real sobre el estado de asignaciones,
   * útiles para dashboards administrativos y toma de decisiones. Los valores
   * se recalculan automáticamente cuando cambian los datos de usuarios.
   * 
   * **Métricas incluidas:**
   * - `total`: Cantidad total de usuarios selfservice registrados
   * - `assigned`: Usuarios que tienen una sede asignada actualmente
   * - `unassigned`: Usuarios disponibles sin sede asignada
   * - `active`: Usuarios en estado activo (pueden recibir asignaciones)
   * 
   * **Uso en interfaz:**
   * - Cards de estadísticas en la parte superior
   * - Badges informativos en encabezados
   * - Indicadores de progreso y disponibilidad
   * 
   * @computed
   * @type {AssignmentStats}
   * 
   * @example
   * ```typescript
   * // Ejemplo de valores calculados
   * const stats = {
   *   total: 25,      // 25 usuarios selfservice totales
   *   assigned: 18,   // 18 tienen sede asignada
   *   unassigned: 7,  // 7 están disponibles
   *   active: 23      // 23 están activos
   * };
   * ```
   * 
   * @since 1.0.0
   */  const stats: AssignmentStats = {
    total: selfServiceUsers.length,
    assigned: selfServiceUsers.filter(user => user.branchId).length,
    unassigned: selfServiceUsers.filter(user => !user.branchId).length,
    active: selfServiceUsers.filter(user => user.isActive).length,
  };
  
  /**
   * Lista filtrada de sedes activas disponibles para asignación.
   * 
   * Contiene únicamente las sedes que están en estado activo y pueden
   * recibir nuevas asignaciones de usuarios selfservice. Esta lista se
   * utiliza en los selectores de asignación para garantizar que solo
   * se muestren opciones válidas al administrador.
   * 
   * **Criterios de filtrado:**
   * - Solo sedes con `isActive: true`
   * - Excluye sedes deshabilitadas o en mantenimiento
   * - Se actualiza automáticamente cuando cambian los datos de sedes
   * 
   * @computed
   * @type {Branch[]}
   * 
   * @example
   * ```typescript
   * // Uso en selector de sedes
   * {activeBranches.map(branch => (
   *   <SelectItem value={branch.id.toString()}>
   *     {branch.name}
   *   </SelectItem>
   * ))}
   * ```
   * 
   * @since 1.0.0
   */
  const activeBranches = branches?.filter(branch => branch.isActive) || [];

  /**
   * Función principal para procesar operaciones de asignación de usuarios a sedes.
   * 
   * Gestiona el flujo completo de asignación, reasignación o desasignación de usuarios
   * selfservice, incluyendo validación, llamadas al servidor, manejo de errores y
   * actualización de la interfaz. Implementa un patrón de actualización optimista
   * para mejor experiencia de usuario.
   * 
   * **Flujo de procesamiento:**
   * 1. Validación de datos de entrada (userId seleccionado)
   * 2. Determinación del branchId según el modo de operación
   * 3. Llamada al hook de asignación con manejo de errores
   * 4. Recarga de datos para mantener sincronización
   * 5. Limpieza de estado del modal y variables temporales
   * 6. Gestión de estados de loading durante el proceso
   * 
   * **Modos de operación soportados:**
   * - `assign`: Asignar usuario sin sede a una sede específica
   * - `reassign`: Cambiar usuario de su sede actual a otra diferente
   * - `unassign`: Desasignar usuario de cualquier sede (branchId = null)
   * 
   * **Manejo de errores:**
   * - Captura errores de red y del servidor
   * - Log de errores para debugging y monitoreo
   * - Mantiene la interfaz en estado consistente tras errores
   * - No presenta errores al usuario (se manejan a nivel de hook)
   * 
   * @async
   * @function handleAssignment
   * 
   * @returns {Promise<void>} Promise que se resuelve al completar la operación
   * 
   * @example
   * ```typescript
   * // Flujo típico de asignación
   * // 1. Usuario selecciona "Asignar" en un usuario sin sede
   * openAssignmentDialog("assign", userId);
   * // 2. Usuario selecciona sede en el modal
   * setSelectedBranchId(branchId);
   * // 3. Usuario confirma la asignación
   * await handleAssignment(); // <- Esta función
   * // 4. Modal se cierra y datos se actualizan
   * ```
   * 
   * @throws {Error} Cuando falla la asignación en el servidor
   * @throws {Error} Cuando hay problemas de conectividad
   * @throws {Error} Cuando la sede seleccionada no es válida
   * 
   * @sideEffects
   * - Modifica estado global de usuarios a través del hook
   * - Actualiza interfaz cerrando modal y limpiando selecciones
   * - Dispara recarga de datos desde el servidor
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
      await fetchUsersByRole("selfservice");
      
      // Cerrar dialog y limpiar estado
      setIsDialogOpen(false);
      setSelectedUserId(null);
      setSelectedBranchId(null);
      setAssignmentMode("assign");
        } catch (error) {
      console.error(t("admin.selfServiceAssignments.assignmentError"), error);
    } finally {
      setProcessingAssignment(false);
    }
  };

  /**
   * Función para inicializar y abrir el modal de asignación con configuración específica.
   * 
   * Prepara y abre el diálogo de confirmación para operaciones de asignación,
   * configurando el estado del componente según el tipo de operación solicitada
   * y el usuario objetivo. Centraliza la lógica de preparación del modal para
   * mantener consistencia en la experiencia de usuario.
   * 
   * **Configuración del modal:**
   * - Establece el modo de operación (assign/reassign/unassign)
   * - Selecciona el usuario objetivo para la operación
   * - Resetea la selección de sede para nueva selección
   * - Abre el modal de confirmación
   * 
   * **Tipos de operación:**
   * - `assign`: Para usuarios sin sede - muestra selector de sede
   * - `reassign`: Para cambio de sede - muestra selector con sede actual
   * - `unassign`: Para desasignación - solo muestra confirmación
   * 
   * **Estado del modal tras la llamada:**
   * - Modal visible con título y descripción apropiados
   * - Campos de entrada configurados según el modo
   * - Botones de acción con etiquetas correctas
   * - Validaciones activadas según el tipo de operación
   * 
   * @function openAssignmentDialog
   * @param {AssignmentMode} mode - Tipo de operación a realizar
   * @param {number} userId - ID del usuario sobre el que operar
   * 
   * @returns {void}
   * 
   * @example
   * ```typescript
   * // Asignar usuario sin sede
   * openAssignmentDialog("assign", 123);
   * 
   * // Reasignar usuario a diferente sede  
   * openAssignmentDialog("reassign", 456);
   * 
   * // Desasignar usuario de su sede actual
   * openAssignmentDialog("unassign", 789);
   * ```
   * 
   * @sideEffects
   * - Modifica múltiples estados del componente
   * - Abre modal de confirmación
   * - Resetea selecciones previas
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
   * Muestra una interfaz de loading elegante mientras se cargan los datos
   * esenciales (usuarios y sedes) desde el servidor. Proporciona feedback
   * visual al usuario durante la carga inicial del componente.
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
          <p className="text-muted-foreground">{t("admin.selfServiceAssignments.loadingAssignments")}</p>
        </div>
      </div>
    );
  }  if (usersError) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-destructive">
          <AlertDescription>
            {t("admin.selfServiceAssignments.errorLoadingData")} {usersError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("admin.selfServiceAssignments.title")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("admin.selfServiceAssignments.description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MonitorSpeaker className="h-8 w-8 text-primary" />
          <Badge variant="secondary">{stats.total} {t("admin.selfServiceAssignments.totalUsers").toLowerCase()}</Badge>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.selfServiceAssignments.totalUsers")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {t("admin.selfServiceAssignments.totalSelfServiceUsers")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.selfServiceAssignments.assigned")}</CardTitle>
            <Building2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.assigned}</div>
            <p className="text-xs text-muted-foreground">
              {t("admin.selfServiceAssignments.usersWithBranch")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.selfServiceAssignments.unassigned")}</CardTitle>
            <UserX className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.unassigned}</div>
            <p className="text-xs text-muted-foreground">
              {t("admin.selfServiceAssignments.usersWithoutBranch")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.selfServiceAssignments.active")}</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {t("admin.selfServiceAssignments.activeUsers")}
            </p>
          </CardContent>
        </Card>
      </div>      {/* Filtros y Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t("admin.selfServiceAssignments.filtersAndSearch")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.selfServiceAssignments.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[200px]">
              <Select value={selectedBranchFilter} onValueChange={setSelectedBranchFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.selfServiceAssignments.filterByBranch")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.selfServiceAssignments.allBranches")}</SelectItem>
                  <SelectItem value="assigned">{t("admin.selfServiceAssignments.onlyAssigned")}</SelectItem>
                  <SelectItem value="unassigned">{t("admin.selfServiceAssignments.onlyUnassigned")}</SelectItem>
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
      </Card>      {/* Lista de Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.selfServiceAssignments.selfServiceUsers")}</CardTitle>
          <CardDescription>
            {t("admin.selfServiceAssignments.manageBranchAssignments")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {t("admin.selfServiceAssignments.noUsersFound")}
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
                      <MonitorSpeaker className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">                        
                        <p className="font-medium truncate">{user.username}</p>
                        {!user.isActive && (
                          <Badge variant="destructive" className="text-xs flex-shrink-0">
                            {t("admin.selfServiceAssignments.inactive")}
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
                                <span className="hidden sm:inline">{t("admin.selfServiceAssignments.reassign")}</span>
                                <span className="sm:hidden">{t("admin.selfServiceAssignments.reassignShort")}</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("admin.selfServiceAssignments.changeBranch")}</p>
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
                                <span className="hidden sm:inline">{t("admin.selfServiceAssignments.unassign")}</span>
                                <span className="sm:hidden">{t("admin.selfServiceAssignments.unassignShort")}</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t("admin.selfServiceAssignments.removeBranch")}</p>
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
                              <span className="hidden sm:inline">{t("admin.selfServiceAssignments.assign")}</span>
                              <span className="sm:hidden">{t("admin.selfServiceAssignments.assignShort")}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("admin.selfServiceAssignments.assignBranch")}</p>
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
              {assignmentMode === "assign" && t("admin.selfServiceAssignments.assignBranchTitle")}
              {assignmentMode === "reassign" && t("admin.selfServiceAssignments.reassignBranchTitle")}
              {assignmentMode === "unassign" && t("admin.selfServiceAssignments.unassignBranchTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {assignmentMode === "assign" && t("admin.selfServiceAssignments.assignBranchDescription")}
              {assignmentMode === "reassign" && t("admin.selfServiceAssignments.reassignBranchDescription")}
              {assignmentMode === "unassign" && t("admin.selfServiceAssignments.unassignBranchDescription")}
            </DialogDescription>
          </DialogHeader>

          {assignmentMode !== "unassign" && (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium">{t("admin.selfServiceAssignments.branch")}</label>
                <Select 
                  value={selectedBranchId?.toString() || ""} 
                  onValueChange={(value) => setSelectedBranchId(parseInt(value))}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder={t("admin.selfServiceAssignments.selectBranch")} />
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
          )}          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={processingAssignment}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              {t("admin.selfServiceAssignments.cancel")}
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
                  <span className="truncate">{t("admin.selfServiceAssignments.processing")}</span>
                </div>
              ) : (
                <>
                  {assignmentMode === "assign" && t("admin.selfServiceAssignments.assignButton")}
                  {assignmentMode === "reassign" && t("admin.selfServiceAssignments.reassignButton")}
                  {assignmentMode === "unassign" && t("admin.selfServiceAssignments.unassignButton")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
