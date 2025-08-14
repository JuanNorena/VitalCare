import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStaffAssignments, type StaffAssignment, type AvailableStaff } from "@/hooks/use-staff-assignments";
import { useBranches } from "@/hooks/use-branches";
import { Users, UserPlus, UserMinus, UserX, Building2, Search, Info, MapPin, Mail, Clock, Filter } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Página de administración para la gestión de asignaciones de personal a sedes.
 * 
 * Este componente proporciona una interfaz completa para que los administradores
 * gestionen las asignaciones de operadores (staff) a diferentes sedes, cumpliendo
 * con las reglas de negocio establecidas.
 * 
 * @component
 * @since 1.0.0
 * 
 * @description
 * Funcionalidades principales:
 * - 📊 Vista general con estadísticas de asignaciones
 * - 👥 Asignación de operadores disponibles a sedes específicas
 * - 🔄 Reasignación de operadores entre sedes
 * - ❌ Desasignación de operadores de sus sedes actuales
 * - 🔍 Búsqueda y filtrado de asignaciones
 * - 📋 Lista detallada de todas las asignaciones activas
 * 
 * @businessRules
 * - Cada operador puede estar asignado a máximo una sede
 * - Cada sede puede tener múltiples operadores asignados
 * - Solo usuarios con rol "staff" pueden ser asignados a sedes
 * - Solo administradores pueden gestionar las asignaciones
 * - Las sedes deben estar activas para recibir asignaciones
 * 
 * @features
 * - ✅ Interfaz completamente internacionalizada (ES/EN)
 * - ✅ Validación en tiempo real de reglas de negocio
 * - ✅ Confirmación de acciones destructivas
 * - ✅ Tooltips informativos para mejor UX
 * - ✅ Estados de carga y feedback visual
 * - ✅ Responsive design para móviles y desktop
 * 
 * @dependencies
 * - `useStaffAssignments` - Hook personalizado para operaciones CRUD
 * - `useBranches` - Hook para obtener lista de sedes activas
 * - `react-i18n` - Internacionalización
 * - `shadcn/ui` - Componentes de interfaz
 * 
 * @example
 * ```tsx
 * // Uso básico en rutas de administrador
 * import StaffAssignments from '@/pages/admin/staff-assignments';
 * 
 * function AdminRoutes() {
 *   return (
 *     <Route path="/admin/staff-assignments" component={StaffAssignments} />
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Integración en dashboard administrativo
 * <div className="admin-panel">
 *   <StaffAssignments />
 * </div>
 * ```
 */
export default function StaffAssignments() {
  /** Hook para manejo de traducciones internacionales */
  const { t } = useTranslation();
  
  // === ESTADO LOCAL DEL COMPONENTE ===
  
  /** 
   * Término de búsqueda para filtrar operadores por nombre, email o sede
   * @state
   * @type {string}
   */
  const [searchTerm, setSearchTerm] = useState("");
  
  /** 
   * Filtro seleccionado para mostrar asignaciones por sede
   * @state
   * @type {string}
   * @values "all" | "unassigned" | "{branchId}"
   */
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("all");
  
  /** 
   * Operador seleccionado para asignación
   * @state
   * @type {AvailableStaff | null}
   */
  const [selectedOperator, setSelectedOperator] = useState<AvailableStaff | null>(null);
  
  /** 
   * ID de la sede seleccionada para asignación
   * @state
   * @type {number | null}
   */
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  
  /** 
   * Asignación seleccionada para desasignar o reasignar
   * @state
   * @type {StaffAssignment | null}
   */
  const [selectedAssignment, setSelectedAssignment] = useState<StaffAssignment | null>(null);
  
  /** 
   * ID de la nueva sede para reasignación
   * @state
   * @type {number | null}
   */
  const [newBranchForReassignment, setNewBranchForReassignment] = useState<number | null>(null);
  
  // === ESTADO DE DIÁLOGOS ===
  
  /** 
   * Controla la visibilidad del diálogo de asignación
   * @state
   * @type {boolean}
   */
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  
  /** 
   * Controla la visibilidad del diálogo de desasignación
   * @state
   * @type {boolean}
   */
  const [showUnassignDialog, setShowUnassignDialog] = useState(false);
  
  /** 
   * Controla la visibilidad del diálogo de reasignación
   * @state
   * @type {boolean}
   */
  const [showReassignDialog, setShowReassignDialog] = useState(false);

  // === HOOKS PERSONALIZADOS ===
  
  /**
   * Hook para gestión de asignaciones de personal
   * Proporciona datos y mutaciones para CRUD de asignaciones
   */
  const {
    staffAssignments,
    availableStaff,
    isLoading,
    assignStaff,
    unassignStaff,
    reassignStaff,
  } = useStaffAssignments();

  /**
   * Hook para obtener lista de sedes activas
   * Utilizado para seleccionar sedes en asignaciones
   */
  const { branches } = useBranches();
  // === VARIABLES COMPUTADAS Y FILTROS ===
  
  /**
   * Lista filtrada de asignaciones basada en término de búsqueda y sede seleccionada
   * @computed
   * @returns {StaffAssignment[]} Array de asignaciones que coinciden con los filtros
   * 
   * @description
   * Aplica dos tipos de filtros:
   * 1. **Búsqueda textual**: Busca en nombre de usuario, email y nombre de sede
   * 2. **Filtro por sede**: Muestra todas, sin asignar, o de una sede específica
   */
  const filteredAssignments = staffAssignments?.filter((assignment) => {
    // Filtro de búsqueda textual (case-insensitive)
    const matchesSearch = assignment.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (assignment.branchName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    // Filtro por sede
    const matchesBranch = selectedBranchFilter === "all" || 
                         (selectedBranchFilter === "unassigned" && !assignment.branchId) ||
                         assignment.branchId?.toString() === selectedBranchFilter;
    
    return matchesSearch && matchesBranch;
  }) || [];

  // === ESTADÍSTICAS CALCULADAS ===
  
  /** 
   * Número total de operadores en el sistema
   * @computed
   * @type {number}
   */
  const totalStaff = staffAssignments?.length || 0;
  
  /** 
   * Número de operadores actualmente asignados a alguna sede
   * @computed
   * @type {number}
   */
  const assignedStaff = staffAssignments?.filter(a => a.branchId)?.length || 0;
  
  /** 
   * Número de operadores disponibles para asignación (sin sede)
   * @computed
   * @type {number}
   */
  const availableStaffCount = availableStaff?.length || 0;
  // === MANEJADORES DE EVENTOS ===

  /**
   * Maneja la asignación de un operador a una sede
   * 
   * @function
   * @description
   * Ejecuta la asignación si tanto el operador como la sede están seleccionados.
   * Al completarse exitosamente, limpia el estado y cierra el diálogo.
   * 
   * @sideEffects
   * - Ejecuta mutación `assignStaff`
   * - Cierra el diálogo de asignación
   * - Limpia las selecciones actuales
   * 
   * @validation
   * - Requiere `selectedOperator` no nulo
   * - Requiere `selectedBranch` no nulo
   */
  const handleAssignStaff = () => {
    if (selectedOperator && selectedBranch) {
      assignStaff.mutate(
        { userId: selectedOperator.id, branchId: selectedBranch },
        {
          onSuccess: () => {
            setShowAssignDialog(false);
            setSelectedOperator(null);
            setSelectedBranch(null);
          }
        }
      );
    }
  };

  /**
   * Maneja la desasignación de un operador de su sede actual
   * 
   * @function
   * @description
   * Ejecuta la desasignación del operador seleccionado.
   * Al completarse exitosamente, limpia el estado y cierra el diálogo.
   * 
   * @sideEffects
   * - Ejecuta mutación `unassignStaff`
   * - Cierra el diálogo de desasignación
   * - Limpia la asignación seleccionada
   * 
   * @validation
   * - Requiere `selectedAssignment` no nulo
   */
  const handleUnassignStaff = () => {
    if (selectedAssignment) {
      unassignStaff.mutate(selectedAssignment.id, {
        onSuccess: () => {
          setShowUnassignDialog(false);
          setSelectedAssignment(null);
        }
      });
    }
  };

  /**
   * Maneja la reasignación de un operador a una nueva sede
   * 
   * @function
   * @description
   * Ejecuta la reasignación del operador a la nueva sede seleccionada.
   * Al completarse exitosamente, limpia el estado y cierra el diálogo.
   * 
   * @sideEffects
   * - Ejecuta mutación `reassignStaff`
   * - Cierra el diálogo de reasignación
   * - Limpia las selecciones actuales
   * 
   * @validation
   * - Requiere `selectedAssignment` no nulo
   * - Requiere `newBranchForReassignment` no nulo
   */
  const handleReassignStaff = () => {
    if (selectedAssignment && newBranchForReassignment) {
      reassignStaff.mutate(
        { userId: selectedAssignment.id, data: { branchId: newBranchForReassignment } },
        {
          onSuccess: () => {
            setShowReassignDialog(false);
            setSelectedAssignment(null);
            setNewBranchForReassignment(null);
          }
        }
      );
    }
  };
  
  /**
   * Obtiene el nombre de una sede por su ID
   * 
   * @function
   * @param {number | null} branchId - ID de la sede a buscar
   * @returns {string | null} Nombre de la sede o texto de "sede desconocida"
   * 
   * @description
   * Función auxiliar para mostrar nombres de sedes en la interfaz.
   * Si no encuentra la sede, muestra un texto internacionalizado de error.
   * 
   * @example
   * ```tsx
   * const branchName = getBranchName(5); // "Sede Centro"
   * const unknown = getBranchName(999); // "Sede desconocida"
   * const empty = getBranchName(null); // null
   * ```
   */
  const getBranchName = (branchId: number | null) => {
    if (!branchId) return null;
    return branches?.find(b => b.id === branchId)?.name || t("admin.staffAssignments.unknownBranch");
  };  // === RENDERIZADO CONDICIONAL ===
  
  /**
   * Estado de carga - Muestra spinner mientras se cargan los datos
   * @returns {JSX.Element} Componente de carga centrado
   */
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-32">
          <div className="text-muted-foreground">{t("common.loading")}</div>
        </div>
      </div>
    );
  }

  // === RENDERIZADO PRINCIPAL ===
  
  /**
   * Interfaz principal de gestión de asignaciones de personal
   * 
   * @structure
   * 1. **Header con estadísticas**: Título, descripción y cards de métricas
   * 2. **Reglas de asignación**: Alert informativo con reglas de negocio  
   * 3. **Controles**: Barra de búsqueda, filtros y botón de asignación
   * 4. **Lista de asignaciones**: Tabla con todas las asignaciones actuales
   * 5. **Diálogos modales**: Confirmación para asignar, desasignar y reasignar
   * 
   * @accessibility
   * - Tooltips descriptivos en botones de acción
   * - Labels semánticos en formularios
   * - Contraste adecuado en estados visuales
   * - Navegación por teclado en diálogos
   */
  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-full overflow-hidden">
        {/* 
          === SECCIÓN: HEADER Y ESTADÍSTICAS ===
          
          Muestra el título principal, descripción y tarjetas con métricas:
          - Total de operadores en el sistema
          - Operadores asignados a sedes  
          - Operadores disponibles para asignación
        */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">{t("admin.staffAssignments.title")}</h1>
              <p className="text-muted-foreground text-sm sm:text-base">{t("admin.staffAssignments.description")}</p>
            </div>
          </div>

          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            <Card className="min-w-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium truncate flex-1 mr-2">{t("admin.staffAssignments.totalStaff")}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStaff}</div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {t("admin.staffAssignments.registeredOperators")}
                </p>
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium truncate flex-1 mr-2">{t("admin.staffAssignments.assignedCount")}</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{assignedStaff}</div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {t("admin.staffAssignments.operatorsWithBranch")}
                </p>
              </CardContent>
            </Card>
            <Card className="sm:col-span-2 lg:col-span-1 min-w-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium truncate flex-1 mr-2">{t("admin.staffAssignments.availableCount")}</CardTitle>
                <UserX className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{availableStaffCount}</div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {t("admin.staffAssignments.readyToAssign")}
                </p>
              </CardContent>
            </Card>
          </div>        
          </div>

        {/* 
          === SECCIÓN: REGLAS DE ASIGNACIÓN ===
          
          Alert informativo que explica las reglas de negocio para asignaciones:
          - Un operador máximo en una sede
          - Una sede puede tener múltiples operadores
          - Solo operadores pueden ser asignados
          - Solo admins pueden gestionar asignaciones
        */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>{t("admin.staffAssignments.assignmentRules")}</strong>
            <div className="mt-2 whitespace-pre-line text-sm">
              {t("admin.staffAssignments.rulesDescription")}
            </div>
          </AlertDescription>
        </Alert>

        {/* 
          === SECCIÓN: CONTROLES Y FILTROS ===
          
          Barra de herramientas con:
          - Campo de búsqueda (nombre, email, sede)
          - Filtro por sede (todas, sin asignar, sede específica)
          - Botón para abrir diálogo de nueva asignación
        */}
        <div className="space-y-4">
          {/* Fila 1: Búsqueda y Filtro */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("admin.staffAssignments.searchStaff")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">
                <Filter className="h-4 w-4" />
                <span>{t("admin.staffAssignments.filterByBranch")}</span>
              </div>
              <Select value={selectedBranchFilter} onValueChange={setSelectedBranchFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("admin.staffAssignments.filterByBranch")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.staffAssignments.allBranches")}</SelectItem>
                  <SelectItem value="unassigned">{t("admin.staffAssignments.notAssigned")}</SelectItem>
                  {branches?.filter(b => b.isActive).map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fila 2: Botón de Asignación */}
          <div className="w-full">
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                  <UserPlus className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{t("admin.staffAssignments.assignStaff")}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg">{t("admin.staffAssignments.assignStaff")}</DialogTitle>
                  <DialogDescription className="text-sm">
                    {t("admin.staffAssignments.confirmAssignment")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("admin.staffAssignments.selectOperator")}</label>
                    <Select 
                      value={selectedOperator?.id.toString() || ""} 
                      onValueChange={(value) => {
                        const operator = availableStaff?.find(s => s.id.toString() === value);
                        setSelectedOperator(operator || null);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("admin.staffAssignments.selectOperator")} />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {availableStaff?.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id.toString()}>
                            <div className="flex items-center gap-2 min-w-0">
                              <Users className="h-4 w-4 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate">{staff.username}</div>
                                <div className="text-xs text-muted-foreground truncate">{staff.email}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("admin.staffAssignments.selectBranch")}</label>
                    <Select 
                      value={selectedBranch?.toString() || ""} 
                      onValueChange={(value) => setSelectedBranch(parseInt(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("admin.staffAssignments.selectBranch")} />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {branches?.filter(b => b.isActive).map((branch) => (
                          <SelectItem key={branch.id} value={branch.id.toString()}>
                            <div className="flex items-center gap-2 min-w-0">
                              <Building2 className="h-4 w-4 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate">{branch.name}</div>
                                <div className="text-xs text-muted-foreground truncate">{branch.address}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setShowAssignDialog(false)} className="w-full sm:w-auto">
                    {t("common.cancel")}
                  </Button>
                  <Button 
                    onClick={handleAssignStaff}
                    disabled={!selectedOperator || !selectedBranch || assignStaff.isPending}
                    className="w-full sm:w-auto"
                  >
                    {assignStaff.isPending ? t("common.loading") : t("admin.staffAssignments.confirmAssignment")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 
          === SECCIÓN: LISTA DE ASIGNACIONES ===
          
          Tabla principal que muestra todas las asignaciones filtradas:
          - Información del operador (nombre, email, rol, fecha creación)
          - Estado de asignación (sede asignada o disponible)
          - Acciones disponibles (reasignar, desasignar)
          - Mensaje de estado vacío cuando no hay resultados
        */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("admin.staffAssignments.assignedStaff")}
            </CardTitle>
            <CardDescription>
              {t("common.showingResults", { 
                count: filteredAssignments.length, 
                total: totalStaff 
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-8">
                <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {availableStaffCount > 0 
                    ? t("admin.staffAssignments.noAssignedStaff")
                    : t("admin.staffAssignments.noAvailableStaff")
                  }
                </p>
                {availableStaffCount === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {t("admin.staffAssignments.createStaffUser")}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAssignments.map((assignment) => (
                  <div key={assignment.id} className="border rounded-lg p-4 space-y-4 sm:space-y-0">
                    {/* Diseño móvil: vertical stack */}
                    <div className="sm:hidden space-y-3">
                      {/* Header con usuario */}
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">{assignment.username}</span>
                            <Badge variant="secondary" className="text-xs">{t(`admin.users.roles.${assignment.role}`)}</Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{assignment.email}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              <span>{new Date(assignment.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Estado de asignación */}
                      <div className="pl-11">
                        {assignment.branchId ? (
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-green-600 block truncate">{assignment.branchName}</span>
                              <span className="text-sm text-muted-foreground">{t("admin.staffAssignments.assignedTo")}</span>
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="mb-2">{t("admin.staffAssignments.notAssigned")}</Badge>
                        )}
                        
                        {/* Botones de acción móvil */}
                        <div className="flex gap-2">
                          {assignment.branchId ? (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedAssignment(assignment);
                                      setShowReassignDialog(true);
                                    }}
                                    className="flex-1"
                                  >
                                    <UserMinus className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t("admin.staffAssignments.reassignStaffTooltip")}</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedAssignment(assignment);
                                      setShowUnassignDialog(true);
                                    }}
                                    className="flex-1"
                                  >
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t("admin.staffAssignments.unassignStaffTooltip")}</p>
                                </TooltipContent>
                              </Tooltip>
                            </>
                          ) : (
                            <Badge variant="secondary" className="text-blue-600 justify-center w-full">
                              {t("admin.staffAssignments.availableStaff")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Diseño desktop: horizontal layout */}
                    <div className="hidden sm:flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{assignment.username}</span>
                            <Badge variant="secondary">{t(`admin.users.roles.${assignment.role}`)}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1 min-w-0">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{assignment.email}</span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(assignment.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        {assignment.branchId ? (
                          <div className="text-right min-w-0">
                            <div className="flex items-center gap-2 justify-end">
                              <Building2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span className="font-medium text-green-600 truncate max-w-32">{assignment.branchName}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {t("admin.staffAssignments.assignedTo")}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline">{t("admin.staffAssignments.notAssigned")}</Badge>
                        )}

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {assignment.branchId ? (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedAssignment(assignment);
                                      setShowReassignDialog(true);
                                    }}
                                  >
                                    <UserMinus className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t("admin.staffAssignments.reassignStaffTooltip")}</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedAssignment(assignment);
                                      setShowUnassignDialog(true);
                                    }}
                                  >
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t("admin.staffAssignments.unassignStaffTooltip")}</p>
                                </TooltipContent>
                              </Tooltip>
                            </>
                          ) : (
                            <Badge variant="secondary" className="text-blue-600">
                              {t("admin.staffAssignments.availableStaff")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>        
          </Card>

        {/* 
          === SECCIÓN: DIÁLOGOS MODALES ===
          
          Tres diálogos de confirmación para las acciones principales:
          1. **Asignación**: Seleccionar operador y sede para nueva asignación
          2. **Desasignación**: Confirmar remoción de operador de su sede actual  
          3. **Reasignación**: Seleccionar nueva sede para operador ya asignado
          
          Todos incluyen validación, estados de carga y confirmación explícita.
        */}
        
        {/* Diálogo de Desasignación */}
        <Dialog open={showUnassignDialog} onOpenChange={setShowUnassignDialog}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">{t("admin.staffAssignments.confirmUnassignment")}</DialogTitle>
              <DialogDescription asChild>
                <div>
                  {selectedAssignment && (
                    <div className="space-y-2 mt-2">
                      <div className="bg-muted p-3 rounded-md">
                        <div className="font-medium text-sm">{selectedAssignment.username}</div>
                        <div className="text-xs text-muted-foreground">{selectedAssignment.email}</div>
                        {selectedAssignment.branchName && (
                          <div className="flex items-center gap-1 mt-1">
                            <Building2 className="h-3 w-3" />
                            <span className="text-xs">{selectedAssignment.branchName}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm">
                        {t("admin.staffAssignments.unassignOperatorFromBranch", {
                          operator: selectedAssignment.username,
                          branch: selectedAssignment.branchName
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowUnassignDialog(false)} className="w-full sm:w-auto">
                {t("common.cancel")}
              </Button>
              <Button 
                variant="destructive"
                onClick={handleUnassignStaff}
                disabled={unassignStaff.isPending}
                className="w-full sm:w-auto"
              >
                {unassignStaff.isPending ? t("common.loading") : t("admin.staffAssignments.confirmUnassignment")}
              </Button>
            </DialogFooter>
          </DialogContent>        
          </Dialog>

        {/* Diálogo de Reasignación */}
        <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">{t("admin.staffAssignments.confirmReassignment")}</DialogTitle>
              <DialogDescription asChild>
                <div>
                  {selectedAssignment && (
                    <div className="space-y-2 mt-2">
                      <div className="bg-muted p-3 rounded-md">
                        <div className="font-medium text-sm">{selectedAssignment.username}</div>
                        <div className="text-xs text-muted-foreground">{selectedAssignment.email}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs">{t("admin.staffAssignments.currentBranch")}: {selectedAssignment.branchName}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("admin.staffAssignments.newAssignment")}</label>
                <Select 
                  value={newBranchForReassignment?.toString() || ""} 
                  onValueChange={(value) => setNewBranchForReassignment(parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("admin.staffAssignments.selectBranch")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {branches?.filter(b => b.isActive && b.id !== selectedAssignment?.branchId).map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className="h-4 w-4 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{branch.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{branch.address}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newBranchForReassignment && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="text-sm">
                    <strong>{t("admin.staffAssignments.reassignmentPreview")}:</strong>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {selectedAssignment?.username} → {getBranchName(newBranchForReassignment)}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowReassignDialog(false)} className="w-full sm:w-auto">
                {t("common.cancel")}
              </Button>
              <Button 
                onClick={handleReassignStaff}
                disabled={!newBranchForReassignment || reassignStaff.isPending}
                className="w-full sm:w-auto"
              >
                {reassignStaff.isPending ? t("common.loading") : t("admin.staffAssignments.confirmReassignment")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

/**
 * @note MEJORAS RESPONSIVAS IMPLEMENTADAS:
 * 
 * 1. **Layout Adaptivo**:
 *    - Controles se apilan verticalmente en móviles
 *    - Búsqueda y filtros ocupan el ancho completo en pantallas pequeñas
 *    - Botones se expanden para mejor usabilidad táctil
 * 
 * 2. **Lista de Asignaciones**:
 *    - Diseño vertical para móviles con información clara
 *    - Diseño horizontal para desktop manteniendo eficiencia
 *    - Botones de acción más grandes y descriptivos en móviles
 *    - Truncado inteligente de texto largo
 * 
 * 3. **Diálogos Modales**:
 *    - Máxima altura con scroll para contenido largo
 *    - Ancho responsivo adaptado a pantalla
 *    - SelectContent con altura máxima para listas largas
 *    - Botones de footer se apilan en móviles
 * 
 * 4. **Estadísticas**:
 *    - Grid adaptivo: 1 columna (móvil) → 2 columnas (tablet) → 3 columnas (desktop)
 *    - Texto descriptivo adicional para contexto
 *    - Iconos con flex-shrink-0 para evitar deformación
 * 
 * 5. **Elementos Interactivos**:
 *    - Tooltips informativos en botones
 *    - Estados de carga claros
 *    - Áreas de toque optimizadas para móviles
 */
