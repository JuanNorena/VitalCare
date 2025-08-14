import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import type { SelfService, ServicePoint, Service } from "@db/schema";

/**
 * Autoservicio con información detallada de puntos de servicio y servicios asociados
 * @interface SelfServiceWithDetails
 * @extends SelfService
 */
interface SelfServiceWithDetails extends SelfService {
  /** Lista de puntos de servicio asociados al autoservicio */
  servicePoints: {
    /** ID único del punto de servicio */
    id: number;
    /** Nombre del punto de servicio */
    name: string;
    /** Descripción del punto de servicio (opcional) */
    description: string | null;
    /** Estado de activación del punto de servicio */
    isActive: boolean;
  }[];
  /** Lista de servicios asociados al autoservicio (opcional) */
  services?: {
    /** ID único del servicio */
    id: number;
    /** Nombre del servicio */
    name: string;
    /** Descripción del servicio (opcional) */
    description: string | null;
    /** Duración estimada del servicio en minutos */
    duration: number;
    /** Estado de activación del servicio */
    isActive: boolean;
  }[];
}

/**
 * Datos requeridos para crear un nuevo autoservicio
 * @interface CreateSelfServiceData
 */
interface CreateSelfServiceData {
  /** Nombre del autoservicio */
  name: string;
  /** Descripción del autoservicio */
  description: string;
  /** Lista de IDs de puntos de servicio a asociar */
  servicePointIds: number[];
  /** Lista de IDs de servicios a asociar */
  serviceIds: number[];
}

/**
 * Datos requeridos para actualizar un autoservicio existente
 * @interface UpdateSelfServiceData
 */
interface UpdateSelfServiceData {
  /** Nombre del autoservicio */
  name: string;
  /** Descripción del autoservicio */
  description: string;
  /** Lista de IDs de puntos de servicio a asociar */
  servicePointIds: number[];
  /** Lista de IDs de servicios a asociar */
  serviceIds: number[];
}

/**
 * Hook personalizado para gestionar autoservicios (self-services)
 * 
 * Este hook proporciona funcionalidad completa para el CRUD de autoservicios,
 * incluyendo la gestión de sus relaciones con puntos de servicio y servicios.
 * Los autoservicios permiten a los usuarios generar turnos de forma autónoma
 * sin intervención del personal administrativo.
 * 
 * @hook
 * @returns {Object} Objeto con funciones y estados para gestionar autoservicios
 * @returns {SelfServiceWithDetails[] | undefined} selfServices - Lista de autoservicios
 * @returns {boolean} isLoading - Estado de carga de los datos
 * @returns {Function} getSelfService - Función para obtener un autoservicio específico
 * @returns {Function} createSelfService - Función para crear un nuevo autoservicio
 * @returns {Function} updateSelfService - Función para actualizar un autoservicio
 * @returns {Function} updateSelfServiceStatus - Función para cambiar el estado de un autoservicio
 * 
 * @example
 * ```tsx
 * const { 
 *   selfServices, 
 *   isLoading, 
 *   createSelfService,
 *   updateSelfService 
 * } = useSelfServices();
 * 
 * const handleCreate = async () => {
 *   await createSelfService({
 *     name: "Autoservicio Principal",
 *     description: "Autoservicio para turnos generales",
 *     servicePointIds: [1, 2],
 *     serviceIds: [1, 3, 5]
 *   });
 * };
 * ```
 * 
 * @author Sistema de Gestión de Atención Plus
 * @since 1.0.0
 * @version 1.0.0
 */
export function useSelfServices() {  // ================================================================================
  // HOOKS DE REACT QUERY Y UTILIDADES
  // ================================================================================
  
  /** Cliente de React Query para invalidación de consultas */
  const queryClient = useQueryClient();
  
  /** Hook para mostrar notificaciones toast */
  const { toast } = useToast();
  
  /** Hook para internacionalización de textos */
  const { t } = useTranslation();

  // ================================================================================
  // CONSULTA PRINCIPAL - OBTENER TODOS LOS AUTOSERVICIOS
  // ================================================================================
  
  /**
   * Consulta para obtener todos los autoservicios con sus detalles
   * @query selfServices
   */
  const { data: selfServices, isLoading } = useQuery<SelfServiceWithDetails[]>({
    queryKey: ["/api/self-services"],
    queryFn: async () => {
      const response = await fetch("/api/self-services", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch self services");
      }
      return response.json();
    },
  });

  // ================================================================================
  // FUNCIÓN PARA OBTENER AUTOSERVICIO ESPECÍFICO
  // ================================================================================
  
  /**
   * Función que retorna una consulta para obtener un autoservicio específico
   * @function getSelfService
   * @param {number} selfServiceId - ID del autoservicio a obtener
   * @returns {Object} Query object con los datos del autoservicio
   * @description Utiliza consulta condicional que solo se ejecuta si se proporciona un ID válido
   */
  const getSelfService = (selfServiceId: number) => {
    return useQuery<SelfServiceWithDetails>({
      queryKey: [`/api/self-services/${selfServiceId}`],
      queryFn: async () => {
        const response = await fetch(`/api/self-services/${selfServiceId}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch self service");
        }
        return response.json();
      },
      enabled: !!selfServiceId,
    });
  };

  // ================================================================================
  // MUTACIÓN PARA CREAR AUTOSERVICIO
  // ================================================================================
  
  /**
   * Mutación para crear un nuevo autoservicio
   * @function createSelfService
   * @async
   */
  const createSelfService = useMutation({
    /**
     * Función que ejecuta la creación del autoservicio
     * @async
     * @function mutationFn
     * @param {CreateSelfServiceData} data - Datos del autoservicio a crear
     * @returns {Promise<Object>} Respuesta del servidor con el autoservicio creado
     */
    mutationFn: async (data: CreateSelfServiceData) => {
      const response = await apiRequest("POST", "/api/self-services", data);
      return response.json();
    },
    
    /**
     * Callback ejecutado cuando la creación es exitosa
     * @callback onSuccess
     * @description Invalida el cache y muestra notificación de éxito
     */
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/self-services"] });
      toast({
        title: t("selfServices.created"),
        description: t("selfServices.createdDescription"),
      });
    },
    
    /**
     * Callback ejecutado cuando ocurre un error durante la creación
     * @callback onError
     * @param {Error} error - Error ocurrido durante la petición
     */
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ================================================================================
  // MUTACIÓN PARA ACTUALIZAR AUTOSERVICIO
  // ================================================================================
  
  /**
   * Mutación para actualizar un autoservicio existente
   * @function updateSelfService
   * @async
   */
  const updateSelfService = useMutation({
    /**
     * Función que ejecuta la actualización del autoservicio
     * @async
     * @function mutationFn
     * @param {Object} params - Parámetros de actualización
     * @param {number} params.selfServiceId - ID del autoservicio a actualizar
     * @param {UpdateSelfServiceData} params.data - Nuevos datos del autoservicio
     * @returns {Promise<Object>} Respuesta del servidor con el autoservicio actualizado
     */
    mutationFn: async ({
      selfServiceId,
      data,
    }: {
      selfServiceId: number;
      data: UpdateSelfServiceData;
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/self-services/${selfServiceId}`,
        data
      );
      return response.json();
    },
    
    /**
     * Callback ejecutado cuando la actualización es exitosa
     * @callback onSuccess
     * @param {Object} _ - Datos de respuesta (no utilizados)
     * @param {Object} variables - Variables de la mutación
     * @description Invalida múltiples consultas relacionadas y muestra notificación
     */
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/self-services"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/self-services/${variables.selfServiceId}`],
      });
      toast({
        title: t("selfServices.updated"),
        description: t("selfServices.updatedDescription"),
      });
    },
    
    /**
     * Callback ejecutado cuando ocurre un error durante la actualización
     * @callback onError
     * @param {Error} error - Error ocurrido durante la petición
     */
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ================================================================================
  // MUTACIÓN PARA ACTUALIZAR ESTADO DEL AUTOSERVICIO
  // ================================================================================
  
  /**
   * Mutación para cambiar el estado de activación de un autoservicio
   * @function updateSelfServiceStatus
   * @async
   */
  const updateSelfServiceStatus = useMutation({
    /**
     * Función que ejecuta el cambio de estado del autoservicio
     * @async
     * @function mutationFn
     * @param {Object} params - Parámetros de cambio de estado
     * @param {number} params.selfServiceId - ID del autoservicio
     * @param {boolean} params.isActive - Nuevo estado de activación
     * @returns {Promise<Object>} Respuesta del servidor
     */
    mutationFn: async ({
      selfServiceId,
      isActive,
    }: {
      selfServiceId: number;
      isActive: boolean;
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/self-services/${selfServiceId}/status`,
        { isActive }
      );
      return response.json();
    },
    
    /**
     * Callback ejecutado cuando el cambio de estado es exitoso
     * @callback onSuccess
     * @description Invalida el cache y muestra notificación de éxito
     */
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/self-services"] });
      toast({
        title: t("selfServices.statusUpdated"),
        description: t("selfServices.statusUpdatedDescription"),
      });
    },
    
    /**
     * Callback ejecutado cuando ocurre un error durante el cambio de estado
     * @callback onError
     * @param {Error} error - Error ocurrido durante la petición
     */    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ================================================================================
  // RETORNO DEL HOOK
  // ================================================================================
  
  /**
   * Retorna las funciones y estados expuestos por el hook
   * @returns {Object} Objeto con funcionalidades del hook
   */
  return {
    /**
     * Lista de todos los autoservicios con información detallada
     * @property {SelfServiceWithDetails[] | undefined} selfServices
     * @description Incluye puntos de servicio y servicios asociados a cada autoservicio
     */
    selfServices,
    
    /**
     * Estado booleano que indica si se están cargando los autoservicios
     * @property {boolean} isLoading
     */
    isLoading,
    
    /**
     * Función para obtener un autoservicio específico por ID
     * @function getSelfService
     * @param {number} selfServiceId - ID del autoservicio a consultar
     * @returns {Object} Query object con los datos del autoservicio
     */
    getSelfService,
    
    /**
     * Función asíncrona para crear un nuevo autoservicio
     * @function createSelfService
     * @async
     * @param {CreateSelfServiceData} data - Datos del autoservicio a crear
     * @returns {Promise<Object>} Promesa que resuelve con el autoservicio creado
     */
    createSelfService: createSelfService.mutateAsync,
    
    /**
     * Función asíncrona para actualizar un autoservicio existente
     * @function updateSelfService
     * @async
     * @param {Object} params - Parámetros de actualización
     * @param {number} params.selfServiceId - ID del autoservicio
     * @param {UpdateSelfServiceData} params.data - Nuevos datos
     * @returns {Promise<Object>} Promesa que resuelve con el autoservicio actualizado
     */
    updateSelfService: updateSelfService.mutateAsync,
    
    /**
     * Función asíncrona para cambiar el estado de activación de un autoservicio
     * @function updateSelfServiceStatus
     * @async
     * @param {Object} params - Parámetros de cambio de estado
     * @param {number} params.selfServiceId - ID del autoservicio
     * @param {boolean} params.isActive - Nuevo estado de activación
     * @returns {Promise<Object>} Promesa que resuelve con la confirmación del cambio
     */
    updateSelfServiceStatus: updateSelfServiceStatus.mutateAsync,
  };
}
