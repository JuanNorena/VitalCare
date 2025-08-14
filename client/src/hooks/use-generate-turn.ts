import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

/**
 * Datos requeridos para generar un turno
 * @interface GenerateTurnRequest
 */
interface GenerateTurnRequest {
  /** ID del servicio para el cual se genera el turno */
  serviceId: number;
  /** ID del punto de servicio donde se atenderá el turno */
  servicePointId: number;
  /** Datos adicionales del formulario dinámico del servicio (opcional) */
  formData?: Record<string, any>;
}

/**
 * Respuesta del servidor al generar un turno exitosamente
 * @interface GenerateTurnResponse
 */
interface GenerateTurnResponse {
  /** Información de la cita generada */
  appointment: {
    /** ID único de la cita */
    id: number;
    /** Código de confirmación único para la cita */
    confirmationCode: string;
    /** Fecha y hora programada para la cita */
    scheduledAt: string;
    /** ID del servicio asociado */
    serviceId: number;
    /** ID del punto de servicio asociado */
    servicePointId: number;
    /** Datos del formulario dinámico completado (opcional) */
    formData?: Record<string, any>;
  };
  /** Información de la entrada en cola */
  queueEntry: {
    /** ID único de la entrada en cola */
    id: number;
    /** ID de la cita asociada */
    appointmentId: number;
    /** Número de turno asignado */
    counter: number;
    /** Estado actual del turno en cola */
    status: string;
    /** Fecha y hora de creación del turno */
    createdAt: string;
  };
  /** Posición actual en la cola de espera */
  queuePosition: number;
  /** Tiempo estimado de espera en minutos */
  estimatedWait: number;
  /** Información del punto de servicio */
  servicePoint: {
    /** ID del punto de servicio */
    id: number;
    /** Nombre del punto de servicio */
    name: string;
    /** Descripción del punto de servicio (opcional) */
    description?: string;
  };
  /** Información del servicio */
  service: {
    /** ID del servicio */
    id: number;
    /** Nombre del servicio */
    name: string;
    /** Descripción del servicio (opcional) */
    description?: string;
    /** Duración estimada del servicio en minutos */
    duration: number;
  };
}

/**
 * Hook personalizado para gestionar la generación de turnos inmediatos
 * 
 * Este hook proporciona funcionalidad para crear turnos inmediatos sin necesidad de 
 * programación de fecha/hora, integrándose con el sistema de colas y autoservicios.
 * 
 * @hook
 * @returns {Object} Objeto con funciones y estados para la generación de turnos
 * @returns {Function} generateTurn - Función para generar un turno
 * @returns {boolean} isGenerating - Estado que indica si se está generando un turno
 * 
 * @example
 * ```tsx
 * const { generateTurn, isGenerating } = useGenerateTurn();
 * 
 * const handleGenerateTurn = async () => {
 *   try {
 *     const result = await generateTurn({
 *       serviceId: 1,
 *       servicePointId: 2,
 *       formData: { nombre: "Juan", telefono: "123456789" }
 *     });
 *     console.log('Turno generado:', result.queueEntry.counter);
 *   } catch (error) {
 *     console.error('Error al generar turno:', error);
 *   }
 * };
 * ```
 * 
 * @author Sistema de Gestión de Atención Plus
 * @since 1.0.0
 * @version 1.0.0
 */
export function useGenerateTurn() {  // ================================================================================
  // HOOKS DE REACT QUERY Y UTILIDADES
  // ================================================================================
  
  /** Cliente de React Query para invalidación de consultas */
  const queryClient = useQueryClient();
  
  /** Hook para mostrar notificaciones toast */
  const { toast } = useToast();
  
  /** Hook para internacionalización de textos */
  const { t } = useTranslation();

  // ================================================================================
  // MUTACIÓN PRINCIPAL PARA GENERACIÓN DE TURNOS
  // ================================================================================
  
  /**
   * Mutación para generar un turno inmediato
   * @function generateTurnMutation
   * @async
   */
  const generateTurnMutation = useMutation({
    /**
     * Función principal que realiza la petición HTTP para generar el turno
     * @async
     * @function mutationFn
     * @param {GenerateTurnRequest} data - Datos necesarios para generar el turno
     * @returns {Promise<GenerateTurnResponse>} Respuesta con información del turno generado
     * @throws {Error} Error si la petición falla o el servidor responde con error
     */
    mutationFn: async (data: GenerateTurnRequest): Promise<GenerateTurnResponse> => {
      const response = await fetch("/api/generate-turn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error generating turn");
      }

      return response.json();
    },
    
    /**
     * Callback ejecutado cuando la generación del turno es exitosa
     * @callback onSuccess
     * @description Invalida las consultas relacionadas para refrescar los datos en cache
     */
    onSuccess: () => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
    },
    
    /**
     * Callback ejecutado cuando ocurre un error durante la generación
     * @callback onError
     * @param {Error} error - Error ocurrido durante la petición
     * @description Muestra una notificación de error al usuario
     */
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
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
     * Función asíncrona para generar un turno
     * @function generateTurn
     * @async
     * @param {GenerateTurnRequest} data - Datos del turno a generar
     * @returns {Promise<GenerateTurnResponse>} Promesa que resuelve con la información del turno
     */
    generateTurn: generateTurnMutation.mutateAsync,
    
    /**
     * Estado booleano que indica si se está procesando la generación de un turno
     * @property {boolean} isGenerating
     */
    isGenerating: generateTurnMutation.isPending,
  };
}
