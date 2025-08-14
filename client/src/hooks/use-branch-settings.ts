import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

/**
 * Hook personalizado para la gestión de configuraciones de sedes.
 * 
 * Este hook proporciona toda la funcionalidad necesaria para administrar
 * las configuraciones específicas de cada sede, incluyendo parámetros de
 * cancelación, reagendamiento, recordatorios, colas y modo de emergencia.
 * 
 * **Características principales:**
 * - Consulta de configuraciones por sede
 * - Creación de configuraciones iniciales
 * - Actualización de configuraciones existentes
 * - Eliminación (restaurar valores por defecto)
 * - Historial de cambios
 * - Toggle rápido de modo emergencia
 * - Resumen global para administradores
 * - Cache inteligente con React Query
 * - Notificaciones automáticas de éxito/error
 * - Internacionalización completa
 * 
 * @hook
 * @example
 * ```tsx
 * function BranchSettingsManager({ branchId }: { branchId: number }) {
 *   const {
 *     settings,
 *     isLoading,
 *     updateSettings,
 *     toggleEmergencyMode,
 *     resetToDefaults
 *   } = useBranchSettings(branchId);
 * 
 *   const handleEmergencyToggle = async (enabled: boolean) => {
 *     await toggleEmergencyMode.mutateAsync({ 
 *       enabled, 
 *       reason: "Situación de emergencia" 
 *     });
 *   };
 * 
 *   return (
 *     <div>
 *       <EmergencyModeToggle 
 *         enabled={settings?.emergencyMode || false}
 *         onToggle={handleEmergencyToggle}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * Configuración completa de una sede del sistema.
 * 
 * Define todos los parámetros configurables para el comportamiento específico
 * de una sede, incluyendo políticas de cancelación, reagendamiento, recordatorios,
 * notificaciones, horarios especiales, autoservicio y configuraciones de emergencia.
 * 
 * @interface BranchSettingsConfig
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * const config: BranchSettingsConfig = {
 *   cancellation: {
 *     allowCancellation: true,
 *     cancellationHours: 24,
 *     requireReason: false,
 *     sendConfirmationEmail: true
 *   },
 *   // ... resto de configuraciones
 * };
 * ```
 */
export interface BranchSettingsConfig {
  /** 
   * Configuración de políticas de cancelación de citas.
   * Define las reglas para permitir y gestionar cancelaciones.
   */
  cancellation: {
    /** Permite a los usuarios cancelar sus citas */
    allowCancellation: boolean;
    /** Número mínimo de horas antes de la cita para permitir cancelación */
    cancellationHours: number;
    /** Requiere que el usuario proporcione un motivo para la cancelación */
    requireReason: boolean;
    /** Envía email de confirmación al cancelar una cita */
    sendConfirmationEmail: boolean;
    /** Política de reembolso en texto libre (opcional) */
    refundPolicy?: string;
  };

  /** 
   * Configuración de políticas de reagendamiento de citas.
   * Define las reglas para reprogramar citas existentes.
   */
  rescheduling: {
    /** Permite a los usuarios reagendar sus citas */
    allowRescheduling: boolean;
    /** Número mínimo de horas antes de la cita para permitir reagendamiento */
    rescheduleTimeLimit: number;
    /** Número máximo de reagendamientos permitidos por cita */
    maxReschedules: number;
    /** Requiere que el usuario proporcione un motivo para el reagendamiento */
    requireReason: boolean;
    /** Envía email de confirmación al reagendar una cita */
    sendConfirmationEmail: boolean;
  };

  /** 
   * Configuración de políticas de reserva de citas.
   * Define las reglas para crear nuevas citas.
   */
  booking: {
    /** Número máximo de días de anticipación para reservar una cita */
    maxAdvanceBookingDays: number;
    /** Número mínimo de horas de anticipación para reservar una cita */
    minAdvanceBookingHours: number;
    /** Permite reservar citas para el mismo día */
    allowSameDayBooking: boolean;
    /** Requiere verificación de documentos para reservar */
    requireDocumentVerification: boolean;
    /** Número máximo de citas que puede tener un usuario simultáneamente */
    maxAppointmentsPerUser: number;
    /** Permite crear citas recurrentes */
    allowRecurringAppointments: boolean;
  };

  /** 
   * Configuración del sistema de recordatorios.
   * Define cómo y cuándo se envían recordatorios a los usuarios.
   */
  reminders: {
    /** Habilita el sistema de recordatorios general */
    enabled: boolean;
    /** Configuración de recordatorios por email */
    emailReminders: {
      /** Habilita recordatorios por email */
      enabled: boolean;
      /** Array de horas antes de la cita para enviar recordatorios */
      times: number[];
      /** Plantilla personalizada para el mensaje (opcional) */
      template?: string;
      /** Mensaje personalizado del recordatorio con placeholders */
      customMessage?: string;
    };
    /** Configuración opcional de recordatorios por SMS */
    smsReminders?: {
      /** Habilita recordatorios por SMS */
      enabled: boolean;
      /** Array de horas antes de la cita para enviar recordatorios */
      times: number[];
      /** Plantilla personalizada para el mensaje (opcional) */
      template?: string;
    };
    /** Configuración opcional de recordatorios por WhatsApp */
    whatsappReminders?: {
      /** Habilita recordatorios por WhatsApp */
      enabled: boolean;
      /** Array de horas antes de la cita para enviar recordatorios */
      times: number[];
      /** Plantilla personalizada para el mensaje (opcional) */
      template?: string;
    };
  };

  /** 
   * Configuración del sistema de notificaciones.
   * Define qué tipos de notificaciones se envían y por qué canales.
   */
  notifications: {
    /** Configuración de notificaciones de confirmación de cita */
    appointmentConfirmation: {
      /** Envía confirmación por email */
      email: boolean;
      /** Envía confirmación por SMS (opcional) */
      sms?: boolean;
      /** Envía confirmación por WhatsApp (opcional) */
      whatsapp?: boolean;
    };
    /** Configuración de notificaciones de recordatorio de cita */
    appointmentReminder: {
      /** Envía recordatorio por email */
      email: boolean;
      /** Envía recordatorio por SMS (opcional) */
      sms?: boolean;
      /** Envía recordatorio por WhatsApp (opcional) */
      whatsapp?: boolean;
    };
    /** Configuración de notificaciones para administradores */
    adminNotifications: {
      /** Notifica al admin sobre nuevas citas */
      newAppointment: boolean;
      /** Notifica al admin sobre cancelaciones */
      cancellation: boolean;
      /** Notifica al admin sobre inasistencias */
      noShow: boolean;
    };
  };

  /** 
   * Configuración de horarios especiales y excepciones.
   * Define días festivos y horarios excepcionales que afectan la disponibilidad.
   */
  specialSchedules: {
    /** Habilita el manejo de horarios especiales */
    enabled: boolean;
    /** Lista de días festivos */
    holidays: Array<{
      /** Fecha del día festivo (formato ISO) */
      date: string;
      /** Nombre del día festivo */
      name: string;
      /** Indica si la sede está cerrada ese día */
      closed: boolean;
      /** Horarios personalizados para ese día (opcional) */
      customHours?: {
        /** Hora de apertura */
        start: string;
        /** Hora de cierre */
        end: string;
      };
    }>;
    /** Lista de días excepcionales (no festivos pero con horarios especiales) */
    exceptionalDays: Array<{
      /** Fecha del día excepcional (formato ISO) */
      date: string;
      /** Motivo del día excepcional */
      reason: string;
      /** Indica si la sede está cerrada ese día */
      closed: boolean;
      /** Horarios personalizados para ese día (opcional) */
      customHours?: {
        /** Hora de apertura */
        start: string;
        /** Hora de cierre */
        end: string;
      };
    }>;
  };

  /** 
   * Configuración del sistema de autoservicio.
   * Define las opciones para kioscos y sistemas de autoatención.
   */
  selfService: {
    /** Habilita el sistema de autoservicio */
    enabled: boolean;
    /** Requiere registro de usuario para usar autoservicio */
    requireRegistration: boolean;
    /** Permite atención sin cita previa (walk-in) */
    allowWalkIn: boolean;
    /** Activa modo kiosco (pantalla completa, controles limitados) */
    kioskMode: boolean;
    /** Habilita impresión de tickets físicos */
    printTickets: boolean;
    /** Habilita tickets digitales (QR, email, SMS) */
    digitalTickets: boolean;
    /** Muestra estimación de tiempo de espera */
    estimateWaitTime: boolean;
  };

  /** 
   * Configuración del modo de emergencia.
   * Define comportamientos especiales durante situaciones críticas.
   */
  emergency: {
    /** Activa el modo de emergencia para la sede */
    mode: boolean;
    /** IDs de servicios que tienen prioridad durante emergencias */
    priorityServices: number[];
    /** Extiende los horarios de atención durante emergencias */
    extendedHours: boolean;
    /** Permite saltar colas durante emergencias */
    skipQueue: boolean;
    /** Contacto de emergencia (teléfono, email, etc.) */
    emergencyContact?: string;
  };
}

/**
 * Configuración completa de una sede con metadatos del sistema.
 * 
 * Incluye la configuración específica de la sede junto con información
 * de auditoría, versiones y estado general de la sede.
 * 
 * @interface BranchSettings
 * @since 1.0.0
 */
export interface BranchSettings {
  /** ID único de la configuración */
  id: number;
  /** ID de la sede a la que pertenece esta configuración */
  branchId: number;
  /** Configuración completa de la sede */
  settings: BranchSettingsConfig;
  /** Versión de la configuración (para control de cambios) */
  version: number;
  /** Horas mínimas para cancelación (campo legacy, usar settings.cancellation.cancellationHours) */
  cancellationHours: number;
  /** Límite de tiempo para reagendamiento (campo legacy, usar settings.rescheduling.rescheduleTimeLimit) */
  rescheduleTimeLimit: number;
  /** Días máximos de anticipación (campo legacy, usar settings.booking.maxAdvanceBookingDays) */
  maxAdvanceBookingDays: number;
  /** Estado de recordatorios (campo legacy, usar settings.reminders.enabled) */
  remindersEnabled: boolean;
  /** Horas de anticipación para recordatorios */
  reminderHours: number;
  /** Mensaje personalizado para recordatorios por email */
  reminderMessage: string | null;
  /** Estado del modo de emergencia (campo legacy, usar settings.emergency.mode) */
  emergencyMode: boolean;
  /** Indica si la sede está activa y acepta nuevas citas */
  isActive: boolean;
  /** Fecha y hora de creación de la configuración */
  createdAt: string;
  /** Fecha y hora de última actualización */
  updatedAt: string;
  /** ID del usuario que creó la configuración */
  createdBy: number | null;
  /** ID del usuario que actualizó la configuración por última vez */
  updatedBy: number | null;
}

/**
 * Respuesta del API para obtener configuraciones de una sede.
 * 
 * Incluye la configuración completa junto con información sobre
 * si la sede está usando valores por defecto o configuraciones personalizadas.
 * 
 * @interface BranchSettingsResponse
 * @since 1.0.0
 */
export interface BranchSettingsResponse {
  /** Configuración completa de la sede */
  settings: BranchSettings;
  /** Indica si la sede está usando configuración por defecto (true) o personalizada (false) */
  isDefault: boolean;
}

/**
 * Resumen de configuración de una sede específica.
 * 
 * Proporciona información consolidada sobre el estado y configuraciones
 * principales de una sede para su uso en vistas de resumen y dashboards.
 * 
 * @interface BranchSettingsSummary
 * @since 1.0.0
 */
export interface BranchSettingsSummary {
  /** ID único de la sede */
  branchId: number;
  /** Nombre de la sede */
  branchName: string;
  /** Indica si la sede tiene configuraciones personalizadas */
  hasCustomSettings: boolean;
  /** Indica si la sede está en modo de emergencia */
  isEmergencyMode: boolean;
  /** Configuraciones principales de la sede */
  configuration: {
    /** Horas mínimas para cancelación */
    cancellationHours: number;
    /** Límite de tiempo para reagendamiento */
    rescheduleTimeLimit: number;
    /** Días máximos de anticipación para reservas */
    maxAdvanceBookingDays: number;
    /** Estado de los recordatorios */
    remindersEnabled: boolean;
    /** Versión de la configuración */
    version: number;
    /** Fecha de última actualización */
    lastUpdated: string | null;
  };
}

/**
 * Respuesta del API para el resumen de configuraciones de todas las sedes.
 * 
 * Incluye un array con el resumen de cada sede y estadísticas globales
 * del sistema para uso en dashboards administrativos.
 * 
 * @interface BranchSettingsSummaryResponse
 * @since 1.0.0
 */
export interface BranchSettingsSummaryResponse {
  /** Array con el resumen de configuración de cada sede */
  summary: BranchSettingsSummary[];
  /** Estadísticas globales del sistema */
  statistics: {
    /** Total de sedes en el sistema */
    totalBranches: number;
    /** Número de sedes con configuraciones personalizadas */
    branchesWithCustomSettings: number;
    /** Número de sedes en modo de emergencia */
    branchesInEmergencyMode: number;
  };
}

/**
 * Datos para activar/desactivar el modo de emergencia.
 * 
 * @interface EmergencyModeToggleRequest
 * @since 1.0.0
 */
export interface EmergencyModeToggleRequest {
  /** `true` para activar modo emergencia, `false` para desactivar */
  enabled: boolean;
  /** Motivo opcional para el cambio (para auditoría) */
  reason?: string;
}

/**
 * Hook principal para gestionar configuraciones de una sede específica.
 * 
 * Proporciona acceso completo a las configuraciones de una sede, incluyendo
 * operaciones de consulta, creación, actualización, eliminación y toggle
 * de modo de emergencia. Maneja automáticamente el cache, validaciones
 * y notificaciones de usuario.
 * 
 * @param branchId - ID único de la sede a gestionar
 * @returns Objeto con datos y métodos para gestionar la configuración
 * 
 * @example
 * ```tsx
 * function BranchConfigPanel({ branchId }: { branchId: number }) {
 *   const {
 *     settings,
 *     isLoading,
 *     updateSettings,
 *     toggleEmergencyMode,
 *     resetToDefaults
 *   } = useBranchSettings(branchId);
 * 
 *   const handleSave = async (newConfig: Partial<BranchSettings>) => {
 *     await updateSettings.mutateAsync(newConfig);
 *   };
 * 
 *   if (isLoading) return <div>Cargando...</div>;
 * 
 *   return (
 *     <div>
 *       <ConfigForm 
 *         settings={settings}
 *         onSave={handleSave}
 *       />
 *       <EmergencyToggle
 *         enabled={settings?.emergencyMode}
 *         onToggle={(enabled) => toggleEmergencyMode.mutateAsync({ enabled })}
 *       />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @hook
 * @since 1.0.0
 */
export function useBranchSettings(branchId: number) {
  /** Hook de notificaciones para mostrar mensajes al usuario */
  const { toast } = useToast();
  
  /** Hook de traducción para internacionalización */
  const { t } = useTranslation();
  
  /** Cliente de React Query para invalidación de cache */
  const queryClient = useQueryClient();

  /**
   * Consulta principal para obtener configuraciones de la sede.
   * Se ejecuta automáticamente cuando el branchId está disponible.
   */
  const {
    data: settingsResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["branch-settings", branchId],
    queryFn: async (): Promise<BranchSettingsResponse> => {
      const response = await fetch(`/api/branches/${branchId}/settings`);
      if (!response.ok) {
        throw new Error(`Error fetching settings: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!branchId,
  });

  /**
   * Mutación para crear configuración inicial de una sede.
   * Se usa cuando la sede no tiene configuraciones personalizadas.
   */
  const createSettings = useMutation({
    mutationFn: async (settingsData: Partial<BranchSettings>) => {
      const response = await fetch(`/api/branches/${branchId}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response (POST):', errorData);
        const errorMessage = errorData.message || "Error creating settings";
        if (errorData.errors && errorData.errors.length > 0) {
          const detailedErrors = errorData.errors.map((err: any) => 
            `${err.field}: ${err.message}`
          ).join(', ');
          throw new Error(`${errorMessage}. Detalles: ${detailedErrors}`);
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-settings", branchId] });
      queryClient.invalidateQueries({ queryKey: ["branch-settings-summary"] });
      toast({
        title: t("success.title", "Éxito"),
        description: t("branchSettings.created", "Configuración creada exitosamente"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("error.title", "Error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Mutación para actualizar configuración existente de una sede.
   * Actualiza los datos y invalida el cache automáticamente.
   */
  const updateSettings = useMutation({
    mutationFn: async (settingsData: Partial<BranchSettings>) => {
      const response = await fetch(`/api/branches/${branchId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        const errorMessage = errorData.message || "Error updating settings";
        if (errorData.errors && errorData.errors.length > 0) {
          const detailedErrors = errorData.errors.map((err: any) => 
            `${err.field}: ${err.message}`
          ).join(', ');
          throw new Error(`${errorMessage}. Detalles: ${detailedErrors}`);
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-settings", branchId] });
      queryClient.invalidateQueries({ queryKey: ["branch-settings-summary"] });
      toast({
        title: t("success.title", "Éxito"),
        description: t("branchSettings.updated", "Configuración actualizada exitosamente"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("error.title", "Error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Mutación para eliminar configuración personalizada y restaurar valores por defecto.
   * Útil para revertir configuraciones específicas de una sede.
   */
  const resetToDefaults = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/branches/${branchId}/settings`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error resetting settings");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-settings", branchId] });
      queryClient.invalidateQueries({ queryKey: ["branch-settings-summary"] });
      toast({
        title: t("success.title", "Éxito"),
        description: t("branchSettings.reset", "Configuración restaurada a valores por defecto"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("error.title", "Error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Mutación para activar/desactivar el modo de emergencia de forma rápida.
   * Permite cambiar el estado de emergencia sin modificar otras configuraciones.
   */
  const toggleEmergencyMode = useMutation({
    mutationFn: async (data: EmergencyModeToggleRequest) => {
      const response = await fetch(`/api/branches/${branchId}/settings/emergency-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error toggling emergency mode");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["branch-settings", branchId] });
      queryClient.invalidateQueries({ queryKey: ["branch-settings-summary"] });
      toast({
        title: t("success.title", "Éxito"),
        description: t(
          data.emergencyMode ? "branchSettings.emergencyActivated" : "branchSettings.emergencyDeactivated",
          data.emergencyMode ? "Modo de emergencia activado" : "Modo de emergencia desactivado"
        ),
        variant: data.emergencyMode ? "destructive" : "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("error.title", "Error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    settings: settingsResponse?.settings,
    isDefault: settingsResponse?.isDefault,
    isLoading,
    error,
    refetch,
    createSettings,
    updateSettings,
    resetToDefaults,
    toggleEmergencyMode,
  };
}

/**
 * Hook para obtener el historial de cambios de configuración de una sede.
 * 
 * Proporciona acceso al historial completo de modificaciones realizadas
 * en la configuración de una sede específica, útil para auditoría y
 * seguimiento de cambios.
 * 
 * @param branchId - ID único de la sede
 * @returns Query con el historial de cambios de configuración
 * 
 * @example
 * ```tsx
 * function ConfigHistory({ branchId }: { branchId: number }) {
 *   const { data: history, isLoading } = useBranchSettingsHistory(branchId);
 * 
 *   if (isLoading) return <div>Cargando historial...</div>;
 * 
 *   return (
 *     <div>
 *       {history?.map(change => (
 *         <div key={change.id}>
 *           <p>{change.description}</p>
 *           <small>{new Date(change.createdAt).toLocaleString()}</small>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @hook
 * @since 1.0.0
 */
export function useBranchSettingsHistory(branchId: number) {
  const { toast } = useToast();
  const { t } = useTranslation();

  return useQuery({
    queryKey: ["branch-settings-history", branchId],
    queryFn: async () => {
      const response = await fetch(`/api/branches/${branchId}/settings/history`);
      if (!response.ok) {
        throw new Error(`Error fetching settings history: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!branchId,
  });
}

/**
 * Hook para obtener resumen de configuraciones de todas las sedes.
 * 
 * Proporciona un resumen consolidado de las configuraciones de todas las sedes
 * del sistema, incluyendo estadísticas globales. Diseñado para uso en dashboards
 * administrativos y vistas de resumen. Solo disponible para usuarios administradores.
 * 
 * @returns Query con resumen de configuraciones y estadísticas globales
 * 
 * @example
 * ```tsx
 * function AdminDashboard() {
 *   const { data, isLoading, error } = useBranchSettingsSummary();
 * 
 *   if (isLoading) return <div>Cargando resumen...</div>;
 *   if (error) return <div>Error al cargar datos</div>;
 * 
 *   return (
 *     <div>
 *       <h2>Estadísticas Globales</h2>
 *       <p>Total de sedes: {data?.statistics.totalBranches}</p>
 *       <p>En emergencia: {data?.statistics.branchesInEmergencyMode}</p>
 *       
 *       <h2>Resumen por Sede</h2>
 *       {data?.summary.map(branch => (
 *         <div key={branch.branchId}>
 *           <h3>{branch.branchName}</h3>
 *           <p>Emergencia: {branch.isEmergencyMode ? 'Sí' : 'No'}</p>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @hook
 * @since 1.0.0
 * @permissions admin - Solo usuarios administradores pueden acceder
 */
export function useBranchSettingsSummary() {
  const { toast } = useToast();
  const { t } = useTranslation();

  return useQuery({
    queryKey: ["branch-settings-summary"],
    queryFn: async (): Promise<BranchSettingsSummaryResponse> => {
      const response = await fetch("/api/settings/branches/summary");
      if (!response.ok) {
        throw new Error(`Error fetching settings summary: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
