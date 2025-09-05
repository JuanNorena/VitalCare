import { db } from '@db';
import { branchSettings } from '@db/schema';
import { eq } from 'drizzle-orm';
import { BranchSettingsService } from './branch-settings';

/**
 * Resultado de validación de operación de citas
 * @interface ValidationResult
 */
interface ValidationResult {
  /** Indica si la operación es válida */
  isValid: boolean;
  /** Mensaje de error si la validación falla */
  message?: string;
  /** Código de error para el frontend */
  errorCode?: string;
}

/**
 * Datos de configuración de una sede para validaciones
 * @interface BranchValidationConfig
 */
interface BranchValidationConfig {
  /** Días máximos de anticipación para reservar */
  maxAdvanceBookingDays: number;
  /** Horas mínimas antes de la cita para cancelar */
  minCancellationHours: number;
  /** Horas mínimas antes de la cita para reprogramar */
  minRescheduleHours: number;
  /** Máximo número de reprogramaciones permitidas */
  maxReschedules: number;
  /** Indica si están habilitados los recordatorios automáticos */
  enableAutoReminders: boolean;
  /** Horas antes de la cita para enviar recordatorio */
  reminderHours: number;
}

/**
 * Servicio de validación de operaciones de citas
 * 
 * Este servicio maneja todas las validaciones relacionadas con las operaciones
 * de citas (creación, cancelación, reprogramación) basándose en las configuraciones
 * específicas de cada sede.
 * 
 * @class AppointmentValidationService
 * @version 1.0.0
 * 
 * @example
 * ```typescript
 * // Validar cancelación
 * const result = await appointmentValidation.validateCancellation(
 *   appointmentDate, 
 *   branchId
 * );
 * 
 * if (!result.isValid) {
 *   return res.status(400).json({ message: result.message });
 * }
 * ```
 */
class AppointmentValidationService {
  
  /**
   * Obtiene la configuración de validación para una sede
   * 
   * Recupera las configuraciones específicas de una sede desde la base de datos
   * y las mapea a un objeto de configuración de validación.
   * 
   * @private
   * @param {number} branchId - ID de la sede
   * @returns {Promise<BranchValidationConfig>} Configuración de validación de la sede
   * @throws {Error} Si no se puede obtener la configuración
   * 
   * @example
   * ```typescript
   * const config = await this.getBranchValidationConfig(1);
   * console.log(`Máximo días de anticipación: ${config.maxAdvanceBookingDays}`);
   * ```
   */
  private async getBranchValidationConfig(branchId: number): Promise<BranchValidationConfig> {
    try {
      const [settings] = await db
        .select()
        .from(branchSettings)
        .where(eq(branchSettings.branchId, branchId))
        .limit(1);

      if (!settings) {
        // Configuración por defecto si no existe configuración específica
        return {
          maxAdvanceBookingDays: 30,
          minCancellationHours: 24,
          minRescheduleHours: 24,
          maxReschedules: 3,
          enableAutoReminders: false,
          reminderHours: 24
        };
      }

      return {
        maxAdvanceBookingDays: settings.maxAdvanceBookingDays || 30,
        minCancellationHours: settings.cancellationHours || 24,
        minRescheduleHours: settings.rescheduleTimeLimit || 24,
        maxReschedules: 3, // Este valor podríamos agregarlo al schema más adelante
        enableAutoReminders: settings.remindersEnabled || false,
        reminderHours: settings.reminderHours || 24
      };
    } catch (error) {
      console.error('Error obteniendo configuración de sede:', error);
      // Devolver configuración por defecto en caso de error
      return {
        maxAdvanceBookingDays: 30,
        minCancellationHours: 24,
        minRescheduleHours: 24,
        maxReschedules: 3,
        enableAutoReminders: false,
        reminderHours: 24
      };
    }
  }

  /**
   * Valida si una nueva cita puede ser reservada
   * 
   * Verifica que la fecha de la cita esté dentro del rango permitido
   * de días de anticipación configurado para la sede.
   * 
   * @public
   * @param {Date} appointmentDate - Fecha y hora de la cita a validar
   * @param {number} branchId - ID de la sede donde se reserva la cita
   * @returns {Promise<ValidationResult>} Resultado de la validación
   * 
   * @example
   * ```typescript
   * const futureDate = new Date('2024-02-15 10:00:00');
   * const result = await appointmentValidation.validateBooking(futureDate, 1);
   * 
   * if (!result.isValid) {
   *   console.log('Error:', result.message);
   * }
   * ```
   */
  async validateBooking(appointmentDate: Date, branchId: number): Promise<ValidationResult> {
    try {
      const config = await this.getBranchValidationConfig(branchId);
      const now = new Date();
      const maxAdvanceDate = new Date();
      maxAdvanceDate.setDate(now.getDate() + config.maxAdvanceBookingDays);

      // Verificar que la fecha no sea en el pasado
      if (appointmentDate <= now) {
        return {
          isValid: false,
          message: 'La fecha de la cita debe ser futura',
          errorCode: 'PAST_DATE'
        };
      }

      // Verificar que no exceda el máximo de días de anticipación
      if (appointmentDate > maxAdvanceDate) {
        return {
          isValid: false,
          message: `Las citas solo pueden reservarse con máximo ${config.maxAdvanceBookingDays} días de anticipación`,
          errorCode: 'EXCEEDS_MAX_ADVANCE'
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error validando reserva:', error);
      return {
        isValid: false,
        message: 'Error interno al validar la reserva',
        errorCode: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Valida si una cita puede ser cancelada
   * 
   * Verifica las reglas de cancelación según la configuración de la sede y los privilegios del usuario.
   * Los administradores pueden cancelar cualquier cita sin restricciones de tiempo o fecha,
   * incluyendo citas que ya pasaron. Los usuarios regulares deben respetar las políticas
   * de cancelación de la sede (tiempo mínimo de anticipación y no cancelar citas pasadas).
   * 
   * @public
   * @param {Date} appointmentDate - Fecha y hora de la cita a cancelar
   * @param {number} branchId - ID de la sede de la cita
   * @param {string} userRole - Rol del usuario que cancela ('admin', 'user', etc.)
   * @returns {Promise<ValidationResult>} Resultado de la validación
   * 
   * @example
   * ```typescript
   * // Administrador cancelando una cita pasada (permitido)
   * const pastDate = new Date('2024-01-15 14:00:00');
   * const adminResult = await appointmentValidation.validateCancellation(pastDate, 1, 'admin');
   * console.log(adminResult.isValid); // true
   * 
   * // Usuario regular cancelando una cita pasada (no permitido)
   * const userResult = await appointmentValidation.validateCancellation(pastDate, 1, 'user');
   * console.log(userResult.isValid); // false
   * ```
   */
  async validateCancellation(appointmentDate: Date, branchId: number, userRole?: string): Promise<ValidationResult> {
    try {
      const now = new Date();
      
      // Los administradores pueden cancelar cualquier cita sin restricciones
      // Esto incluye citas pasadas, presentes o futuras
      if (userRole === 'admin') {
        return { 
          isValid: true,
          message: 'Cancelación autorizada por privilegios de administrador'
        };
      }

      // Para usuarios regulares, aplicar todas las restricciones de negocio
      
      // Verificar que no sea una cita en el pasado
      if (appointmentDate <= now) {
        return {
          isValid: false,
          message: 'No se puede cancelar una cita que ya pasó',
          errorCode: 'PAST_APPOINTMENT'
        };
      }

      const config = await this.getBranchValidationConfig(branchId);
      
      // Calcular cuánto tiempo falta hasta la cita
      const timeUntilAppointment = appointmentDate.getTime() - now.getTime();
      const hoursUntilAppointment = timeUntilAppointment / (60 * 60 * 1000);

      // Verificar tiempo mínimo de cancelación para usuarios regulares
      if (hoursUntilAppointment < config.minCancellationHours) {
        return {
          isValid: false,
          message: `Las citas deben cancelarse con al menos ${config.minCancellationHours} horas de anticipación`,
          errorCode: 'INSUFFICIENT_CANCELLATION_TIME'
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error validando cancelación:', error);
      return {
        isValid: false,
        message: 'Error interno al validar la cancelación',
        errorCode: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Valida si una cita puede ser reprogramada
   * 
   * Verifica múltiples condiciones: tiempo mínimo de anticipación,
   * número máximo de reprogramaciones permitidas, y que la nueva fecha
   * sea válida para reserva. Los administradores pueden reagendar cualquier cita
   * sin restricciones, incluyendo citas que ya pasaron.
   * 
   * @public
   * @param {Date} currentAppointmentDate - Fecha actual de la cita
   * @param {Date} newAppointmentDate - Nueva fecha propuesta
   * @param {number} branchId - ID de la sede de la cita
   * @param {number} currentRescheduleCount - Número actual de reprogramaciones
   * @param {string} userRole - Rol del usuario que reagenda ('admin', 'user', etc.)
   * @returns {Promise<ValidationResult>} Resultado de la validación
   * 
   * @example
   * ```typescript
   * // Administrador reagendando una cita pasada (permitido)
   * const pastDate = new Date('2024-01-15 14:00:00');
   * const newDate = new Date('2024-01-25 16:00:00');
   * const adminResult = await appointmentValidation.validateReschedule(
   *   pastDate, newDate, 1, 1, 'admin'
   * );
   * console.log(adminResult.isValid); // true
   * 
   * // Usuario regular reagendando una cita pasada (no permitido)
   * const userResult = await appointmentValidation.validateReschedule(
   *   pastDate, newDate, 1, 1, 'user'
   * );
   * console.log(userResult.isValid); // false
   * ```
   */
  async validateReschedule(
    currentAppointmentDate: Date, 
    newAppointmentDate: Date, 
    branchId: number, 
    currentRescheduleCount: number = 0,
    userRole?: string
  ): Promise<ValidationResult> {
    try {
      const now = new Date();
      
      // Los administradores pueden reagendar cualquier cita sin restricciones
      // Esto incluye citas pasadas, presentes o futuras
      if (userRole === 'admin') {
        // Solo validar que la nueva fecha sea válida para reserva
        const newDateValidation = await this.validateBooking(newAppointmentDate, branchId);
        if (!newDateValidation.isValid) {
          return newDateValidation;
        }
        
        return { 
          isValid: true,
          message: 'Reagendamiento autorizado por privilegios de administrador'
        };
      }

      // Para usuarios regulares, aplicar todas las restricciones de negocio
      
      // Verificar que no sea una cita en el pasado
      if (currentAppointmentDate <= now) {
        return {
          isValid: false,
          message: 'No se puede reprogramar una cita que ya pasó',
          errorCode: 'PAST_APPOINTMENT'
        };
      }

      const config = await this.getBranchValidationConfig(branchId);
      
      // NUEVA LÓGICA: Validar que la nueva fecha respete el tiempo mínimo desde AHORA
      // Calcular la fecha mínima permitida para reagendar (ahora + horas mínimas)
      const minAllowedRescheduleDate = new Date(now.getTime() + (config.minRescheduleHours * 60 * 60 * 1000));

      // Verificar que la nueva fecha respete el tiempo mínimo de anticipación
      if (newAppointmentDate < minAllowedRescheduleDate) {
        return {
          isValid: false,
          message: `La nueva fecha debe ser al menos ${config.minRescheduleHours} horas después del momento actual`,
          errorCode: 'INSUFFICIENT_RESCHEDULE_TIME'
        };
      }

      // VALIDACIÓN ADICIONAL: Verificar que aún hay tiempo para reagendar la cita ACTUAL
      // Solo si la cita actual está en el futuro y cerca del límite
      const timeUntilCurrentAppointment = currentAppointmentDate.getTime() - now.getTime();
      const minTimeToAllowReschedule = config.minRescheduleHours * 60 * 60 * 1000;
      
      if (timeUntilCurrentAppointment < minTimeToAllowReschedule) {
        return {
          isValid: false,
          message: `No se puede reprogramar porque faltan menos de ${config.minRescheduleHours} horas para la cita actual`,
          errorCode: 'TOO_LATE_TO_RESCHEDULE'
        };
      }

      // Verificar número máximo de reprogramaciones
      if (currentRescheduleCount >= config.maxReschedules) {
        return {
          isValid: false,
          message: `Se ha alcanzado el máximo de ${config.maxReschedules} reprogramaciones permitidas`,
          errorCode: 'MAX_RESCHEDULES_EXCEEDED'
        };
      }

      // Validar la nueva fecha usando las reglas de booking
      const newDateValidation = await this.validateBooking(newAppointmentDate, branchId);
      if (!newDateValidation.isValid) {
        return newDateValidation;
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error validando reprogramación:', error);
      return {
        isValid: false,
        message: 'Error interno al validar la reprogramación',
        errorCode: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Obtiene la configuración de recordatorios para una sede
   * 
   * Retorna la configuración específica para el sistema de recordatorios
   * automáticos de la sede, incluyendo si están habilitados y cuándo enviarlos.
   * 
   * @public
   * @param {number} branchId - ID de la sede
   * @returns {Promise<{enableAutoReminders: boolean, reminderHours: number}>} Configuración de recordatorios
   * 
   * @example
   * ```typescript
   * const config = await appointmentValidation.getReminderConfig(1);
   * if (config.enableAutoReminders) {
   *   console.log(`Enviar recordatorio ${config.reminderHours} horas antes`);
   * }
   * ```
   */
  async getReminderConfig(branchId: number): Promise<{enableAutoReminders: boolean, reminderHours: number, reminderTimes?: number[]}> {
    const config = await this.getBranchValidationConfig(branchId);
    
    // Obtener horarios múltiples de recordatorio si existen
    let reminderTimes: number[] = [];
    try {
      const settings = await BranchSettingsService.getBranchSettings(branchId);
      if (settings.config?.reminders?.emailReminders?.times) {
        reminderTimes = settings.config.reminders.emailReminders.times;
      }
    } catch (error) {
      console.error('Error obteniendo horarios de recordatorio múltiples:', error);
    }
    
    return {
      enableAutoReminders: config.enableAutoReminders,
      reminderHours: config.reminderHours,
      reminderTimes: reminderTimes.length > 0 ? reminderTimes : [config.reminderHours]
    };
  }

  /**
   * Verifica si una cita es elegible para recordatorio
   * 
   * Valida que la cita cumpla con todos los criterios para recibir
   * un recordatorio automático por email.
   * 
   * @public
   * @param {Date} appointmentDate - Fecha de la cita
   * @param {number} branchId - ID de la sede
   * @param {string} appointmentStatus - Estado actual de la cita
   * @returns {Promise<{eligible: boolean, reason?: string}>} Resultado de elegibilidad
   * 
   * @example
   * ```typescript
   * const eligibility = await appointmentValidation.isEligibleForReminder(
   *   appointmentDate, branchId, 'scheduled'
   * );
   * if (eligibility.eligible) {
   *   console.log('Cita elegible para recordatorio');
   * }
   * ```
   */
  async isEligibleForReminder(
    appointmentDate: Date, 
    branchId: number, 
    appointmentStatus: string
  ): Promise<{eligible: boolean, reason?: string}> {
    try {
      // Verificar que la cita esté programada
      if (appointmentStatus !== 'scheduled') {
        return {
          eligible: false,
          reason: 'La cita no está en estado programada'
        };
      }

      // Verificar que la cita sea futura
      const now = new Date();
      if (appointmentDate <= now) {
        return {
          eligible: false,
          reason: 'La cita ya pasó'
        };
      }

      // Verificar configuración de recordatorios de la sede
      const reminderConfig = await this.getReminderConfig(branchId);
      
      if (!reminderConfig.enableAutoReminders) {
        return {
          eligible: false,
          reason: 'Los recordatorios no están habilitados para esta sede'
        };
      }

      // Verificar que esté dentro del tiempo de recordatorio usando horarios múltiples
      const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const reminderTimes = reminderConfig.reminderTimes || [reminderConfig.reminderHours];
      const windowBuffer = 0.5; // Buffer de 30 minutos

      // Verificar si está dentro de alguna ventana de recordatorio
      let isWithinAnyWindow = false;
      let applicableWindows: string[] = [];
      
      for (const reminderHours of reminderTimes) {
        const windowStart = reminderHours + windowBuffer;
        const windowEnd = reminderHours - windowBuffer;
        
        if (hoursUntilAppointment <= windowStart && hoursUntilAppointment >= windowEnd) {
          isWithinAnyWindow = true;
          applicableWindows.push(`${reminderHours}h`);
        }
      }

      if (!isWithinAnyWindow) {
        const maxWindow = Math.max(...reminderTimes);
        const minWindow = Math.min(...reminderTimes);
        
        if (hoursUntilAppointment > maxWindow + windowBuffer) {
          return {
            eligible: false,
            reason: `Aún faltan más de ${maxWindow + windowBuffer} horas para la cita (ventanas: ${reminderTimes.join(', ')}h)`
          };
        }
        
        if (hoursUntilAppointment < minWindow - windowBuffer) {
          return {
            eligible: false,
            reason: `Ya pasó el tiempo para todos los recordatorios (${reminderTimes.join(', ')}h antes)`
          };
        }
      }

      return { 
        eligible: true,
        reason: `Elegible para recordatorio en ventanas: ${applicableWindows.join(', ')}`
      };

    } catch (error) {
      console.error('Error verificando elegibilidad para recordatorio:', error);
      return {
        eligible: false,
        reason: 'Error interno al verificar elegibilidad'
      };
    }
  }

  /**
   * Calcula el momento óptimo para enviar un recordatorio
   * 
   * Determina exactamente cuándo se debe enviar el recordatorio
   * basándose en la configuración de la sede.
   * 
   * @public
   * @param {Date} appointmentDate - Fecha de la cita
   * @param {number} branchId - ID de la sede
   * @returns {Promise<Date | null>} Fecha cuando enviar recordatorio o null si no aplica
   * 
   * @example
   * ```typescript
   * const reminderTime = await appointmentValidation.calculateReminderTime(
   *   appointmentDate, branchId
   * );
   * if (reminderTime) {
   *   console.log(`Enviar recordatorio el: ${reminderTime}`);
   * }
   * ```
   */
  async calculateReminderTime(appointmentDate: Date, branchId: number): Promise<Date | null> {
    try {
      const reminderConfig = await this.getReminderConfig(branchId);
      
      if (!reminderConfig.enableAutoReminders) {
        return null;
      }

      // Calcular la fecha del recordatorio (X horas antes de la cita)
      const reminderTime = new Date(
        appointmentDate.getTime() - (reminderConfig.reminderHours * 60 * 60 * 1000)
      );

      // Verificar que el recordatorio sea futuro
      const now = new Date();
      if (reminderTime <= now) {
        return null;
      }

      return reminderTime;

    } catch (error) {
      console.error('Error calculando tiempo de recordatorio:', error);
      return null;
    }
  }
}

/**
 * Instancia singleton del servicio de validación de citas
 * 
 * Esta instancia está lista para ser utilizada en toda la aplicación
 * para validar operaciones de citas según las configuraciones de sede.
 * 
 * @constant {AppointmentValidationService} appointmentValidation
 * @example
 * ```typescript
 * import { appointmentValidation } from './services/appointment-validation';
 * 
 * // Usar el servicio
 * const result = await appointmentValidation.validateCancellation(date, branchId);
 * ```
 */
export const appointmentValidation = new AppointmentValidationService();
