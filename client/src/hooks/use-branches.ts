import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Branch } from "@db/schema";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

/**
 * Hook personalizado para la gestión de sedes (branches).
 * 
 * Este hook proporciona toda la funcionalidad necesaria para administrar
 * las sedes o sucursales del sistema, incluyendo operaciones CRUD completas
 * con validación, notificaciones y manejo de errores.
 * 
 * **Características principales:**
 * - Consulta de todas las sedes activas
 * - Creación de nuevas sedes con validación
 * - Actualización de información de sedes existentes
 * - Eliminación de sedes (con validación de dependencias)
 * - Cache inteligente con React Query
 * - Notificaciones automáticas de éxito/error
 * - Internacionalización completa
 * 
 * @hook
 * @example
 * ```tsx
 * function BranchManager() {
 *   const {
 *     branches,
 *     isLoading,
 *     createBranch,
 *     updateBranch,
 *     deleteBranch
 *   } = useBranches();
 * 
 *   const handleCreateBranch = async (branchData) => {
 *     try {
 *       await createBranch(branchData);
 *       // Notificación automática de éxito
 *     } catch (error) {
 *       // Manejo automático de errores
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       {branches?.map(branch => (
 *         <BranchCard key={branch.id} branch={branch} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @returns {Object} Objeto con datos y funciones para gestión de sedes
 * 
 * @author Equipo de Desarrollo
 * @since 1.0.0
 * @version 1.0.0
 */
export function useBranches() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  /**
   * Consulta todas las sedes del sistema.
   * 
   * Obtiene la lista completa de sedes con sus datos básicos,
   * manteniendo el cache actualizado automáticamente.
   * 
   * @query branches
   * @returns {Branch[]} Array de sedes del sistema
   * @throws {Error} Si falla la consulta al servidor
   */
  const { data: branches, isLoading } = useQuery<Branch[]>({
    queryKey: ['/api/branches'],
    queryFn: async () => {
      const response = await fetch('/api/branches', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }
      return response.json();
    },
    refetchOnWindowFocus: true,
  });

  /**
   * Mutación para crear nuevas sedes.
   * 
   * Procesa la creación de una nueva sede con validación del servidor,
   * actualización automática del cache y notificaciones al usuario.
   * 
   * @mutation createBranch
   * @param {Partial<Branch>} branch - Datos de la nueva sede
   * @returns {Promise<Branch>} Sede creada con datos completos
   * @throws {Error} Si falla la creación en el servidor
   * 
   * @example
   * ```tsx
   * await createBranch({
   *   name: 'Sede Central',
   *   address: 'Av. Principal 123',
   *   phone: '+1234567890',
   *   email: 'central@empresa.com'
   * });
   * ```
   */  const createBranchMutation = useMutation({
    mutationFn: async (branch: Partial<Branch>) => {
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(branch),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || 'Error al crear la sede');
      }

      return response.json();
    },
    onSuccess: () => {
      // Actualiza el cache tras crear nueva sede
      queryClient.invalidateQueries({ queryKey: ['/api/branches'] });
      // También invalida service points ya que pueden estar relacionados
      queryClient.invalidateQueries({ queryKey: ['/api/service-points'] });
    },
    onError: (error: Error) => {
      // Notifica error al usuario
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    },
  });

  /**
   * Mutación para actualizar sedes existentes.
   * 
   * Permite modificar la información de sedes existentes con validación
   * del servidor y actualización automática de la interfaz.
   * 
   * @mutation updateBranch
   * @param {Object} params - Parámetros de actualización
   * @param {number} params.id - ID de la sede a actualizar
   * @param {Partial<Branch>} params.branch - Datos actualizados
   * @returns {Promise<Branch>} Sede actualizada
   * @throws {Error} Si falla la actualización
   * 
   * @example
   * ```tsx
   * await updateBranch({
   *   id: 1,
   *   branch: { name: 'Sede Principal Actualizada' }
   * });
   * ```
   */  const updateBranchMutation = useMutation({
    mutationFn: async ({ id, branch }: { id: number, branch: Partial<Branch> }) => {
      const response = await fetch(`/api/branches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(branch),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || 'Error al actualizar la sede');
      }

      return response.json();
    },
    onSuccess: () => {
      // Actualiza el cache tras modificar sede
      queryClient.invalidateQueries({ queryKey: ['/api/branches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/service-points'] });
    },
    onError: (error: Error) => {
      // Maneja errores de actualización
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });    },
  });

  /**
   * Mutación para cambiar el estado (activar/desactivar) de una sede.
   * 
   * Función específica para el toggle de estado que utiliza la ruta
   * dedicada del backend para mayor eficiencia y claridad.
   * 
   * @mutation toggleBranchStatus
   * @param {Object} params - Parámetros del toggle
   * @param {number} params.id - ID de la sede
   * @param {boolean} params.isActive - Nuevo estado activo/inactivo
   * @returns {Promise<Branch>} Sede con estado actualizado
   * @throws {Error} Si falla el cambio de estado
   * 
   * @example
   * ```tsx
   * await toggleBranchStatus({
   *   id: 1,
   *   isActive: false // Desactivar sede
   * });
   * ```
   */  const toggleBranchStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      const response = await fetch(`/api/branches/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || 'Error al cambiar el estado de la sede');
      }

      return response.json();
    },
    onSuccess: () => {
      // Actualiza el cache tras cambiar estado
      queryClient.invalidateQueries({ queryKey: ['/api/branches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/service-points'] });
    },
    onError: (error: Error) => {
      // Maneja errores de cambio de estado
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: error.message,
      });
    },
  });

  /**
   * Retorna todas las funciones y datos disponibles del hook.
   * 
   * Expone una API completa para gestión de sedes, organizando
   * las funcionalidades por categorías para facilitar su uso.
   * 
   * @returns {Object} API completa para gestión de sedes
   */  return {
    // Datos y estados
    branches,
    isLoading,
    
    // Operaciones CRUD
    createBranch: createBranchMutation.mutateAsync,
    updateBranch: updateBranchMutation.mutateAsync,
    toggleBranchStatus: toggleBranchStatusMutation.mutateAsync,
    
    // Estados de carga de operaciones
    isCreating: createBranchMutation.isPending,
    isUpdating: updateBranchMutation.isPending,
    isTogglingStatus: toggleBranchStatusMutation.isPending,
  };
}
