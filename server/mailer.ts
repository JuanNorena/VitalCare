/**
 * @fileoverview Módulo de compatibilidad para el servicio de correo electrónico
 * 
 * Este archivo actúa como un proxy para mantener compatibilidad con las importaciones
 * existentes del sistema, re-exportando el servicio de email desde su nueva ubicación.
 * 
 * @author VacaSoft
 * @version 1.0.0
 * @since 2025-06-25
 */

/**
 * Re-exportación del servicio de email principal para mantener compatibilidad
 * con importaciones existentes en el código base.
 * 
 * @example
 * ```typescript
 * import { emailService } from './mailer';
 * await emailService.sendWelcomeEmail(userData);
 * ```
 */
export { emailService } from './services/email';

/**
 * Alias del servicio de email para uso futuro en confirmaciones de citas
 * 
 * Esta exportación con nombre específico está preparada para futuras
 * implementaciones de correos de confirmación de citas médicas o de servicios.
 * 
 * @deprecated Usar directamente emailService.sendWelcomeEmail() o futuros métodos específicos
 * @example
 * ```typescript
 * import { sendAppointmentConfirmation } from './mailer';
 * // Uso futuro para confirmaciones de citas
 * ```
 */
export { emailService as sendAppointmentConfirmation } from './services/email';
