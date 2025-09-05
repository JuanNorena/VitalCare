import { db } from "@db";
import { branchSettings, branches } from "@db/schema";
import { eq } from "drizzle-orm";
import type { BranchSettingsConfig, BranchSettingsWithConfig } from "@db/schema";

/**
 * Servicio para la gestión integral de configuraciones específicas por sede.
 * 
 * Esta clase proporciona métodos para manejar todas las configuraciones relacionadas
 * con el comportamiento específico de cada sede, incluyendo políticas de cancelación,
 * reagendamiento, recordatorios, notificaciones y configuraciones de emergencia.
 * 
 * @example
 * ```typescript
 * // Obtener configuración de una sede
 * const config = await BranchSettingsService.getBranchSettings(1);
 * 
 * // Verificar si está en modo emergencia
 * const isEmergency = await BranchSettingsService.isBranchInEmergencyMode(1);
 * 
 * // Activar modo emergencia
 * await BranchSettingsService.toggleEmergencyMode(1, true, userId);
 * ```
 * 
 * @since 1.0.0
 */
export class BranchSettingsService {
  
  /**
   * Obtiene la configuración completa de una sede específica.
   * 
   * Si la sede no tiene configuración personalizada, retorna la configuración
   * por defecto del sistema. Incluye todos los parámetros de configuración
   * como políticas de cancelación, reagendamiento, recordatorios y notificaciones.
   * 
   * @param branchId - ID único de la sede
   * @returns Promesa que resuelve con la configuración completa de la sede
   * 
   * @example
   * ```typescript
   * const settings = await BranchSettingsService.getBranchSettings(1);
   * console.log(settings.config.cancellation.cancellationHours); // 24
   * ```
   * 
   * @throws {Error} Si ocurre un error al acceder a la base de datos
   * @since 1.0.0
   */
  static async getBranchSettings(branchId: number): Promise<BranchSettingsWithConfig> {
    const [settings] = await db
      .select()
      .from(branchSettings)
      .where(eq(branchSettings.branchId, branchId))
      .limit(1);

    if (!settings) {
      // Retornar configuración por defecto
      return {
        id: 0,
        branchId: branchId,
        settings: BranchSettingsService.getDefaultSettings(),
        version: 1,
        cancellationHours: 24,
        rescheduleTimeLimit: 4,
        maxAdvanceBookingDays: 30,
        remindersEnabled: true,
        reminderHours: 24, // Agregar campo faltante
        reminderMessage: null, // Agregar campo de mensaje personalizado
        emergencyMode: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
        config: BranchSettingsService.getDefaultSettings()
      };
    }

    return {
      ...settings,
      config: settings.settings as BranchSettingsConfig
    };
  }

  /**
   * Genera la configuración por defecto del sistema.
   * 
   * Proporciona una configuración base con valores predeterminados para todas
   * las secciones: cancelaciones, reagendamiento, reservas, recordatorios,
   * notificaciones, horarios especiales, autoservicio y modo de emergencia.
   * 
   * @returns Objeto con la configuración por defecto completa
   * 
   * @example
   * ```typescript
   * const defaultConfig = BranchSettingsService.getDefaultSettings();
   * console.log(defaultConfig.cancellation.cancellationHours); // 24
   * console.log(defaultConfig.reminders.enabled); // true
   * ```
   * 
   * @since 1.0.0
   */
  static getDefaultSettings(): BranchSettingsConfig {
    return {
      cancellation: {
        allowCancellation: true,
        cancellationHours: 24,
        requireReason: false,
        sendConfirmationEmail: true,
        refundPolicy: "Política de reembolso estándar"
      },
      rescheduling: {
        allowRescheduling: true,
        rescheduleTimeLimit: 4,
        maxReschedules: 3,
        requireReason: false,
        sendConfirmationEmail: true
      },
      booking: {
        maxAdvanceBookingDays: 30,
        minAdvanceBookingHours: 2,
        allowSameDayBooking: true,
        requireDocumentVerification: false,
        maxAppointmentsPerUser: 5,
        allowRecurringAppointments: false
      },
      reminders: {
        enabled: true,
        emailReminders: {
          enabled: true,
          times: [24, 2],
          template: "Recordatorio de cita: {{serviceName}} el {{date}} a las {{time}}",
          customMessage: "Estimado/a {{userName}},\n\nLe recordamos que tiene una cita programada:\n\n📅 Servicio: {{serviceName}}\n📍 Fecha: {{date}}\n⏰ Hora: {{time}}\n🏢 Sede: {{branchName}}\n📍 Dirección: {{branchAddress}}\n📞 Teléfono: {{branchPhone}}\n\nCódigo de confirmación: {{confirmationCode}}\n\n¡Le esperamos!"
        }
      },
      notifications: {
        appointmentConfirmation: {
          email: true,
          sms: false,
          whatsapp: false
        },
        appointmentReminder: {
          email: true,
          sms: false,
          whatsapp: false
        },
        adminNotifications: {
          newAppointment: true,
          cancellation: true,
          noShow: true
        }
      },
      specialSchedules: {
        enabled: false,
        holidays: [],
        exceptionalDays: []
      },
      selfService: {
        enabled: true,
        requireRegistration: true,
        allowWalkIn: false,
        kioskMode: false,
        printTickets: false,
        digitalTickets: true,
        estimateWaitTime: true
      },
      emergency: {
        mode: false,
        priorityServices: [],
        extendedHours: false,
        skipQueue: false,
        emergencyContact: undefined
      }
    };
  }

  /**
   * Verifica si una sede específica está en modo de emergencia.
   * 
   * El modo de emergencia permite relajar ciertas restricciones y habilitar
   * funcionalidades especiales para situaciones críticas.
   * 
   * @param branchId - ID único de la sede a verificar
   * @returns Promesa que resuelve con `true` si está en modo emergencia, `false` en caso contrario
   * 
   * @example
   * ```typescript
   * const isEmergency = await BranchSettingsService.isBranchInEmergencyMode(1);
   * if (isEmergency) {
   *   console.log("Sede en modo emergencia");
   * }
   * ```
   * 
   * @since 1.0.0
   */
  static async isBranchInEmergencyMode(branchId: number): Promise<boolean> {
    const settings = await BranchSettingsService.getBranchSettings(branchId);
    return settings.emergencyMode;
  }

  /**
   * Obtiene las horas mínimas requeridas para cancelar una cita en una sede específica.
   * 
   * @param branchId - ID único de la sede
   * @returns Promesa que resuelve con el número de horas mínimas para cancelación
   * 
   * @example
   * ```typescript
   * const hours = await BranchSettingsService.getBranchCancellationHours(1);
   * console.log(`Debe cancelar con ${hours} horas de anticipación`);
   * ```
   * 
   * @since 1.0.0
   */
  static async getBranchCancellationHours(branchId: number): Promise<number> {
    const settings = await BranchSettingsService.getBranchSettings(branchId);
    return settings.cancellationHours;
  }

  /**
   * Obtiene el límite de tiempo en horas para reagendar una cita en una sede específica.
   * 
   * @param branchId - ID único de la sede
   * @returns Promesa que resuelve con el número de horas límite para reagendamiento
   * 
   * @example
   * ```typescript
   * const timeLimit = await BranchSettingsService.getBranchRescheduleTimeLimit(1);
   * console.log(`Puede reagendar hasta ${timeLimit} horas antes`);
   * ```
   * 
   * @since 1.0.0
   */
  static async getBranchRescheduleTimeLimit(branchId: number): Promise<number> {
    const settings = await BranchSettingsService.getBranchSettings(branchId);
    return settings.rescheduleTimeLimit;
  }

  /**
   * Verifica si los recordatorios automáticos están habilitados para una sede específica.
   * 
   * @param branchId - ID único de la sede
   * @returns Promesa que resuelve con `true` si los recordatorios están habilitados, `false` en caso contrario
   * 
   * @example
   * ```typescript
   * const remindersEnabled = await BranchSettingsService.areBranchRemindersEnabled(1);
   * if (remindersEnabled) {
   *   console.log("Se enviarán recordatorios automáticos");
   * }
   * ```
   * 
   * @since 1.0.0
   */
  static async areBranchRemindersEnabled(branchId: number): Promise<boolean> {
    const settings = await BranchSettingsService.getBranchSettings(branchId);
    return settings.remindersEnabled;
  }

  /**
   * Obtiene las horas de anticipación configuradas para enviar recordatorios automáticos.
   * 
   * @param branchId - ID único de la sede
   * @returns Promesa que resuelve con el número de horas de anticipación para recordatorios
   * 
   * @example
   * ```typescript
   * const reminderHours = await BranchSettingsService.getBranchReminderHours(1);
   * console.log(`Se enviarán recordatorios ${reminderHours} horas antes de la cita`);
   * ```
   * 
   * @since 1.0.0
   */
  static async getBranchReminderHours(branchId: number): Promise<number> {
    const settings = await BranchSettingsService.getBranchSettings(branchId);
    return settings.reminderHours;
  }

  /**
   * Obtiene el mensaje personalizado configurado para recordatorios por email.
   * 
   * @param branchId - ID único de la sede
   * @returns Promesa que resuelve con el mensaje personalizado o mensaje por defecto
   * 
   * @example
   * ```typescript
   * const message = await BranchSettingsService.getBranchReminderMessage(1);
   * console.log(`Mensaje de recordatorio: ${message}`);
   * ```
   * 
   * @since 1.0.0
   */
  static async getBranchReminderMessage(branchId: number): Promise<string> {
    const settings = await BranchSettingsService.getBranchSettings(branchId);
    
    // Verificar si hay mensaje personalizado en el campo directo
    if (settings.reminderMessage) {
      return settings.reminderMessage;
    }

    // Verificar si hay mensaje personalizado en la configuración JSON
    const config = settings.config || BranchSettingsService.getDefaultSettings();
    if (config.reminders?.emailReminders?.customMessage) {
      return config.reminders.emailReminders.customMessage;
    }

    // Retornar mensaje por defecto
    const defaultConfig = BranchSettingsService.getDefaultSettings();
    return defaultConfig.reminders.emailReminders.customMessage || 
           "Estimado/a {{userName}},\n\nLe recordamos que tiene una cita programada:\n\n📅 Servicio: {{serviceName}}\n📍 Fecha: {{date}}\n⏰ Hora: {{time}}\n🏢 Sede: {{branchName}}\n📍 Dirección: {{branchAddress}}\n📞 Teléfono: {{branchPhone}}\n\nCódigo de confirmación: {{confirmationCode}}\n\n¡Le esperamos!";
  }

  /**
   * Obtiene el número máximo de días de anticipación para reservar citas en una sede específica.
   * 
   * @param branchId - ID único de la sede
   * @returns Promesa que resuelve con el número máximo de días de anticipación permitidos
   * 
   * @example
   * ```typescript
   * const maxDays = await BranchSettingsService.getBranchMaxAdvanceBookingDays(1);
   * console.log(`Puede reservar hasta ${maxDays} días de anticipación`);
   * ```
   * 
   * @since 1.0.0
   */
  static async getBranchMaxAdvanceBookingDays(branchId: number): Promise<number> {
    const settings = await BranchSettingsService.getBranchSettings(branchId);
    return settings.maxAdvanceBookingDays;
  }

  /**
   * Verifica si una funcionalidad específica está habilitada para una sede.
   * 
   * Permite consultar el estado de diferentes características del sistema
   * como cancelaciones, reagendamiento, recordatorios, autoservicio, etc.
   * 
   * @param branchId - ID único de la sede
   * @param feature - Característica a verificar (cancellation, rescheduling, reminders, selfService, specialSchedules)
   * @returns Promesa que resuelve con `true` si la característica está habilitada, `false` en caso contrario
   * 
   * @example
   * ```typescript
   * const canCancel = await BranchSettingsService.isBranchFeatureEnabled(1, 'cancellation');
   * const hasReminders = await BranchSettingsService.isBranchFeatureEnabled(1, 'reminders');
   * 
   * if (canCancel) {
   *   console.log("Cancelaciones permitidas");
   * }
   * ```
   * 
   * @since 1.0.0
   */
  static async isBranchFeatureEnabled(
    branchId: number, 
    feature: keyof BranchSettingsConfig
  ): Promise<boolean> {
    const settings = await BranchSettingsService.getBranchSettings(branchId);
    const config = settings.config || BranchSettingsService.getDefaultSettings();
    
    switch (feature) {
      case 'cancellation':
        return config.cancellation.allowCancellation;
      case 'rescheduling':
        return config.rescheduling.allowRescheduling;
      case 'reminders':
        return config.reminders.enabled;
      case 'selfService':
        return config.selfService.enabled;
      case 'specialSchedules':
        return config.specialSchedules.enabled;
      default:
        return false;
    }
  }

  /**
   * Activa o desactiva el modo de emergencia para una sede específica de forma rápida.
   * 
   * El modo de emergencia permite modificar el comportamiento del sistema durante
   * situaciones críticas, relajando ciertas restricciones y habilitando funcionalidades
   * especiales. Si la sede no tiene configuración previa, se crea una nueva.
   * 
   * @param branchId - ID único de la sede
   * @param enabled - `true` para activar modo emergencia, `false` para desactivar
   * @param userId - ID del usuario que realiza el cambio (para auditoría)
   * 
   * @example
   * ```typescript
   * // Activar modo emergencia
   * await BranchSettingsService.toggleEmergencyMode(1, true, userId);
   * 
   * // Desactivar modo emergencia
   * await BranchSettingsService.toggleEmergencyMode(1, false, userId);
   * ```
   * 
   * @throws {Error} Si ocurre un error al actualizar la base de datos
   * @since 1.0.0
   */
  static async toggleEmergencyMode(
    branchId: number, 
    enabled: boolean, 
    userId: number
  ): Promise<void> {
    const [existingSettings] = await db
      .select()
      .from(branchSettings)
      .where(eq(branchSettings.branchId, branchId))
      .limit(1);

    if (!existingSettings) {
      // Crear configuración nueva con modo de emergencia
      await db
        .insert(branchSettings)
        .values({
          branchId: branchId,
          settings: BranchSettingsService.getDefaultSettings(),
          emergencyMode: enabled,
          createdBy: userId,
          updatedBy: userId
        });
    } else {
      // Actualizar configuración existente
      await db
        .update(branchSettings)
        .set({
          emergencyMode: enabled,
          version: existingSettings.version + 1,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(eq(branchSettings.branchId, branchId));
    }
  }

  /**
   * Valida la estructura y contenido de una configuración JSON de sede.
   * 
   * Verifica que la configuración tenga todas las secciones requeridas y que
   * los valores de configuración críticos sean válidos (tipos correctos y
   * valores dentro de rangos permitidos).
   * 
   * @param config - Objeto de configuración a validar
   * @returns Objeto con el resultado de la validación que incluye:
   *   - `isValid`: `true` si la configuración es válida, `false` en caso contrario
   *   - `errors`: Array de mensajes de error encontrados (vacío si es válida)
   * 
   * @example
   * ```typescript
   * const config = {
   *   cancellation: { cancellationHours: 24 },
   *   rescheduling: { rescheduleTimeLimit: 4 },
   *   // ... resto de configuración
   * };
   * 
   * const validation = BranchSettingsService.validateSettingsConfig(config);
   * if (!validation.isValid) {
   *   console.log("Errores encontrados:", validation.errors);
   * }
   * ```
   * 
   * @since 1.0.0
   */
  static validateSettingsConfig(config: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validaciones básicas
    if (!config || typeof config !== 'object') {
      errors.push('La configuración debe ser un objeto válido');
      return { isValid: false, errors };
    }

    // Validar secciones requeridas
    const requiredSections = ['cancellation', 'rescheduling', 'booking', 'reminders', 'notifications', 'selfService', 'emergency'];
    
    for (const section of requiredSections) {
      if (!config[section]) {
        errors.push(`Falta la sección requerida: ${section}`);
      }
    }

    // Validaciones específicas
    if (config.cancellation) {
      if (typeof config.cancellation.cancellationHours !== 'number' || config.cancellation.cancellationHours < 0) {
        errors.push('Las horas de cancelación deben ser un número positivo');
      }
    }

    if (config.rescheduling) {
      if (typeof config.rescheduling.rescheduleTimeLimit !== 'number' || config.rescheduling.rescheduleTimeLimit < 0) {
        errors.push('El límite de tiempo para reagendamiento debe ser un número positivo');
      }
    }

    if (config.booking) {
      if (typeof config.booking.maxAdvanceBookingDays !== 'number' || config.booking.maxAdvanceBookingDays < 1) {
        errors.push('Los días máximos de anticipación deben ser un número positivo');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default BranchSettingsService;
