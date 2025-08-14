import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

// === INTERFACES Y TIPOS ===

/**
 * Representa una asignación de personal existente en el sistema
 * 
 * @interface StaffAssignment
 * @description
 * Define la estructura completa de un operador y su asignación actual,
 * incluyendo información del usuario y la sede asociada (si existe).
 * 
 * @example
 * ```typescript
 * const assignment: StaffAssignment = {
 *   id: 1,
 *   username: "juan.perez",
 *   email: "juan@empresa.com",
 *   role: "staff",
 *   branchId: 3,
 *   branchName: "Sede Centro",
 *   isActive: true,
 *   createdAt: "2024-01-15T10:30:00Z"
 * };
 * ```
 */
export interface StaffAssignment {
  /** ID único del usuario operador */
  id: number;
  /** Nombre de usuario único en el sistema */
  username: string;
  /** Dirección de correo electrónico del operador */
  email: string;
  /** Rol del usuario (típicamente "staff" para operadores) */
  role: string;
  /** ID de la sede asignada (null si no está asignado) */
  branchId: number | null;
  /** Nombre de la sede asignada (null si no está asignado) */
  branchName: string | null;
  /** Estado activo del usuario en el sistema */
  isActive: boolean;
  /** Fecha y hora de creación del usuario en formato ISO */
  createdAt: string;
}

/**
 * Representa un operador disponible para asignación
 * 
 * @interface AvailableStaff
 * @description
 * Define la estructura de un operador que no está asignado a ninguna sede
 * y está disponible para ser asignado.
 * 
 * @example
 * ```typescript
 * const availableOperator: AvailableStaff = {
 *   id: 5,
 *   username: "maria.lopez",
 *   email: "maria@empresa.com",
 *   role: "staff",
 *   isActive: true,
 *   createdAt: "2024-02-10T14:20:00Z"
 * };
 * ```
 */
export interface AvailableStaff {
  /** ID único del usuario operador */
  id: number;
  /** Nombre de usuario único en el sistema */
  username: string;
  /** Dirección de correo electrónico del operador */
  email: string;
  /** Rol del usuario (debe ser "staff" para ser asignable) */
  role: string;
  /** Estado activo del usuario en el sistema */
  isActive: boolean;
  /** Fecha y hora de creación del usuario en formato ISO */
  createdAt: string;
}

/**
 * Datos requeridos para asignar un operador a una sede
 * 
 * @interface AssignStaffData
 * @description
 * Estructura de datos necesaria para crear una nueva asignación
 * entre un operador y una sede específica.
 * 
 * @example
 * ```typescript
 * const assignmentData: AssignStaffData = {
 *   userId: 7,
 *   branchId: 2
 * };
 * ```
 */
export interface AssignStaffData {
  /** ID del usuario operador a asignar */
  userId: number;
  /** ID de la sede destino */
  branchId: number;
}

/**
 * Datos requeridos para reasignar un operador a una nueva sede
 * 
 * @interface ReassignStaffData
 * @description
 * Estructura de datos para cambiar la asignación de un operador
 * que ya está asignado a una sede diferente.
 * 
 * @example
 * ```typescript
 * const reassignmentData: ReassignStaffData = {
 *   branchId: 4
 * };
 * ```
 */
export interface ReassignStaffData {
  /** ID de la nueva sede destino */
  branchId: number;
}

/**
 * Hook personalizado para la gestión completa de asignaciones de personal
 * 
 * @hook useStaffAssignments
 * @since 1.0.0
 * 
 * @description
 * Hook de React Query que encapsula toda la lógica de negocio para administrar
 * las asignaciones de operadores (staff) a sedes del sistema. Proporciona
 * operaciones CRUD completas con manejo automático de estado, cache y notificaciones.
 * 
 * @features
 * - 📊 **Consultas reactivas**: Datos sincronizados automáticamente con el servidor
 * - 🔄 **Cache inteligente**: Optimización de rendimiento con React Query
 * - 🔔 **Notificaciones**: Feedback automático de éxito y error
 * - 🌐 **Internacionalización**: Mensajes traducidos en múltiples idiomas
 * - ⚡ **Estados de carga**: Control granular de estados asíncronos
 * - 🛡️ **Validación**: Manejo robusto de errores de API
 * 
 * @businessRules
 * **Reglas de asignación:**
 * - Un operador puede estar asignado a máximo una sede
 * - Una sede puede tener múltiples operadores asignados
 * - Solo usuarios con rol "staff" pueden ser asignados
 * - Solo administradores pueden gestionar asignaciones
 * - Las sedes deben estar activas para recibir asignaciones
 * 
 * @apiEndpoints
 * - `GET /api/staff-assignments` - Obtener todas las asignaciones
 * - `GET /api/staff-assignments/available` - Obtener operadores disponibles
 * - `GET /api/branches/:id/staff` - Obtener personal de una sede
 * - `POST /api/staff-assignments` - Crear nueva asignación
 * - `PUT /api/staff-assignments/:id` - Reasignar operador
 * - `DELETE /api/staff-assignments/:id` - Desasignar operador
 * 
 * @returns {Object} Objeto con datos y operaciones de asignaciones
 * @returns {StaffAssignment[] | undefined} staffAssignments - Lista de todas las asignaciones
 * @returns {AvailableStaff[] | undefined} availableStaff - Operadores disponibles para asignación
 * @returns {boolean} isLoading - Estado de carga de consultas principales
 * @returns {UseMutationResult} assignStaff - Mutación para asignar operador
 * @returns {UseMutationResult} unassignStaff - Mutación para desasignar operador
 * @returns {UseMutationResult} reassignStaff - Mutación para reasignar operador
 * @returns {Function} getBranchStaff - Función para obtener personal de una sede
 * 
 * @example
 * ```tsx
 * // Uso básico en componente de administración
 * function StaffAssignmentManager() {
 *   const {
 *     staffAssignments,
 *     availableStaff,
 *     assignStaff,
 *     unassignStaff,
 *     reassignStaff,
 *     isLoading
 *   } = useStaffAssignments();
 * 
 *   // Asignar operador a sede
 *   const handleAssignStaff = async (userId: number, branchId: number) => {
 *     try {
 *       await assignStaff.mutateAsync({ userId, branchId });
 *       console.log('Asignación exitosa');
 *     } catch (error) {
 *       console.error('Error en asignación:', error);
 *     }
 *   };
 * 
 *   // Mostrar operadores disponibles
 *   return (
 *     <div>
 *       <h2>Operadores Disponibles</h2>
 *       {isLoading ? (
 *         <div>Cargando...</div>
 *       ) : (
 *         availableStaff?.map(staff => (
 *           <StaffCard
 *             key={staff.id}
 *             staff={staff}
 *             onAssign={(branchId) => handleAssignStaff(staff.id, branchId)}
 *           />
 *         ))
 *       )}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Uso avanzado con personal de sede específica
 * function BranchStaffManager({ branchId }: { branchId: number }) {
 *   const { getBranchStaff, reassignStaff } = useStaffAssignments();
 *   const { data: branchStaff, isLoading } = getBranchStaff(branchId);
 * 
 *   const handleReassign = (userId: number, newBranchId: number) => {
 *     reassignStaff.mutate({
 *       userId,
 *       data: { branchId: newBranchId }
 *     });
 *   };
 * 
 *   return (
 *     <div>
 *       <h2>Personal de la Sede</h2>
 *       {branchStaff?.map(staff => (
 *         <StaffItem
 *           key={staff.id}
 *           staff={staff}
 *           onReassign={(newBranchId) => handleReassign(staff.id, newBranchId)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @dependencies
 * - `@tanstack/react-query` - Gestión de estado del servidor
 * - `react-i18next` - Internacionalización
 * - `use-toast` - Sistema de notificaciones
 * 
 * @seeAlso
 * - {@link StaffAssignment} - Tipo de datos de asignación
 * - {@link AvailableStaff} - Tipo de datos de operador disponible
 * - {@link AssignStaffData} - Datos para nueva asignación
 * - {@link ReassignStaffData} - Datos para reasignación
 */
export function useStaffAssignments() {
  // === DEPENDENCIAS Y HOOKS BASE ===
  
  /** 
   * Cliente de React Query para invalidación de cache y optimizaciones
   * @internal
   */
  const queryClient = useQueryClient();
  
  /** 
   * Hook para mostrar notificaciones toast al usuario
   * @internal
   */
  const { toast } = useToast();
  
  /** 
   * Hook para manejo de traducciones internacionales
   * @internal
   */
  const { t } = useTranslation();

  // === CONSULTAS (QUERIES) ===

  /**
   * Consulta para obtener todas las asignaciones de personal
   * 
   * @query
   * @returns {StaffAssignment[]} Lista completa de asignaciones existentes
   * @description
   * Obtiene del servidor todas las asignaciones actuales, incluyendo tanto
   * operadores asignados como no asignados, con información de sus sedes.
   * 
   * @caching
   * - **Clave**: `["/api/staff-assignments"]`
   * - **Stale time**: Por defecto de React Query
   * - **Refetch**: En focus, reconexión y mount
   * 
   * @errorHandling
   * Lanza error si la respuesta HTTP no es exitosa (status >= 400)
   */
  const { data: staffAssignments, isLoading } = useQuery<StaffAssignment[]>({
    queryKey: ["/api/staff-assignments"],
    queryFn: async () => {
      const response = await fetch('/api/staff-assignments', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch staff assignments');
      }
      return response.json();
    }
  });

  /**
   * Consulta para obtener operadores disponibles (sin asignar)
   * 
   * @query
   * @returns {AvailableStaff[]} Lista de operadores disponibles para asignación
   * @description
   * Obtiene del servidor únicamente los operadores que no están
   * asignados a ninguna sede y están disponibles para asignación.
   * 
   * @caching
   * - **Clave**: `["/api/staff-assignments/available"]`
   * - **Dependencias**: Se invalida cuando cambian las asignaciones
   * - **Uso**: Para poblar selectores de asignación
   */
  const { data: availableStaff, isLoading: isLoadingAvailable } = useQuery<AvailableStaff[]>({
    queryKey: ["/api/staff-assignments/available"],
    queryFn: async () => {
      const response = await fetch('/api/staff-assignments/available', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch available staff');
      }
      return response.json();
    }
  });
  /**
   * Función para obtener el personal asignado a una sede específica
   * 
   * @function getBranchStaff
   * @param {number} branchId - ID de la sede de la cual obtener el personal
   * @returns {UseQueryResult<AvailableStaff[]>} Hook de consulta con el personal de la sede
   * 
   * @description
   * Retorna un hook de React Query configurado para obtener únicamente
   * los operadores asignados a una sede específica. Útil para vistas
   * detalladas de sedes o gestión de personal por ubicación.
   * 
   * @features
   * - **Consulta condicional**: Solo se ejecuta si branchId es válido
   * - **Cache independiente**: Cada sede tiene su propia clave de cache
   * - **Optimización**: Permite cargar personal de múltiples sedes sin conflictos
   * 
   * @caching
   * - **Clave**: `["/api/branches/{branchId}/staff"]`
   * - **Habilitado**: Solo cuando `branchId` es truthy
   * - **Invalidación**: Manual o por cambios en asignaciones generales
   * 
   * @example
   * ```tsx
   * function BranchDetailView({ branchId }: { branchId: number }) {
   *   const { getBranchStaff } = useStaffAssignments();
   *   const { data: staff, isLoading, error } = getBranchStaff(branchId);
   * 
   *   if (isLoading) return <div>Cargando personal...</div>;
   *   if (error) return <div>Error al cargar personal</div>;
   * 
   *   return (
   *     <div>
   *       <h3>Personal de la sede</h3>
   *       {staff?.map(member => (
   *         <StaffMember key={member.id} staff={member} />
   *       ))}
   *     </div>
   *   );
   * }
   * ```
   * 
   * @example
   * ```tsx
   * // Uso en componente con múltiples sedes
   * function MultipleSedesView({ branchIds }: { branchIds: number[] }) {
   *   const { getBranchStaff } = useStaffAssignments();
   * 
   *   return (
   *     <div>
   *       {branchIds.map(branchId => {
   *         const { data: staff } = getBranchStaff(branchId);
   *         return (
   *           <BranchSection key={branchId} branchId={branchId} staff={staff} />
   *         );
   *       })}
   *     </div>
   *   );
   * }
   * ```
   * 
   * @errorHandling
   * - Retorna error si la sede no existe
   * - Retorna array vacío si la sede no tiene personal
   * - Maneja errores de red automáticamente
   * 
   * @performance
   * La consulta se deshabilita automáticamente si branchId es falsy,
   * evitando llamadas innecesarias a la API.
   */
  const getBranchStaff = (branchId: number) => {
    return useQuery<AvailableStaff[]>({
      queryKey: [`/api/branches/${branchId}/staff`],
      queryFn: async () => {
        const response = await fetch(`/api/branches/${branchId}/staff`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch branch staff');
        }
        return response.json();
      },
      enabled: !!branchId
    });
  };
  // === MUTACIONES (MUTATIONS) ===

  /**
   * Mutación para asignar un operador a una sede
   * 
   * @mutation assignStaff
   * @param {AssignStaffData} data - Datos de la asignación (userId, branchId)
   * @returns {Promise<any>} Promesa con la respuesta de la API
   * 
   * @description
   * Ejecuta la asignación de un operador disponible a una sede específica.
   * Valida que tanto el operador como la sede existan y cumplan las reglas
   * de negocio antes de realizar la asignación.
   * 
   * @businessLogic
   * - Verifica que el operador no esté ya asignado
   * - Valida que la sede esté activa
   * - Confirma permisos de administrador
   * - Actualiza la base de datos con la nueva asignación
   * 
   * @sideEffects
   * **En éxito:**
   * - Invalida cache de `staffAssignments`
   * - Invalida cache de `availableStaff`
   * - Muestra notificación de éxito
   * - Actualiza automáticamente la UI
   * 
   * **En error:**
   * - Muestra notificación de error con mensaje descriptivo
   * - No modifica el estado local
   * - Permite reintento manual
   * 
   * @apiCall
   * - **Método**: POST
   * - **Endpoint**: `/api/staff-assignments`
   * - **Headers**: `Content-Type: application/json`
   * - **Credenciales**: Incluidas para autenticación
   * 
   * @validation
   * - Requiere `userId` válido (operador existente)
   * - Requiere `branchId` válido (sede activa)
   * - Validación de duplicados en el servidor
   * 
   * @example
   * ```tsx
   * function AssignmentForm() {
   *   const { assignStaff } = useStaffAssignments();
   * 
   *   const handleSubmit = async (userId: number, branchId: number) => {
   *     try {
   *       await assignStaff.mutateAsync({ userId, branchId });
   *       // Éxito - notificación automática
   *       onAssignmentComplete();
   *     } catch (error) {
   *       // Error - notificación automática  
   *       console.error('Error en asignación:', error);
   *     }
   *   };
   * 
   *   return (
   *     <form onSubmit={handleSubmit}>
   *       <button 
   *         disabled={assignStaff.isPending}
   *         type="submit"
   *       >
   *         {assignStaff.isPending ? 'Asignando...' : 'Asignar Personal'}
   *       </button>
   *     </form>
   *   );
   * }
   * ```
   * 
   * @errorCodes
   * - **400**: Datos inválidos o faltantes
   * - **401**: No autorizado (no es administrador)
   * - **404**: Operador o sede no encontrados
   * - **409**: Operador ya asignado a otra sede
   * - **500**: Error interno del servidor
   */
  const assignStaff = useMutation({
    mutationFn: async (data: AssignStaffData) => {
      const response = await fetch("/api/staff-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");
      const responseText = await response.text();

      if (!response.ok) {
        const errorMessage = isJson ? JSON.parse(responseText).message : responseText;
        throw new Error(errorMessage);
      }

      if (!isJson) {
        throw new Error("Invalid server response format");
      }

      return JSON.parse(responseText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff-assignments/available"] });
      toast({
        title: t("admin.staffAssignments.staffAssigned"),
        description: t("admin.staffAssignments.staffAssignedSuccess"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });    },
  });

  /**
   * Mutación para desasignar un operador de su sede actual
   * 
   * @mutation unassignStaff  
   * @param {number} userId - ID del operador a desasignar
   * @returns {Promise<any>} Promesa con la respuesta de la API
   * 
   * @description
   * Remueve la asignación actual de un operador, dejándolo disponible
   * para ser asignado a otra sede. Esta acción es irreversible y requiere
   * confirmación explícita del administrador.
   * 
   * @businessLogic
   * - Verifica que el operador esté actualmente asignado
   * - Confirma permisos de administrador
   * - Remueve la relación operador-sede de la base de datos
   * - Mantiene el historial de asignaciones para auditoría
   * 
   * @sideEffects
   * **En éxito:**
   * - Invalida cache de `staffAssignments`
   * - Invalida cache de `availableStaff`
   * - Muestra notificación de desasignación exitosa
   * - El operador aparece nuevamente en la lista de disponibles
   * 
   * **En error:**
   * - Muestra notificación de error
   * - No modifica el estado de asignación
   * - Permite reintento de la operación
   * 
   * @apiCall
   * - **Método**: DELETE
   * - **Endpoint**: `/api/staff-assignments/{userId}`
   * - **Credenciales**: Incluidas para autenticación
   * - **Sin body**: La información está en la URL
   * 
   * @validation
   * - Requiere `userId` válido (operador existente)
   * - El operador debe estar actualmente asignado
   * - Solo administradores pueden ejecutar la acción
   * 
   * @example
   * ```tsx
   * function UnassignButton({ assignment }: { assignment: StaffAssignment }) {
   *   const { unassignStaff } = useStaffAssignments();
   *   const [showConfirm, setShowConfirm] = useState(false);
   * 
   *   const handleUnassign = async () => {
   *     try {
   *       await unassignStaff.mutateAsync(assignment.id);
   *       // Éxito - notificación automática
   *       setShowConfirm(false);
   *     } catch (error) {
   *       // Error - notificación automática
   *       console.error('Error en desasignación:', error);
   *     }
   *   };
   * 
   *   return (
   *     <>
   *       <button onClick={() => setShowConfirm(true)}>
   *         Desasignar de {assignment.branchName}
   *       </button>
   *       
   *       {showConfirm && (
   *         <ConfirmDialog
   *           title="Confirmar desasignación"
   *           message={`¿Desasignar a ${assignment.username}?`}
   *           onConfirm={handleUnassign}
   *           onCancel={() => setShowConfirm(false)}
   *           isLoading={unassignStaff.isPending}
   *         />
   *       )}
   *     </>
   *   );
   * }
   * ```
   * 
   * @warning
   * **Importante**: Esta acción no se puede deshacer automáticamente.
   * El operador deberá ser reasignado manualmente si se requiere.
   * 
   * @errorCodes
   * - **400**: ID de usuario inválido
   * - **401**: No autorizado (no es administrador)
   * - **404**: Operador no encontrado o no asignado
   * - **500**: Error interno del servidor
   */
  const unassignStaff = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/staff-assignments/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");
      const responseText = await response.text();

      if (!response.ok) {
        const errorMessage = isJson ? JSON.parse(responseText).message : responseText;
        throw new Error(errorMessage);
      }

      if (!isJson) {
        throw new Error("Invalid server response format");
      }

      return JSON.parse(responseText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff-assignments/available"] });
      toast({
        title: t("admin.staffAssignments.staffUnassigned"),
        description: t("admin.staffAssignments.staffUnassignedSuccess"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });    },
  });

  /**
   * Mutación para reasignar un operador a una nueva sede
   * 
   * @mutation reassignStaff
   * @param {Object} params - Parámetros de reasignación
   * @param {number} params.userId - ID del operador a reasignar
   * @param {ReassignStaffData} params.data - Nueva sede destino
   * @returns {Promise<any>} Promesa con la respuesta de la API
   * 
   * @description
   * Cambia la asignación de un operador desde su sede actual hacia
   * una nueva sede destino. Es más eficiente que desasignar y volver
   * a asignar, y mantiene mejor el historial de cambios.
   * 
   * @businessLogic
   * - Verifica que el operador esté actualmente asignado
   * - Valida que la nueva sede sea diferente a la actual
   * - Confirma que la sede destino esté activa
   * - Actualiza la asignación en una sola operación atómica
   * 
   * @sideEffects
   * **En éxito:**
   * - Invalida cache de `staffAssignments`
   * - Invalida cache de `availableStaff`
   * - Muestra notificación de reasignación exitosa
   * - Actualiza la UI con la nueva asignación
   * 
   * **En error:**
   * - Muestra notificación de error específico
   * - Mantiene la asignación original
   * - Permite corrección y reintento
   * 
   * @apiCall
   * - **Método**: PUT
   * - **Endpoint**: `/api/staff-assignments/{userId}`
   * - **Headers**: `Content-Type: application/json`
   * - **Body**: `{ branchId: number }`
   * - **Credenciales**: Incluidas para autenticación
   * 
   * @validation
   * - Requiere `userId` válido (operador existente y asignado)
   * - Requiere `branchId` válido (sede activa y diferente)
   * - Solo administradores pueden ejecutar reasignaciones
   * 
   * @example
   * ```tsx
   * function ReassignmentDialog({ 
   *   assignment, 
   *   availableBranches,
   *   onClose 
   * }: ReassignmentDialogProps) {
   *   const { reassignStaff } = useStaffAssignments();
   *   const [selectedBranchId, setSelectedBranchId] = useState<number>();
   * 
   *   const handleReassign = async () => {
   *     if (!selectedBranchId) return;
   * 
   *     try {
   *       await reassignStaff.mutateAsync({
   *         userId: assignment.id,
   *         data: { branchId: selectedBranchId }
   *       });
   *       // Éxito - notificación automática
   *       onClose();
   *     } catch (error) {
   *       // Error - notificación automática
   *       console.error('Error en reasignación:', error);
   *     }
   *   };
   * 
   *   return (
   *     <Dialog>
   *       <h2>Reasignar a {assignment.username}</h2>
   *       <p>Sede actual: {assignment.branchName}</p>
   *       
   *       <select 
   *         value={selectedBranchId} 
   *         onChange={(e) => setSelectedBranchId(Number(e.target.value))}
   *       >
   *         <option value="">Seleccionar nueva sede...</option>
   *         {availableBranches.map(branch => (
   *           <option key={branch.id} value={branch.id}>
   *             {branch.name}
   *           </option>
   *         ))}
   *       </select>
   * 
   *       <button 
   *         onClick={handleReassign}
   *         disabled={!selectedBranchId || reassignStaff.isPending}
   *       >
   *         {reassignStaff.isPending ? 'Reasignando...' : 'Confirmar Reasignación'}
   *       </button>
   *     </Dialog>
   *   );
   * }
   * ```
   * 
   * @example
   * ```tsx
   * // Reasignación masiva
   * function BulkReassignment({ assignments, targetBranchId }) {
   *   const { reassignStaff } = useStaffAssignments();
   * 
   *   const handleBulkReassign = async () => {
   *     const promises = assignments.map(assignment =>
   *       reassignStaff.mutateAsync({
   *         userId: assignment.id,
   *         data: { branchId: targetBranchId }
   *       })
   *     );
   * 
   *     try {
   *       await Promise.all(promises);
   *       console.log('Reasignación masiva completada');
   *     } catch (error) {
   *       console.error('Error en reasignación masiva:', error);
   *     }
   *   };
   * 
   *   return (
   *     <button onClick={handleBulkReassign}>
   *       Reasignar {assignments.length} operadores
   *     </button>
   *   );
   * }
   * ```
   * 
   * @advantages
   * - **Atomicidad**: Operación en una sola transacción
   * - **Historial**: Mantiene registro de cambios de sede
   * - **Eficiencia**: No requiere dos operaciones separadas
   * - **Consistencia**: Evita estados intermedios inconsistentes
   * 
   * @errorCodes
   * - **400**: Datos inválidos o sede igual a la actual
   * - **401**: No autorizado (no es administrador)
   * - **404**: Operador no encontrado o no asignado
   * - **409**: Conflicto con reglas de negocio
   * - **500**: Error interno del servidor
   */
  const reassignStaff = useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: number;
      data: ReassignStaffData;
    }) => {
      const response = await fetch(`/api/staff-assignments/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");
      const responseText = await response.text();

      if (!response.ok) {
        const errorMessage = isJson ? JSON.parse(responseText).message : responseText;
        throw new Error(errorMessage);
      }

      if (!isJson) {
        throw new Error("Invalid server response format");
      }

      return JSON.parse(responseText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff-assignments/available"] });
      toast({
        title: t("admin.staffAssignments.staffReassigned"),
        description: t("admin.staffAssignments.staffReassignedSuccess"),
      });
    },    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // === VALOR DE RETORNO ===
  
  /**
   * Objeto de retorno del hook con todas las funcionalidades disponibles
   * 
   * @returns {UseStaffAssignmentsReturn} Objeto con datos y operaciones
   * @description
   * Proporciona acceso a todos los datos y operaciones necesarias para
   * la gestión completa de asignaciones de personal en componentes React.
   */
  return {
    // === DATOS DE CONSULTA ===
    
    /** 
     * Lista completa de asignaciones de personal
     * @type {StaffAssignment[] | undefined}
     * @description Incluye tanto operadores asignados como disponibles
     */
    staffAssignments,
    
    /** 
     * Lista de operadores disponibles para asignación
     * @type {AvailableStaff[] | undefined}
     * @description Solo operadores sin asignar y con rol "staff"
     */
    availableStaff,
    
    /** 
     * Estado de carga de las consultas principales
     * @type {boolean}
     * @description true mientras cargan staffAssignments o availableStaff
     */
    isLoading: isLoading || isLoadingAvailable,
    
    // === OPERACIONES DE MUTACIÓN ===
    
    /** 
     * Mutación para asignar operador a sede
     * @type {UseMutationResult<any, Error, AssignStaffData>}
     * @description Incluye mutate, mutateAsync, isPending, error, etc.
     */
    assignStaff,
    
    /** 
     * Mutación para desasignar operador de su sede
     * @type {UseMutationResult<any, Error, number>}
     * @description Remueve asignación actual del operador
     */
    unassignStaff,
    
    /** 
     * Mutación para reasignar operador a nueva sede
     * @type {UseMutationResult<any, Error, {userId: number, data: ReassignStaffData}>}
     * @description Cambia asignación en una operación atómica
     */  
    reassignStaff,
    
    // === FUNCIONES AUXILIARES ===
    
    /** 
     * Función para obtener personal de una sede específica
     * @type {(branchId: number) => UseQueryResult<AvailableStaff[]>}
     * @description Retorna hook de consulta configurado para la sede
     */
    getBranchStaff,
  };
}
