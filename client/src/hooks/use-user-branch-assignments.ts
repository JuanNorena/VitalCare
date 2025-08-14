import { useState, useEffect } from "react";
import type { User } from "@db/schema";

/**
 * @fileoverview
 * Hook personalizado para la gestión de asignaciones de usuarios a sedes organizacionales.
 * 
 * Este módulo proporciona un conjunto completo de funcionalidades para administrar la
 * relación entre usuarios del sistema y las sedes/sucursales a las que pueden ser
 * asignados, con soporte especial para diferentes roles de usuario y operaciones
 * administrativas avanzadas.
 * 
 * **Características principales:**
 * - Gestión completa de asignaciones usuario-sede
 * - Filtrado por roles de usuario (staff, selfservice, etc.)
 * - Operaciones de asignación y desasignación en tiempo real
 * - Estados de carga y manejo robusto de errores
 * - Actualización optimista del estado local
 * - Soporte para consultas condicionales
 * 
 * **Casos de uso típicos:**
 * - Asignación de operadores médicos a clínicas específicas
 * - Configuración de terminales de autoservicio por sede
 * - Gestión de personal administrativo por sucursal
 * - Dashboards de administración de recursos humanos
 * 
 * @since 1.0.0
 * @version 1.3.0
 * @lastModified 2025-01-28
 */

/**
 * Interfaz extendida de Usuario que incluye información de la sede asignada.
 * 
 * Omite el campo `password` por seguridad y añade información contextual sobre
 * la sede organizacional a la que el usuario está asignado.
 * 
 * @interface UserWithBranch
 * @extends {Omit<User, 'password'>}
 * 
 * @property {string} [branchName] - Nombre descriptivo de la sede asignada al usuario.
 *                                   Undefined si el usuario no tiene sede asignada.
 * 
 * @example
 * ```typescript
 * const userWithBranch: UserWithBranch = {
 *   id: 1,
 *   username: "operador1",
 *   email: "operador@clinica.com",
 *   role: "staff",
 *   branchId: 5,
 *   branchName: "Clínica Central",
 *   isActive: true,
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * ```
 * 
 * @since 1.0.0
 */

export interface UserWithBranch extends Omit<User, 'password'> {
  branchName?: string;
}

/**
 * Estructura de datos para solicitudes de asignación de sede a usuario.
 * 
 * Define la forma de los datos necesarios para realizar operaciones de
 * asignación o desasignación de usuarios a sedes organizacionales.
 * 
 * @interface BranchAssignmentRequest
 * 
 * @property {number} userId - Identificador único del usuario a asignar/desasignar
 * @property {number | null} branchId - ID de la sede de destino. 
 *                                     null para desasignar al usuario de cualquier sede
 * 
 * @example
 * ```typescript
 * // Asignar usuario a una sede
 * const assignRequest: BranchAssignmentRequest = {
 *   userId: 15,
 *   branchId: 3
 * };
 * 
 * // Desasignar usuario de cualquier sede
 * const unassignRequest: BranchAssignmentRequest = {
 *   userId: 15,
 *   branchId: null
 * };
 * ```
 * 
 * @since 1.0.0
 */
export interface BranchAssignmentRequest {
  userId: number;
  branchId: number | null;
}

/**
 * Hook personalizado para la gestión completa de asignaciones de usuarios a sedes.
 * 
 * Este hook proporciona una interfaz unificada para todas las operaciones relacionadas
 * con la asignación de usuarios del sistema a sedes organizacionales específicas.
 * Incluye funcionalidades para consultar, asignar y desasignar usuarios, con soporte
 * especial para diferentes roles y casos de uso administrativos.
 * 
 * **Funcionalidades principales:**
 * - **Consultas por rol**: Obtención de usuarios filtrados por rol específico
 * - **Gestión de asignaciones**: Asignación y desasignación de sedes a usuarios
 * - **Consultas administrativas**: Acceso completo a todos los usuarios del sistema
 * - **Estados reactivos**: Manejo automático de loading, error y datos
 * - **Actualización optimista**: Actualización inmediata del estado local
 * - **Revalidación**: Funciones de recarga de datos cuando sea necesario
 * 
 * **Flujo de trabajo típico:**
 * 1. Inicialización del hook con estados por defecto
 * 2. Consulta de usuarios según rol o necesidad administrativa
 * 3. Presentación de datos con manejo de estados de carga
 * 4. Operaciones de asignación/desasignación según permisos
 * 5. Actualización automática del estado y revalidación
 * 
 * **Casos de uso:**
 * - Gestión de personal médico por clínica
 * - Asignación de operadores a puntos de atención
 * - Configuración de terminales de autoservicio
 * - Administración de recursos humanos distribuidos
 * 
 * @hook
 * @returns {Object} Objeto con datos, estados y funciones del hook
 * @returns {UserWithBranch[]} returns.users - Array de usuarios con información de sede
 * @returns {boolean} returns.loading - Estado de carga de las operaciones asíncronas
 * @returns {string | null} returns.error - Mensaje de error, null si no hay errores
 * @returns {Function} returns.fetchUsersByRole - Función para obtener usuarios por rol
 * @returns {Function} returns.fetchAllUsers - Función para obtener todos los usuarios
 * @returns {Function} returns.assignBranch - Función para asignar/desasignar sede
 * @returns {Function} returns.refetch - Función de conveniencia para recargar datos
 * 
 * @example
 * ```tsx
 * // Uso básico para gestión de personal
 * function StaffAssignmentManager() {
 *   const {
 *     users,
 *     loading,
 *     error,
 *     fetchUsersByRole,
 *     assignBranch
 *   } = useUserBranchAssignments();
 * 
 *   useEffect(() => {
 *     fetchUsersByRole('staff');
 *   }, []);
 * 
 *   const handleAssignToBranch = async (userId: number, branchId: number) => {
 *     try {
 *       await assignBranch(userId, branchId);
 *       toast.success('Usuario asignado exitosamente');
 *     } catch (error) {
 *       toast.error('Error en la asignación');
 *     }
 *   };
 * 
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorAlert message={error} />;
 * 
 *   return (
 *     <UserAssignmentTable 
 *       users={users}
 *       onAssign={handleAssignToBranch}
 *     />
 *   );
 * }
 * 
 * // Uso avanzado con filtros
 * function AdminUserManager() {
 *   const {
 *     users,
 *     loading,
 *     fetchUsersByRole,
 *     fetchAllUsers
 *   } = useUserBranchAssignments();
 * 
 *   const loadUsersByRole = (role: string) => {
 *     fetchUsersByRole(role, true); // incluir usuarios sin asignar
 *   };
 * 
 *   return (
 *     <AdminPanel>
 *       <RoleFilter onRoleSelect={loadUsersByRole} />
 *       <UserGrid users={users} loading={loading} />
 *     </AdminPanel>
 *   );
 * }
 * ```
 * 
 * @see {@link UserWithBranch} Para la estructura de datos de usuario extendido
 * @see {@link BranchAssignmentRequest} Para el formato de solicitudes de asignación
 * 
 * @throws {Error} Cuando falla la autenticación del usuario
 * @throws {Error} Cuando el servidor responde con error HTTP
 * @throws {Error} Cuando hay problemas de conectividad de red
 * @throws {Error} Cuando se intenta asignar a una sede inexistente
 * 
 * @since 1.0.0
 * @version 1.3.0
 * @lastModified 2025-01-28
 */

export function useUserBranchAssignments() {
  const [users, setUsers] = useState<UserWithBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtiene usuarios filtrados por rol específico del sistema.
   * 
   * Esta función permite consultar usuarios según su rol asignado (staff, selfservice, 
   * admin, etc.) con la opción de incluir usuarios que no tienen sede asignada.
   * Útil para interfaces de administración que necesitan mostrar personal disponible
   * para asignación o gestionar recursos por tipo de rol.
   * 
   * **Comportamiento:**
   * - Actualiza automáticamente los estados de loading y error
   * - Limpia errores previos al iniciar una nueva consulta
   * - Actualiza el estado local de usuarios con los resultados
   * - Mantiene credenciales de sesión para autenticación
   * 
   * **Casos de uso:**
   * - Cargar operadores médicos disponibles para asignación
   * - Mostrar usuarios de autoservicio sin sede configurada
   * - Generar reportes de personal por rol y ubicación
   * 
   * @async
   * @function fetchUsersByRole
   * @param {string} role - Rol de usuarios a consultar ('staff', 'selfservice', 'admin', etc.)
   * @param {boolean} [includeUnassigned=false] - Si incluir usuarios sin sede asignada
   * 
   * @returns {Promise<void>} Promise que se resuelve cuando la consulta se completa
   * 
   * @example
   * ```typescript
   * // Obtener solo operadores con sede asignada
   * await fetchUsersByRole('staff');
   * 
   * // Obtener todos los usuarios de autoservicio, incluyendo los sin asignar
   * await fetchUsersByRole('selfservice', true);
   * 
   * // Uso en efecto para carga inicial
   * useEffect(() => {
   *   fetchUsersByRole('staff');
   * }, []);
   * ```
   * 
   * @throws {Error} Cuando la API responde con estado de error
   * @throws {Error} Cuando hay problemas de conectividad
   * @throws {Error} Cuando el rol especificado no es válido
   * 
   * @since 1.0.0
   */
  const fetchUsersByRole = async (role: string, includeUnassigned?: boolean) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = includeUnassigned ? '?includeUnassigned=true' : '';
      const response = await fetch(`/api/users/by-role/${role}${queryParams}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const userData = await response.json();
      setUsers(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }  };

  /**
   * Asigna o desasigna una sede organizacional a un usuario específico.
   * 
   * Esta función gestiona las operaciones de asignación bidireccional entre usuarios
   * y sedes, permitiendo tanto asignar un usuario a una nueva sede como desasignarlo
   * completamente. Incluye actualización optimista del estado local para una
   * experiencia de usuario fluida y manejo robusto de errores.
   * 
   * **Funcionalidades:**
   * - Asignación de usuario a sede específica
   * - Desasignación completa (branchId = null)
   * - Actualización optimista del estado local
   * - Preservación de datos de usuario existentes
   * - Manejo detallado de errores del servidor
   * 
   * **Flujo de actualización:**
   * 1. Envía solicitud HTTP PUT al servidor
   * 2. Valida respuesta del servidor
   * 3. Actualiza estado local inmediatamente (optimistic update)
   * 4. La información de branchName se actualizará en próximas consultas
   * 
   * @async
   * @function assignBranch
   * @param {number} userId - Identificador único del usuario a modificar
   * @param {number | null} branchId - ID de la sede de destino, null para desasignar
   * 
   * @returns {Promise<any>} Promise con el resultado de la operación del servidor
   * 
   * @example
   * ```typescript
   * // Asignar usuario a una sede específica
   * try {
   *   const result = await assignBranch(userId, 5);
   *   toast.success('Usuario asignado a la sede correctamente');
   * } catch (error) {
   *   toast.error('Error en la asignación: ' + error.message);
   * }
   * 
   * // Desasignar usuario de cualquier sede
   * try {
   *   await assignBranch(userId, null);
   *   toast.success('Usuario desasignado correctamente');
   * } catch (error) {
   *   toast.error('Error en la desasignación');
   * }
   * 
   * // Uso en componente con manejo de estado
   * const handleAssignment = async (userId: number, branchId: number) => {
   *   setAssigning(true);
   *   try {
   *     await assignBranch(userId, branchId);
   *     // El estado se actualiza automáticamente
   *   } catch (error) {
   *     setAssignmentError(error.message);
   *   } finally {
   *     setAssigning(false);
   *   }
   * };
   * ```
   * 
   * @throws {Error} Cuando el usuario especificado no existe
   * @throws {Error} Cuando la sede especificada no existe o está inactiva
   * @throws {Error} Cuando el usuario no tiene permisos para la operación
   * @throws {Error} Cuando hay conflictos de asignación (ej: usuario ya asignado)
   * @throws {Error} Cuando falla la comunicación con el servidor
   * 
   * @since 1.0.0
   */
  const assignBranch = async (userId: number, branchId: number | null) => {
    try {
      const response = await fetch(`/api/users/${userId}/branch`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ branchId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to assign branch");
      }

      const result = await response.json();
        // Actualizar el estado local
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, branchId, branchName: undefined } // La branchName se actualizará en el próximo fetch
          : user
      ));

      return result;
    } catch (err) {
      throw err;
    }  };

  /**
   * Obtiene la lista completa de usuarios del sistema para administradores.
   * 
   * Esta función está diseñada para uso administrativo y proporciona acceso
   * completo a todos los usuarios registrados en el sistema, independientemente
   * de su rol o estado de asignación. Incluye información de sede cuando está
   * disponible y es útil para dashboards administrativos y reportes generales.
   * 
   * **Características:**
   * - Acceso completo a la base de usuarios (requiere permisos de admin)
   * - Información completa de perfil y asignaciones de sede
   * - Estados de loading y error manejados automáticamente
   * - Datos frescos del servidor en cada consulta
   * - Mantiene sesión y credenciales de autenticación
   * 
   * **Casos de uso típicos:**
   * - Dashboards administrativos generales
   * - Reportes de recursos humanos
   * - Auditorías de asignaciones de personal
   * - Gestión masiva de usuarios
   * - Análisis organizacional de distribución de personal
   * 
   * @async
   * @function fetchAllUsers
   * 
   * @returns {Promise<void>} Promise que se resuelve al completar la consulta
   * 
   * @example
   * ```typescript
   * // Carga inicial en dashboard administrativo
   * useEffect(() => {
   *   if (userRole === 'admin') {
   *     fetchAllUsers();
   *   }
   * }, [userRole]);
   * 
   * // Recarga manual tras operaciones masivas
   * const handleBulkOperation = async () => {
   *   await performBulkAssignment();
   *   await fetchAllUsers(); // Recargar datos actualizados
   * };
   * 
   * // Uso con filtrado local
   * const AdminUsersList = () => {
   *   const { users, loading, fetchAllUsers } = useUserBranchAssignments();
   *   const [filter, setFilter] = useState('all');
   * 
   *   useEffect(() => {
   *     fetchAllUsers();
   *   }, []);
   * 
   *   const filteredUsers = users.filter(user => {
   *     if (filter === 'assigned') return user.branchId;
   *     if (filter === 'unassigned') return !user.branchId;
   *     return true;
   *   });
   * 
   *   return <UserTable users={filteredUsers} loading={loading} />;
   * };
   * ```
   * 
   * @throws {Error} Cuando el usuario no tiene permisos de administrador
   * @throws {Error} Cuando falla la autenticación de sesión
   * @throws {Error} Cuando hay problemas de conectividad con el servidor
   * @throws {Error} Cuando el servidor responde con error HTTP
   * 
   * @since 1.0.0
   */
  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/users', {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const userData = await response.json();
      setUsers(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    error,
    fetchUsersByRole,
    fetchAllUsers,
    assignBranch,
    refetch: () => fetchAllUsers(),
  };
}
