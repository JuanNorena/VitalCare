import { useQuery } from "@tanstack/react-query";
import type { Service, Branch } from "@db/schema";

/**
 * Interface para servicios disponibles en una sede específica
 * 
 * @interface BranchServiceInfo
 * @description
 * Representa un servicio disponible en una sede particular, incluyendo
 * información completa del servicio y la sede donde se ofrece.
 */
export interface BranchServiceInfo extends Service {
  /** Indica si el servicio está activo en esta sede */
  isAvailableInBranch: boolean;
  /** ID de la sede donde se ofrece el servicio */
  branchId: number;
  /** Nombre de la sede donde se ofrece el servicio */
  branchName: string;
}

/**
 * Hook personalizado para obtener servicios disponibles en sedes específicas.
 * 
 * Este hook permite consultar qué servicios están disponibles en una sede
 * determinada, facilitando la validación y selección de servicios durante
 * el proceso de agendamiento de citas.
 * 
 * **Características principales:**
 * - Consulta servicios por sede específica
 * - Cache inteligente para optimizar rendimiento
 * - Validación de disponibilidad de servicios
 * - Información enriquecida con datos de sede
 * 
 * @hook
 * @param {number} branchId - ID de la sede para consultar servicios
 * @returns {Object} Datos de servicios disponibles y estado de carga
 * 
 * @example
 * ```tsx
 * function ServiceSelector({ selectedBranchId }) {
 *   const { 
 *     branchServices, 
 *     isLoading, 
 *     error 
 *   } = useBranchServices(selectedBranchId);
 * 
 *   if (isLoading) return <div>Cargando servicios...</div>;
 *   if (error) return <div>Error al cargar servicios</div>;
 * 
 *   return (
 *     <div>
 *       {branchServices?.map(service => (
 *         <div key={service.id}>
 *           {service.name} - Disponible en {service.branchName}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @since 1.0.0
 * @version 1.0.0
 * @lastModified 2025-06-19
 */
export function useBranchServices(branchId?: number) {
  const { data: branchServices, isLoading, error } = useQuery<BranchServiceInfo[]>({
    queryKey: branchId ? ['/api/branches', branchId, 'services'] : ['/api/branches/services'],
    queryFn: async () => {
      const url = branchId 
        ? `/api/branches/${branchId}/services`
        : '/api/branches/services';
        
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch branch services');
      }
      
      return response.json();
    },
    enabled: !!branchId, // Solo ejecutar si hay branchId
  });

  return {
    branchServices,
    isLoading,
    error
  };
}

/**
 * Hook para obtener todas las sedes que ofrecen un servicio específico.
 * 
 * Útil para mostrar al usuario dónde puede acceder a un servicio particular.
 * 
 * @hook
 * @param {number} serviceId - ID del servicio a consultar
 * @returns {Object} Sedes que ofrecen el servicio
 * 
 * @example
 * ```tsx
 * function ServiceBranches({ serviceId }) {
 *   const { branches, isLoading } = useServiceBranches(serviceId);
 * 
 *   return (
 *     <div>
 *       <h3>Disponible en:</h3>
 *       {branches?.map(branch => (
 *         <div key={branch.id}>{branch.name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useServiceBranches(serviceId?: number) {
  const { data: branches, isLoading, error } = useQuery<Branch[]>({
    queryKey: serviceId ? ['/api/services', serviceId, 'branches'] : [],
    queryFn: async () => {
      const response = await fetch(`/api/services/${serviceId}/branches`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch service branches');
      }
      
      return response.json();
    },
    enabled: !!serviceId,
  });

  return {
    branches,
    isLoading,
    error
  };
}

/**
 * Hook para validar si un servicio está disponible en una sede específica.
 * 
 * Proporciona validación rápida para flujos de agendamiento.
 * 
 * @hook
 * @param {number} serviceId - ID del servicio
 * @param {number} branchId - ID de la sede
 * @returns {Object} Estado de disponibilidad del servicio en la sede
 * 
 * @example
 * ```tsx
 * function BookingValidator({ serviceId, branchId }) {
 *   const { isAvailable, isLoading } = useServiceAvailability(serviceId, branchId);
 * 
 *   if (isLoading) return <div>Validando...</div>;
 *   if (!isAvailable) return <div>Servicio no disponible en esta sede</div>;
 * 
 *   return <BookingForm serviceId={serviceId} branchId={branchId} />;
 * }
 * ```
 */
export function useServiceAvailability(serviceId?: number, branchId?: number) {
  const { data: isAvailable, isLoading, error } = useQuery<boolean>({
    queryKey: ['/api/services', serviceId, 'branches', branchId, 'availability'],
    queryFn: async () => {
      const response = await fetch(
        `/api/services/${serviceId}/branches/${branchId}/availability`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to check service availability');
      }
      
      const result = await response.json();
      return result.isAvailable;
    },
    enabled: !!(serviceId && branchId),
  });

  return {
    isAvailable,
    isLoading,
    error
  };
}
