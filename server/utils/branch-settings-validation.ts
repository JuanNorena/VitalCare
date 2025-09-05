import { z } from "zod";

/**
 * @fileoverview Esquemas de validación Zod para configuraciones de sede
 * 
 * Este módulo define todos los esquemas de validación necesarios para garantizar
 * la integridad y consistencia de las configuraciones de sede en el sistema.
 * Utiliza Zod para proporcionar validaciones robustas tanto en tiempo de ejecución
 * como inferencia de tipos TypeScript.
 * 
 * ### Organización de Esquemas:
 * - **Configuraciones básicas**: Cancelación, reagendamiento, reservas
 * - **Notificaciones**: Recordatorios y canales de comunicación
 * - **Horarios especiales**: Feriados y días excepcionales
 * - **Autoservicio**: Configuraciones para kioscos y turnos automáticos
 * - **Emergencias**: Modo de emergencia y servicios prioritarios
 * 
 * ### Patrones de Validación:
 * - Rangos numéricos con límites lógicos de negocio
 * - Formatos de fecha y hora estandarizados
 * - Límites de arrays para prevenir abuso de recursos
 * - Validaciones de strings con longitud controlada
 * 
 * @version 1.0.0
 * @since 2025
 */

// ═══════════════════════════════════════════════════════════════════════════
// ESQUEMAS DE CONFIGURACIÓN BÁSICA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Esquema de validación para configuraciones de cancelación de citas
 * 
 * @description
 * Define las reglas y restricciones para el proceso de cancelación de citas,
 * incluyendo ventanas de tiempo, requisitos de información y políticas de reembolso.
 * 
 * @example
 * ```typescript
 * const cancellationConfig = {
 *   allowCancellation: true,
 *   cancellationHours: 24, // 24 horas antes de la cita
 *   requireReason: false,
 *   sendConfirmationEmail: true,
 *   refundPolicy: "Reembolso completo si se cancela 48h antes"
 * };
 * ```
 * 
 * @property {boolean} allowCancellation - Si se permite cancelar citas
 * @property {number} cancellationHours - Horas mínimas antes de la cita (0-168)
 * @property {boolean} requireReason - Si se requiere motivo para cancelar
 * @property {boolean} sendConfirmationEmail - Si enviar email de confirmación
 * @property {string} refundPolicy - Política de reembolso (opcional)
 */
export const CancellationConfigSchema = z.object({
  allowCancellation: z.boolean(),
  cancellationHours: z.number().min(0).max(168), // Máximo 7 días
  requireReason: z.boolean(),
  sendConfirmationEmail: z.boolean(),
  refundPolicy: z.string().optional()
});

/**
 * Esquema de validación para configuraciones de reagendamiento de citas
 * 
 * @description
 * Controla las reglas para permitir reagendamiento de citas existentes,
 * incluyendo límites de tiempo, número máximo de reagendamientos y requisitos.
 * 
 * @example
 * ```typescript
 * const reschedulingConfig = {
 *   allowRescheduling: true,
 *   rescheduleTimeLimit: 4, // 4 horas antes de la cita
 *   maxReschedules: 2, // Máximo 2 reagendamientos por cita
 *   requireReason: true,
 *   sendConfirmationEmail: true
 * };
 * ```
 * 
 * @property {boolean} allowRescheduling - Si se permite reagendar citas
 * @property {number} rescheduleTimeLimit - Horas mínimas antes de reagendar (0-168)
 * @property {number} maxReschedules - Número máximo de reagendamientos (1-10)
 * @property {boolean} requireReason - Si se requiere motivo para reagendar
 * @property {boolean} sendConfirmationEmail - Si enviar email de confirmación
 */
export const ReschedulingConfigSchema = z.object({
  allowRescheduling: z.boolean(),
  rescheduleTimeLimit: z.number().min(0).max(168), // Máximo 7 días
  maxReschedules: z.number().min(1).max(10),
  requireReason: z.boolean(),
  sendConfirmationEmail: z.boolean()
});

/**
 * Esquema de validación para configuraciones de reserva de citas
 * 
 * @description
 * Define los parámetros para el proceso de reserva de nuevas citas,
 * incluyendo ventanas de tiempo, límites por usuario y requisitos de verificación.
 * 
 * @example
 * ```typescript
 * const bookingConfig = {
 *   maxAdvanceBookingDays: 30, // 30 días de anticipación máxima
 *   minAdvanceBookingHours: 2, // 2 horas mínimas de anticipación
 *   allowSameDayBooking: true,
 *   requireDocumentVerification: false,
 *   maxAppointmentsPerUser: 3,
 *   allowRecurringAppointments: false
 * };
 * ```
 * 
 * @property {number} maxAdvanceBookingDays - Días máximos de anticipación (1-365)
 * @property {number} minAdvanceBookingHours - Horas mínimas de anticipación (0-72)
 * @property {boolean} allowSameDayBooking - Si permite reservas el mismo día
 * @property {boolean} requireDocumentVerification - Si requiere verificación de documento
 * @property {number} maxAppointmentsPerUser - Máximo de citas por usuario (1-20)
 * @property {boolean} allowRecurringAppointments - Si permite citas recurrentes
 */
export const BookingConfigSchema = z.object({
  maxAdvanceBookingDays: z.number().min(1).max(365), // Entre 1 día y 1 año
  minAdvanceBookingHours: z.number().min(0).max(72), // Máximo 3 días
  allowSameDayBooking: z.boolean(),
  requireDocumentVerification: z.boolean(),
  maxAppointmentsPerUser: z.number().min(1).max(20),
  allowRecurringAppointments: z.boolean()
});

// ═══════════════════════════════════════════════════════════════════════════
// ESQUEMAS DE NOTIFICACIONES Y RECORDATORIOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Esquema de validación para configuración de recordatorios por canal
 * 
 * @description
 * Define la estructura para configurar recordatorios en un canal específico
 * (email, SMS o WhatsApp), incluyendo horarios y plantillas personalizadas.
 * 
 * @example
 * ```typescript
 * const emailReminder = {
 *   enabled: true,
 *   times: [24, 2, 1], // 24h, 2h y 1h antes de la cita
 *   template: "Estimado {name}, tiene una cita mañana a las {time}"
 * };
 * ```
 * 
 * @property {boolean} enabled - Si este canal de recordatorio está activo
 * @property {number[]} times - Array de horas antes de la cita (0-168, máx 5 elementos)
 * @property {string} template - Plantilla personalizada del mensaje (opcional)
 */
export const EmailReminderSchema = z.object({
  enabled: z.boolean(),
  times: z.array(z.number().min(0).max(168)).max(5), // Máximo 5 recordatorios
  template: z.string().optional(),
  customMessage: z.string().optional()
});

/**
 * Esquema de validación para configuración completa de recordatorios
 * 
 * @description
 * Agrupa la configuración de recordatorios para todos los canales disponibles,
 * permitiendo habilitar/deshabilitar el sistema completo y configurar cada canal.
 * 
 * @example
 * ```typescript
 * const remindersConfig = {
 *   enabled: true, // Sistema de recordatorios activo
 *   emailReminders: { enabled: true, times: [24, 2], template: "" },
 *   smsReminders: { enabled: false, times: [24], template: "" },
 *   whatsappReminders: { enabled: true, times: [24, 1], template: "" }
 * };
 * ```
 * 
 * @property {boolean} enabled - Si el sistema de recordatorios está activo globalmente
 * @property {EmailReminderSchema} emailReminders - Configuración de recordatorios por email
 * @property {EmailReminderSchema} [smsReminders] - Configuración opcional de recordatorios por SMS
 * @property {EmailReminderSchema} [whatsappReminders] - Configuración opcional de recordatorios por WhatsApp
 */
export const RemindersConfigSchema = z.object({
  enabled: z.boolean(),
  emailReminders: EmailReminderSchema,
  smsReminders: EmailReminderSchema.optional(),
  whatsappReminders: EmailReminderSchema.optional()
});

/**
 * Esquema de validación para canales de notificación
 * 
 * @description
 * Define qué canales de comunicación están habilitados para un tipo específico
 * de notificación (confirmación, recordatorio, etc.).
 * 
 * @example
 * ```typescript
 * const notificationChannel = {
 *   email: true,    // Enviar por email
 *   sms: false,     // No enviar por SMS
 *   whatsapp: true  // Enviar por WhatsApp
 * };
 * ```
 * 
 * @property {boolean} email - Si enviar notificaciones por email
 * @property {boolean} [sms] - Si enviar notificaciones por SMS (opcional)
 * @property {boolean} [whatsapp] - Si enviar notificaciones por WhatsApp (opcional)
 */
export const NotificationChannelSchema = z.object({
  email: z.boolean(),
  sms: z.boolean().optional(),
  whatsapp: z.boolean().optional()
});

/**
 * Esquema de validación para configuración completa de notificaciones
 * 
 * @description
 * Organiza todas las configuraciones de notificaciones del sistema,
 * incluyendo notificaciones a usuarios y administradores.
 * 
 * @example
 * ```typescript
 * const notificationsConfig = {
 *   appointmentConfirmation: { email: true, sms: false, whatsapp: true },
 *   appointmentReminder: { email: true, sms: true, whatsapp: false },
 *   adminNotifications: {
 *     newAppointment: true,
 *     cancellation: true,
 *     noShow: false
 *   }
 * };
 * ```
 * 
 * @property {NotificationChannelSchema} appointmentConfirmation - Canales para confirmaciones
 * @property {NotificationChannelSchema} appointmentReminder - Canales para recordatorios
 * @property {Object} adminNotifications - Notificaciones administrativas
 * @property {boolean} adminNotifications.newAppointment - Notificar nuevas citas
 * @property {boolean} adminNotifications.cancellation - Notificar cancelaciones
 * @property {boolean} adminNotifications.noShow - Notificar no presentaciones
 */
export const NotificationsConfigSchema = z.object({
  appointmentConfirmation: NotificationChannelSchema,
  appointmentReminder: NotificationChannelSchema,
  adminNotifications: z.object({
    newAppointment: z.boolean(),
    cancellation: z.boolean(),
    noShow: z.boolean()
  })
});

// ═══════════════════════════════════════════════════════════════════════════
// ESQUEMAS DE HORARIOS ESPECIALES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Esquema de validación para días feriados
 * 
 * @description
 * Define la estructura para configurar días feriados con horarios especiales
 * o cierre completo de la sede.
 * 
 * @example
 * ```typescript
 * const holiday = {
 *   date: "2025-12-25",
 *   name: "Navidad",
 *   closed: true,
 *   customHours: undefined // No aplica si está cerrado
 * };
 * 
 * const partialHoliday = {
 *   date: "2025-12-24",
 *   name: "Nochebuena",
 *   closed: false,
 *   customHours: { start: "08:00", end: "14:00" }
 * };
 * ```
 * 
 * @property {string} date - Fecha en formato YYYY-MM-DD
 * @property {string} name - Nombre del feriado (1-100 caracteres)
 * @property {boolean} closed - Si la sede está cerrada completamente
 * @property {Object} customHours - Horarios especiales si no está cerrado (opcional)
 * @property {string} customHours.start - Hora de inicio en formato HH:MM
 * @property {string} customHours.end - Hora de fin en formato HH:MM
 */
export const HolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  name: z.string().min(1).max(100),
  closed: z.boolean(),
  customHours: z.object({
    start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM
    end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/) // HH:MM
  }).optional()
});

/**
 * Esquema de validación para días excepcionales
 * 
 * @description
 * Define la estructura para configurar días con horarios especiales
 * por razones específicas (mantenimiento, eventos, etc.).
 * 
 * @example
 * ```typescript
 * const exceptionalDay = {
 *   date: "2025-06-15",
 *   reason: "Mantenimiento de sistemas",
 *   closed: false,
 *   customHours: { start: "10:00", end: "16:00" }
 * };
 * ```
 * 
 * @property {string} date - Fecha en formato YYYY-MM-DD
 * @property {string} reason - Motivo del horario especial (1-200 caracteres)
 * @property {boolean} closed - Si la sede está cerrada completamente
 * @property {Object} customHours - Horarios especiales si no está cerrado (opcional)
 * @property {string} customHours.start - Hora de inicio en formato HH:MM
 * @property {string} customHours.end - Hora de fin en formato HH:MM
 */
export const ExceptionalDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  reason: z.string().min(1).max(200),
  closed: z.boolean(),
  customHours: z.object({
    start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM
    end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/) // HH:MM
  }).optional()
});

/**
 * Esquema de validación para configuración de horarios especiales
 * 
 * @description
 * Agrupa la configuración de feriados y días excepcionales,
 * permitiendo habilitar/deshabilitar esta funcionalidad.
 * 
 * @example
 * ```typescript
 * const specialSchedulesConfig = {
 *   enabled: true,
 *   holidays: [
 *     { date: "2025-01-01", name: "Año Nuevo", closed: true },
 *     { date: "2025-12-25", name: "Navidad", closed: true }
 *   ],
 *   exceptionalDays: [
 *     { 
 *       date: "2025-06-15", 
 *       reason: "Mantenimiento", 
 *       closed: false, 
 *       customHours: { start: "10:00", end: "16:00" } 
 *     }
 *   ]
 * };
 * ```
 * 
 * @property {boolean} enabled - Si los horarios especiales están activos
 * @property {HolidaySchema[]} holidays - Array de días feriados (máximo 50)
 * @property {ExceptionalDaySchema[]} exceptionalDays - Array de días excepcionales (máximo 100)
 */
export const SpecialSchedulesConfigSchema = z.object({
  enabled: z.boolean(),
  holidays: z.array(HolidaySchema).max(50), // Máximo 50 días feriados
  exceptionalDays: z.array(ExceptionalDaySchema).max(100) // Máximo 100 días excepcionales
});

// ═══════════════════════════════════════════════════════════════════════════
// ESQUEMAS DE AUTOSERVICIO Y EMERGENCIAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Esquema de validación para configuración de autoservicio
 * 
 * @description
 * Define las opciones disponibles para el sistema de autoservicio,
 * incluyendo kioscos, tickets digitales y estimación de tiempos.
 * 
 * @example
 * ```typescript
 * const selfServiceConfig = {
 *   enabled: true,
 *   requireRegistration: false, // Permitir usuarios anónimos
 *   allowWalkIn: true,         // Permitir walk-ins
 *   kioskMode: true,           // Modo kiosco activado
 *   printTickets: true,        // Imprimir tickets físicos
 *   digitalTickets: true,      // Enviar tickets digitales
 *   estimateWaitTime: true     // Mostrar tiempo estimado
 * };
 * ```
 * 
 * @property {boolean} enabled - Si el autoservicio está habilitado
 * @property {boolean} requireRegistration - Si requiere registro de usuario
 * @property {boolean} allowWalkIn - Si permite usuarios sin cita previa
 * @property {boolean} kioskMode - Si está en modo kiosco
 * @property {boolean} printTickets - Si imprimir tickets físicos
 * @property {boolean} digitalTickets - Si enviar tickets digitales
 * @property {boolean} estimateWaitTime - Si mostrar tiempo estimado de espera
 */
export const SelfServiceConfigSchema = z.object({
  enabled: z.boolean(),
  requireRegistration: z.boolean(),
  allowWalkIn: z.boolean(),
  kioskMode: z.boolean(),
  printTickets: z.boolean(),
  digitalTickets: z.boolean(),
  estimateWaitTime: z.boolean()
});

/**
 * Esquema de validación para configuración de modo de emergencia
 * 
 * @description
 * Define las opciones y comportamientos especiales durante situaciones de emergencia,
 * permitiendo relajar restricciones y priorizar ciertos servicios.
 * 
 * @example
 * ```typescript
 * const emergencyConfig = {
 *   mode: true,
 *   priorityServices: [1, 3, 5], // IDs de servicios prioritarios
 *   extendedHours: true,         // Extender horarios de atención
 *   skipQueue: true,             // Saltar cola para emergencias
 *   emergencyContact: "+1-555-0123" // Contacto de emergencia
 * };
 * ```
 * 
 * @property {boolean} mode - Si el modo de emergencia está activo
 * @property {number[]} priorityServices - IDs de servicios prioritarios (máximo 20)
 * @property {boolean} extendedHours - Si extender horarios de atención
 * @property {boolean} skipQueue - Si permitir saltar la cola
 * @property {string} emergencyContact - Contacto de emergencia (opcional)
 */
export const EmergencyConfigSchema = z.object({
  mode: z.boolean(),
  priorityServices: z.array(z.number()).max(20), // Máximo 20 servicios prioritarios
  extendedHours: z.boolean(),
  skipQueue: z.boolean(),
  emergencyContact: z.string().optional()
});

// ═══════════════════════════════════════════════════════════════════════════
// ESQUEMAS PRINCIPALES Y COMPUESTOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Esquema principal para toda la configuración de sede
 * 
 * @description
 * Combina todos los esquemas de configuración en una estructura unificada
 * que representa la configuración completa de una sede.
 * 
 * @example
 * ```typescript
 * const branchSettingsConfig = {
 *   cancellation: { allowCancellation: true, cancellationHours: 24, ... },
 *   rescheduling: { allowRescheduling: true, rescheduleTimeLimit: 4, ... },
 *   booking: { maxAdvanceBookingDays: 30, minAdvanceBookingHours: 2, ... },
 *   reminders: { enabled: true, emailReminders: {...}, ... },
 *   notifications: { appointmentConfirmation: {...}, ... },
 *   specialSchedules: { enabled: false, holidays: [], ... },
 *   selfService: { enabled: true, requireRegistration: false, ... },
 *   emergency: { mode: false, priorityServices: [], ... }
 * };
 * ```
 * 
 * @property {CancellationConfigSchema} cancellation - Configuración de cancelaciones
 * @property {ReschedulingConfigSchema} rescheduling - Configuración de reagendamientos
 * @property {BookingConfigSchema} booking - Configuración de reservas
 * @property {RemindersConfigSchema} reminders - Configuración de recordatorios
 * @property {NotificationsConfigSchema} notifications - Configuración de notificaciones
 * @property {SpecialSchedulesConfigSchema} specialSchedules - Configuración de horarios especiales
 * @property {SelfServiceConfigSchema} selfService - Configuración de autoservicio
 * @property {EmergencyConfigSchema} emergency - Configuración de emergencias
 */
export const BranchSettingsConfigSchema = z.object({
  cancellation: CancellationConfigSchema,
  rescheduling: ReschedulingConfigSchema,
  booking: BookingConfigSchema,
  reminders: RemindersConfigSchema,
  notifications: NotificationsConfigSchema,
  specialSchedules: SpecialSchedulesConfigSchema,
  selfService: SelfServiceConfigSchema,
  emergency: EmergencyConfigSchema
});

/**
 * Esquema para crear/actualizar configuración completa de sede
 * 
 * @description
 * Define la estructura completa para operaciones de creación y actualización
 * de configuraciones de sede, incluyendo tanto la configuración detallada
 * como los campos críticos de nivel superior.
 * 
 * @example
 * ```typescript
 * const branchSettingsForm = {
 *   branchId: 123,
 *   settings: { 
 *     cancellation: {...}, 
 *     rescheduling: {...}, 
 *     // ... resto de configuraciones
 *   },
 *   cancellationHours: 24,
 *   rescheduleTimeLimit: 4,
 *   maxAdvanceBookingDays: 30,
 *   remindersEnabled: true,
 *   emergencyMode: false,
 *   isActive: true
 * };
 * ```
 * 
 * @property {number} branchId - ID positivo de la sede
 * @property {BranchSettingsConfigSchema} settings - Configuración detallada
 * @property {number} cancellationHours - Horas mínimas para cancelar (0-168)
 * @property {number} rescheduleTimeLimit - Límite para reagendar (0-168)
 * @property {number} maxAdvanceBookingDays - Días máximos de anticipación (1-365)
 * @property {boolean} remindersEnabled - Si los recordatorios están activos
 * @property {boolean} emergencyMode - Si está en modo de emergencia
 * @property {boolean} isActive - Si la sede está activa
 */
export const BranchSettingsFormSchema = z.object({
  branchId: z.number().positive(),
  settings: BranchSettingsConfigSchema,
  cancellationHours: z.number().min(0).max(168),
  rescheduleTimeLimit: z.number().min(0).max(168),
  maxAdvanceBookingDays: z.number().min(1).max(365),
  remindersEnabled: z.boolean(),
  reminderHours: z.number().min(1).max(168).optional(),
  reminderMessage: z.string().optional(),
  emergencyMode: z.boolean(),
  isActive: z.boolean()
});

/**
 * Esquema para actualización rápida de modo de emergencia
 * 
 * @description
 * Permite alternar el modo de emergencia de manera rápida y sencilla,
 * con un motivo opcional para auditoría.
 * 
 * @example
 * ```typescript
 * // Activar modo de emergencia
 * const activateEmergency = {
 *   enabled: true,
 *   reason: "Emergencia médica en la sede"
 * };
 * 
 * // Desactivar modo de emergencia
 * const deactivateEmergency = {
 *   enabled: false,
 *   reason: "Situación normalizada"
 * };
 * ```
 * 
 * @property {boolean} enabled - Si activar o desactivar el modo de emergencia
 * @property {string} reason - Motivo del cambio (opcional, máximo 500 caracteres)
 */
export const EmergencyModeToggleSchema = z.object({
  enabled: z.boolean(),
  reason: z.string().max(500).optional()
});

/**
 * Esquema para actualizaciones parciales de configuración de sede
 * 
 * @description
 * Permite actualizar solo campos específicos de la configuración sin
 * requerir el objeto completo. Todos los campos son opcionales.
 * 
 * @example
 * ```typescript
 * // Actualizar solo el modo de emergencia
 * const partialUpdate = {
 *   emergencyMode: true
 * };
 * 
 * // Actualizar múltiples campos
 * const multipleUpdates = {
 *   cancellationHours: 48,
 *   remindersEnabled: false,
 *   isActive: false
 * };
 * ```
 * 
 * @property {Partial<BranchSettingsConfigSchema>} settings - Configuración parcial (opcional)
 * @property {number} cancellationHours - Horas para cancelar (opcional, 0-168)
 * @property {number} rescheduleTimeLimit - Límite para reagendar (opcional, 0-168)
 * @property {number} maxAdvanceBookingDays - Días de anticipación (opcional, 1-365)
 * @property {boolean} remindersEnabled - Estado de recordatorios (opcional)
 * @property {boolean} emergencyMode - Modo de emergencia (opcional)
 * @property {boolean} isActive - Estado de la sede (opcional)
 */
export const PartialBranchSettingsSchema = z.object({
  settings: BranchSettingsConfigSchema.partial().optional(),
  cancellationHours: z.number().min(0).max(168).optional(),
  rescheduleTimeLimit: z.number().min(0).max(168).optional(),
  maxAdvanceBookingDays: z.number().min(1).max(365).optional(),
  remindersEnabled: z.boolean().optional(),
  reminderHours: z.number().min(1).max(168).optional(),
  reminderMessage: z.string().optional(),
  emergencyMode: z.boolean().optional(),
  isActive: z.boolean().optional()
});

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS TYPESCRIPT DERIVADOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tipos TypeScript inferidos automáticamente de los esquemas Zod
 * 
 * @description
 * Estos tipos proporcionan inferencia de tipos estática basada en los esquemas
 * de validación, garantizando consistencia entre validación y tipado.
 * 
 * ### Tipos de Configuración Individual:
 * - `CancellationConfig`: Configuración de cancelaciones
 * - `ReschedulingConfig`: Configuración de reagendamientos  
 * - `BookingConfig`: Configuración de reservas
 * - `RemindersConfig`: Configuración de recordatorios
 * - `NotificationsConfig`: Configuración de notificaciones
 * - `SpecialSchedulesConfig`: Configuración de horarios especiales
 * - `SelfServiceConfig`: Configuración de autoservicio
 * - `EmergencyConfig`: Configuración de emergencias
 * 
 * ### Tipos de Esquemas Principales:
 * - `BranchSettingsConfigType`: Configuración completa de sede
 * - `BranchSettingsFormType`: Formulario de configuración de sede
 * - `EmergencyModeToggleType`: Toggle de modo de emergencia
 * - `PartialBranchSettingsType`: Actualizaciones parciales
 * 
 * @example
 * ```typescript
 * // Uso de tipos en funciones
 * function updateCancellationConfig(config: CancellationConfig): void {
 *   // config está tipado automáticamente según el esquema
 * }
 * 
 * // Uso en componentes React
 * interface Props {
 *   settings: BranchSettingsConfigType;
 *   onUpdate: (updates: PartialBranchSettingsType) => void;
 * }
 * ```
 */
export type CancellationConfig = z.infer<typeof CancellationConfigSchema>;
export type ReschedulingConfig = z.infer<typeof ReschedulingConfigSchema>;
export type BookingConfig = z.infer<typeof BookingConfigSchema>;
export type RemindersConfig = z.infer<typeof RemindersConfigSchema>;
export type NotificationsConfig = z.infer<typeof NotificationsConfigSchema>;
export type SpecialSchedulesConfig = z.infer<typeof SpecialSchedulesConfigSchema>;
export type SelfServiceConfig = z.infer<typeof SelfServiceConfigSchema>;
export type EmergencyConfig = z.infer<typeof EmergencyConfigSchema>;
export type BranchSettingsConfigType = z.infer<typeof BranchSettingsConfigSchema>;
export type BranchSettingsFormType = z.infer<typeof BranchSettingsFormSchema>;
export type EmergencyModeToggleType = z.infer<typeof EmergencyModeToggleSchema>;
export type PartialBranchSettingsType = z.infer<typeof PartialBranchSettingsSchema>;
