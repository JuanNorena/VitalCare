import { useQuery } from "@tanstack/react-query";
import type { Service } from "@db/schema";

/**
 * @fileoverview
 * Hooks personalizados para la gestión de datos específicos de usuarios de autoservicio.
 * 
 * Este módulo proporciona una capa de abstracción para el acceso a datos relacionados con
 * servicios y puntos de atención disponibles para usuarios con rol 'selfservice' en
 * terminales de autoservicio y kioscos interactivos.
 * 
 * **Características principales:**
 * - Filtrado automático por sede asignada al usuario
 * - Caché inteligente con React Query
 * - Revalidación automática al enfocar la ventana
 * - Manejo de estados de carga y error
 * - Tipado estricto con TypeScript
 * 
 * **Casos de uso:**
 * - Terminales de autoservicio en sedes médicas
 * - Kioscos de generación de turnos
 * - Pantallas interactivas de servicios públicos
 * 
 * @since 1.0.0
 * @version 1.2.0
 * @lastModified 2025-01-28
 */

/**
 * Hook personalizado para obtener servicios médicos disponibles para usuarios de autoservicio.
 * 
 * Este hook gestiona la obtención de servicios filtrados automáticamente según la sede
 * asignada al usuario autenticado con rol 'selfservice'. Utiliza React Query para
 * proporcionar caché, sincronización y manejo optimizado de estados.
 * 
 * **Funcionalidades:**
 * - Obtiene servicios disponibles desde el backend
 * - Filtra automáticamente por sede del usuario
 * - Caché inteligente para mejorar rendimiento
 * - Revalidación automática al enfocar ventana
 * - Manejo robusto de errores de red
 * 
 * **Comportamiento:**
 * - Se ejecuta automáticamente al montar el componente
 * - Revalida datos cuando la ventana recupera el foco
 * - Mantiene caché entre navegaciones
 * - Proporciona estados de carga y error
 * 
 * @hook
 * @returns {Object} Objeto con datos y estados del hook
 * @returns {Service[]} returns.services - Array de servicios disponibles para la sede del usuario
 * @returns {boolean} returns.isLoading - Indica si la consulta está en progreso
 * @returns {Error | null} returns.error - Error de la consulta, null si no hay errores
 * 
 * @example
 * ```tsx
 * // Uso básico en componente de autoservicio
 * function SelfServiceSelector() {
 *   const { services, isLoading, error } = useSelfServiceServices();
 * 
 *   if (isLoading) return <Loading />;
 *   if (error) return <ErrorMessage error={error} />;
 * 
 *   return (
 *     <ServiceList>
 *       {services.map(service => (
 *         <ServiceCard key={service.id} service={service} />
 *       ))}
 *     </ServiceList>
 *   );
 * }
 * 
 * // Uso con manejo de estados vacíos
 * function ServiceSelector() {
 *   const { services, isLoading, error } = useSelfServiceServices();
 * 
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Alert type="error">{error.message}</Alert>;
 *   if (services.length === 0) return <EmptyState />;
 * 
 *   return <ServiceGrid services={services} />;
 * }
 * ```
 * 
 * @see {@link useSelfServiceServicePoints} Para obtener puntos de atención
 * @see {@link useSelfServiceServicePointsForService} Para puntos de atención por servicio
 * 
 * @throws {Error} Cuando la respuesta del servidor no es exitosa
 * @throws {Error} Cuando hay problemas de conectividad de red
 * 
 * @since 1.0.0
 * @version 1.1.0
 */
export function useSelfServiceServices() {
  const { data: services, isLoading, error } = useQuery<Service[]>({
    queryKey: ['/api/selfservice/services'],
    queryFn: async () => {
      const response = await fetch('/api/selfservice/services', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch selfservice services');
      }
      return response.json();
    },
    refetchOnWindowFocus: true,
  });

  return {
    services: services || [],
    isLoading,
    error,
  };
}

/**
 * Hook personalizado para obtener puntos de atención disponibles para usuarios de autoservicio.
 * 
 * Este hook gestiona la consulta de puntos de atención (consultorios, salas, etc.) que están
 * disponibles para la sede asignada al usuario autenticado con rol 'selfservice'. Los datos
 * se filtran automáticamente en el backend según la configuración de la sede del usuario.
 * 
 * **Funcionalidades:**
 * - Obtiene puntos de atención filtrados por sede del usuario
 * - Caché eficiente con React Query para mejorar rendimiento
 * - Revalidación automática cuando la ventana recupera el foco
 * - Manejo consistente de estados de carga y error
 * - Sincronización en tiempo real con el backend
 * 
 * **Casos de uso típicos:**
 * - Mostrar opciones de puntos de atención en kioscos
 * - Selección de consultorio para generación de turnos
 * - Validación de disponibilidad de espacios físicos
 * - Interfaz de autoservicio en terminales públicas
 * 
 * @hook
 * @returns {Object} Objeto con datos y estados de la consulta
 * @returns {ServicePoint[]} returns.servicePoints - Array de puntos de atención disponibles
 * @returns {boolean} returns.isLoading - Estado de carga de la consulta
 * @returns {Error | null} returns.error - Error de la consulta, null si es exitosa
 * 
 * @example
 * ```tsx
 * // Uso en selector de puntos de atención
 * function ServicePointSelector() {
 *   const { servicePoints, isLoading, error } = useSelfServiceServicePoints();
 * 
 *   if (isLoading) {
 *     return <LoadingSpinner message="Cargando puntos de atención..." />;
 *   }
 * 
 *   if (error) {
 *     return (
 *       <ErrorAlert>
 *         Error al cargar puntos de atención: {error.message}
 *       </ErrorAlert>
 *     );
 *   }
 * 
 *   return (
 *     <div className="service-points-grid">
 *       {servicePoints.map(point => (
 *         <ServicePointCard 
 *           key={point.id} 
 *           servicePoint={point}
 *           onSelect={() => handleSelectPoint(point)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * 
 * // Uso con filtrado adicional
 * function AvailablePointsList() {
 *   const { servicePoints, isLoading } = useSelfServiceServicePoints();
 *   const availablePoints = servicePoints.filter(point => point.isActive);
 * 
 *   return (
 *     <PointsList 
 *       points={availablePoints} 
 *       loading={isLoading}
 *       emptyMessage="No hay puntos de atención disponibles"
 *     />
 *   );
 * }
 * ```
 * 
 * @see {@link useSelfServiceServices} Para obtener servicios disponibles
 * @see {@link useSelfServiceServicePointsForService} Para puntos específicos por servicio
 * 
 * @throws {Error} Cuando la API del servidor responde con error
 * @throws {Error} Cuando hay fallos de conectividad de red
 * @throws {Error} Cuando el usuario no tiene permisos de acceso
 * 
 * @since 1.0.0
 * @version 1.1.0
 */
export function useSelfServiceServicePoints() {
  const { data: servicePoints, isLoading, error } = useQuery({
    queryKey: ['/api/selfservice/service-points'],
    queryFn: async () => {
      const response = await fetch('/api/selfservice/service-points', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch selfservice service points');
      }
      return response.json();
    },
    refetchOnWindowFocus: true,
  });

  return {
    servicePoints: servicePoints || [],
    isLoading,
    error,
  };
}

/**
 * Hook personalizado para obtener puntos de atención que pueden prestar un servicio específico.
 * 
 * Este hook especializado gestiona la obtención de puntos de atención que están configurados
 * y capacitados para prestar un servicio médico específico. La consulta se filtra automáticamente
 * por la sede asignada al usuario de autoservicio y por la compatibilidad servicio-punto.
 * 
 * **Funcionalidades:**
 * - Consulta condicional basada en la selección de servicio
 * - Filtrado automático por sede del usuario selfservice
 * - Validación de compatibilidad servicio-punto de atención
 * - Optimización con caché inteligente y revalidación
 * - Manejo eficiente de estados vacíos cuando no hay servicio seleccionado
 * 
 * **Lógica de consulta:**
 * - Solo se ejecuta cuando hay un serviceId válido
 * - Retorna array vacío si no hay servicio seleccionado
 * - Filtra puntos de atención compatibles con el servicio
 * - Considera configuraciones de horarios y disponibilidad
 * 
 * **Casos de uso principales:**
 * - Selección de consultorio después de elegir servicio
 * - Validación de disponibilidad por especialidad médica
 * - Flujo de reserva en terminales de autoservicio
 * - Optimización de asignación de recursos
 * 
 * @hook
 * @param {number | null} serviceId - ID del servicio para filtrar puntos de atención compatibles. 
 *                                   Si es null, la consulta no se ejecuta
 * 
 * @returns {Object} Objeto con datos y estados de la consulta filtrada
 * @returns {ServicePoint[]} returns.servicePoints - Puntos de atención compatibles con el servicio
 * @returns {boolean} returns.isLoading - Estado de carga, false si serviceId es null
 * @returns {Error | null} returns.error - Error de la consulta, null si es exitosa o no habilitada
 * 
 * @example
 * ```tsx
 * // Uso en flujo de selección servicio → punto de atención
 * function ServiceFlowSelector() {
 *   const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
 *   const { servicePoints, isLoading, error } = useSelfServiceServicePointsForService(selectedServiceId);
 * 
 *   const handleServiceSelect = (serviceId: number) => {
 *     setSelectedServiceId(serviceId);
 *   };
 * 
 *   return (
 *     <div>
 *       <ServiceSelector onSelect={handleServiceSelect} />
 *       
 *       {selectedServiceId && (
 *         <div className="service-points-section">
 *           <h3>Puntos de atención disponibles</h3>
 *           {isLoading ? (
 *             <LoadingSpinner />
 *           ) : error ? (
 *             <ErrorMessage error={error} />
 *           ) : servicePoints.length === 0 ? (
 *             <EmptyState message="No hay puntos de atención para este servicio" />
 *           ) : (
 *             <ServicePointGrid points={servicePoints} />
 *           )}
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * 
 * // Uso con validación de compatibilidad
 * function SmartServicePointSelector({ serviceId }: { serviceId: number | null }) {
 *   const { servicePoints, isLoading } = useSelfServiceServicePointsForService(serviceId);
 * 
 *   // Solo muestra la selección si hay servicio seleccionado
 *   if (!serviceId) {
 *     return <PlaceholderMessage>Primero seleccione un servicio</PlaceholderMessage>;
 *   }
 * 
 *   return (
 *     <CompatiblePointsList 
 *       serviceId={serviceId}
 *       points={servicePoints}
 *       loading={isLoading}
 *     />
 *   );
 * }
 * ```
 * 
 * @see {@link useSelfServiceServices} Para obtener la lista de servicios disponibles
 * @see {@link useSelfServiceServicePoints} Para todos los puntos de atención de la sede
 * 
 * @throws {Error} Cuando la API del servicio responde con estado de error
 * @throws {Error} Cuando el serviceId proporcionado no existe
 * @throws {Error} Cuando hay problemas de conectividad con el servidor
 * @throws {Error} Cuando el usuario no tiene permisos para el servicio
 * 
 * @since 1.0.0
 * @version 1.2.0
 * @lastModified 2025-01-28
 */
export function useSelfServiceServicePointsForService(serviceId: number | null) {
  const { data: servicePoints, isLoading, error } = useQuery({
    queryKey: ['/api/selfservice/services', serviceId, 'service-points'],
    queryFn: async () => {
      if (!serviceId) return [];
      
      const response = await fetch(`/api/selfservice/services/${serviceId}/service-points`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch service points for service');
      }
      return response.json();
    },
    enabled: !!serviceId,
    refetchOnWindowFocus: true,
  });

  return {
    servicePoints: servicePoints || [],
    isLoading,
    error,
  };
}
