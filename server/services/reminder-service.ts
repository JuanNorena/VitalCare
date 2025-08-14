import { db } from '@db';
import { appointments, appointmentReminders, users, branches, branchSettings, services } from '@db/schema';
import { eq, and, isNull, lte, gte, inArray } from 'drizzle-orm';
import { BranchSettingsService } from './branch-settings';
import { emailService } from '../services/email';

/**
 * Resultado de envío de recordatorio
 * @interface ReminderResult
 */
interface ReminderResult {
  /** Indica si el recordatorio se envió exitosamente */
  success: boolean;
  /** ID del recordatorio creado/actualizado */
  reminderId?: number;
  /** Mensaje de error si falló */
  error?: string;
  /** Email al que se envió */
  emailAddress?: string;
}

/**
 * Datos de cita para recordatorio
 * @interface AppointmentReminderData
 */
interface AppointmentReminderData {
  id: number;
  confirmationCode: string;
  scheduledAt: Date;
  userEmail: string;
  userName: string;
  serviceName: string;
  branchId: number;
  branchName: string;
  branchAddress?: string;
  branchPhone?: string;
}

/**
 * Configuración de recordatorio para una sede
 * @interface ReminderConfig
 */
interface ReminderConfig {
  enabled: boolean;
  hoursBeforeAppointment: number;
  branchId: number;
}

/**
 * Servicio de Recordatorios Automáticos por Email
 * 
 * Este servicio maneja el envío automático de recordatorios por email
 * para citas programadas, basándose en la configuración específica de cada sede.
 * 
 * **Funcionalidades principales:**
 * - Identificación de citas que requieren recordatorio
 * - Envío de emails con plantilla personalizada
 * - Control de estado para evitar duplicados
 * - Reintento automático en caso de fallos
 * - Configuración dinámica por sede
 * 
 * @class ReminderService
 * @version 1.0.0
 * 
 * @example
 * ```typescript
 * // Procesar recordatorios pendientes
 * const results = await reminderService.processReminders();
 * console.log(`Enviados: ${results.length} recordatorios`);
 * 
 * // Programar recordatorio individual
 * await reminderService.scheduleReminder(appointmentId);
 * ```
 */
class ReminderService {

  /**
   * Envía un recordatorio por email para una cita específica
   * 
   * Genera y envía un email personalizado con los detalles de la cita,
   * usando el mensaje personalizado configurado para la sede o plantilla por defecto.
   * 
   * @private
   * @param {AppointmentReminderData} appointment - Datos de la cita
   * @param {number} [hoursBeforeAppointment] - Horas de anticipación del recordatorio para logging
   * @returns {Promise<ReminderResult>} Resultado del envío
   * 
   * @example
   * ```typescript
   * const result = await this.sendReminderEmail(appointmentData, 24);
   * if (result.success) {
   *   console.log(`Recordatorio enviado a ${result.emailAddress}`);
   * }
   * ```
   */
  private async sendReminderEmail(appointment: AppointmentReminderData, hoursBeforeAppointment?: number): Promise<ReminderResult> {
    try {
      // Calcular horas de anticipación si no se proporcionó
      if (!hoursBeforeAppointment) {
        const now = new Date();
        const timeDifference = appointment.scheduledAt.getTime() - now.getTime();
        hoursBeforeAppointment = Math.round(timeDifference / (60 * 60 * 1000));
      }

      // Crear registro de recordatorio en estado "pending" con información de horario
      const [reminder] = await db
        .insert(appointmentReminders)
        .values({
          appointmentId: appointment.id,
          reminderType: 'email',
          scheduledAt: new Date(),
          emailAddress: appointment.userEmail,
          status: 'pending',
          errorMessage: `Recordatorio de ${hoursBeforeAppointment}h` // Usar este campo para tracking temporal
        })
        .returning({ id: appointmentReminders.id });

      // Obtener la configuración de la sede para obtener el mensaje personalizado
      const branchConfig = await this.getBranchReminderConfig(appointment.branchId);
      
      // Generar contenido del email
      const subject = `Recordatorio: Cita #${appointment.confirmationCode} - ${appointment.branchName}`;
      const htmlContent = this.generateEmailTemplate(appointment, branchConfig?.customMessage);

      // Enviar email usando el servicio de mailer existente
      await emailService.sendCustomEmail({
        to: appointment.userEmail,
        subject: subject,
        html: htmlContent
      });

      // Actualizar estado a "sent" con información limpia
      await db
        .update(appointmentReminders)
        .set({
          status: 'sent',
          sentAt: new Date(),
          updatedAt: new Date(),
          errorMessage: null // Limpiar el campo usado para tracking temporal
        })
        .where(eq(appointmentReminders.id, reminder.id));

      console.log(`Recordatorio de ${hoursBeforeAppointment}h enviado exitosamente a ${appointment.userEmail} para cita #${appointment.confirmationCode}`);

      return {
        success: true,
        reminderId: reminder.id,
        emailAddress: appointment.userEmail
      };

    } catch (error) {
      console.error(`Error enviando recordatorio para cita #${appointment.confirmationCode}:`, error);
      
      // Logging detallado del error para debugging
      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      
      // Información adicional para debugging
      console.error(`Destinatario: ${appointment.userEmail}`);
      console.error(`Cita programada para: ${appointment.scheduledAt.toLocaleString()}`);
      console.error(`Sede: ${appointment.branchName} (ID: ${appointment.branchId})`);

      // Si tenemos el ID del recordatorio, actualizar estado a "failed"
      try {
        await db
          .update(appointmentReminders)
          .set({
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Error desconocido',
            retryCount: 1,
            updatedAt: new Date()
          })
          .where(and(
            eq(appointmentReminders.appointmentId, appointment.id),
            eq(appointmentReminders.status, 'pending')
          ));
      } catch (updateError) {
        console.error('Error actualizando estado de recordatorio fallido:', updateError);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        emailAddress: appointment.userEmail
      };
    }
  }

  /**
   * Obtiene la configuración de recordatorio para una sede específica
   * 
   * @private
   * @param {number} branchId - ID de la sede
   * @returns {Promise<{customMessage?: string} | null>} Configuración de recordatorio o null
   */
  private async getBranchReminderConfig(branchId: number): Promise<{customMessage?: string} | null> {
    try {
      const [branchSetting] = await db
        .select({
          reminderMessage: branchSettings.reminderMessage,
          settings: branchSettings.settings
        })
        .from(branchSettings)
        .where(eq(branchSettings.branchId, branchId));

      if (!branchSetting) {
        return null;
      }

      // Intentar obtener el mensaje del campo directo primero
      if (branchSetting.reminderMessage) {
        return { customMessage: branchSetting.reminderMessage };
      }

      // Si no hay mensaje directo, intentar obtenerlo de la configuración JSON
      const settings = branchSetting.settings as any;
      if (settings?.reminders?.emailReminders?.customMessage) {
        return { customMessage: settings.reminders.emailReminders.customMessage };
      }

      return null;
    } catch (error) {
      console.error(`Error obteniendo configuración de recordatorio para sede ${branchId}:`, error);
      return null;
    }
  }

  /**
   * Genera la plantilla HTML para el email de recordatorio
   * 
   * Crea un email responsive y profesional con todos los detalles
   * de la cita usando el mensaje personalizado si está disponible.
   * Mantiene consistencia visual con el resto de correos del sistema.
   * 
   * @private
   * @param {AppointmentReminderData} appointment - Datos de la cita
   * @param {string} [customMessage] - Mensaje personalizado opcional
   * @returns {string} HTML del email
   * 
   * @example
   * ```typescript
   * const htmlContent = this.generateEmailTemplate(appointmentData, customMessage);
   * console.log('Email HTML generado:', htmlContent.length, 'caracteres');
   * ```
   */
  private generateEmailTemplate(appointment: AppointmentReminderData, customMessage?: string): string {
    const appointmentDate = appointment.scheduledAt.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const appointmentTime = appointment.scheduledAt.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Calcular tiempo restante hasta la cita para mensaje contextual
    const now = new Date();
    const timeDifference = appointment.scheduledAt.getTime() - now.getTime();
    const hoursUntilAppointment = Math.round(timeDifference / (60 * 60 * 1000));
    const daysUntilAppointment = Math.floor(hoursUntilAppointment / 24);
    
    let timeMessage = '';
    if (daysUntilAppointment > 0) {
      timeMessage = `en ${daysUntilAppointment} día${daysUntilAppointment > 1 ? 's' : ''}`;
    } else if (hoursUntilAppointment > 0) {
      timeMessage = `en ${hoursUntilAppointment} hora${hoursUntilAppointment > 1 ? 's' : ''}`;
    } else {
      timeMessage = 'muy pronto';
    }

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recordatorio de Cita</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
          .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
          .content { padding: 30px; }
          .reminder-icon { font-size: 48px; color: #ff9800; margin-bottom: 15px; text-align: center; }
          .appointment-card { background-color: #f8f9fa; border-left: 4px solid #ff9800; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; text-align: right; }
          .confirmation-code { background-color: #fff3e0; border: 2px solid #ff9800; padding: 15px; margin: 20px 0; text-align: center; border-radius: 5px; }
          .confirmation-code h3 { margin: 0 0 10px 0; color: #e65100; font-size: 16px; }
          .confirmation-code .code { font-size: 24px; font-weight: bold; color: #ff9800; letter-spacing: 2px; }
          .important-notes { background-color: #e8f5e8; border-left: 4px solid #4caf50; padding: 20px; margin: 20px 0; border-radius: 0 5px 5px 0; }
          .important-notes h3 { margin: 0 0 15px 0; color: #2e7d32; font-size: 18px; }
          .important-notes ul { margin: 0; padding-left: 20px; }
          .important-notes li { margin-bottom: 8px; color: #333; }
          .custom-message { background-color: #fff3e0; border: 1px solid #ff9800; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .custom-message h3 { margin: 0 0 10px 0; color: #e65100; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          @media (max-width: 600px) {
            body { padding: 10px; }
            .container { margin: 0; }
            .header { padding: 20px; }
            .content { padding: 20px; }
            .detail-row { flex-direction: column; text-align: left; }
            .detail-value { text-align: left; font-weight: normal; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="reminder-icon">🔔</div>
            <h1>Recordatorio de Cita</h1>
            <p>Su cita está programada ${timeMessage}</p>
          </div>
          
          <div class="content">
            <p>Hola <strong>${appointment.userName}</strong>,</p>
            
            <p>Este es un recordatorio de que tienes una cita programada. A continuación encontrarás todos los detalles:</p>
            
            ${customMessage ? `
            <div class="custom-message">
              <h3>💬 Mensaje de ${appointment.branchName}</h3>
              <p>${customMessage}</p>
            </div>
            ` : ''}
            
            <div class="appointment-card">
              <h3 style="margin-top: 0; color: #ff9800;">📅 Detalles de tu Cita</h3>
              
              <div class="detail-row">
                <span class="detail-label">Servicio:</span>
                <span class="detail-value">${appointment.serviceName}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Fecha:</span>
                <span class="detail-value">${appointmentDate}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Hora:</span>
                <span class="detail-value">${appointmentTime}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Sucursal:</span>
                <span class="detail-value">${appointment.branchName}</span>
              </div>
              
              ${appointment.branchAddress ? `
              <div class="detail-row">
                <span class="detail-label">Dirección:</span>
                <span class="detail-value">${appointment.branchAddress}</span>
              </div>
              ` : ''}
              
              ${appointment.branchPhone ? `
              <div class="detail-row">
                <span class="detail-label">Teléfono:</span>
                <span class="detail-value">${appointment.branchPhone}</span>
              </div>
              ` : ''}
            </div>

            <div class="confirmation-code">
              <h3>🎫 Código de Confirmación</h3>
              <div class="code">${appointment.confirmationCode}</div>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Presenta este código al llegar a tu cita</p>
            </div>

            <div class="important-notes">
              <h3>📋 Instrucciones Importantes</h3>
              <ul>
                <li><strong>Llegue 15 minutos antes</strong> de su hora programada</li>
                <li>Traiga su <strong>documento de identificación</strong></li>
                <li>Tenga a mano su <strong>código de confirmación</strong></li>
                <li>Si necesita cancelar o reprogramar, hágalo con <strong>al menos 24 horas de anticipación</strong></li>
                <li>Para consultas, contacte directamente a la sucursal</li>
              </ul>
            </div>


            
            <p style="margin-top: 30px;">Si tienes alguna pregunta o necesitas hacer algún cambio, no dudes en contactarnos.</p>
            
            <p>¡Te esperamos!</p>
          </div>
          
          <div class="footer">
            <p><strong>${appointment.branchName}</strong></p>
            ${appointment.branchPhone ? `<p>📞 ${appointment.branchPhone}</p>` : ''}
            ${appointment.branchAddress ? `<p>📍 ${appointment.branchAddress}</p>` : ''}
            <p style="margin-top: 15px;">Gestión de Atención Plus - ${new Date().getFullYear()}</p>
            <p style="font-size: 12px; color: #999;">Este es un recordatorio automático. No responda a este correo.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Procesa todos los recordatorios pendientes
   * 
   * Función principal que ejecuta el ciclo completo de procesamiento:
   * busca citas pendientes, envía recordatorios y maneja errores.
   * 
   * @public
   * @returns {Promise<ReminderResult[]>} Array con resultados de todos los envíos
   * 
   * @example
   * ```typescript
   * // Ejecutar procesamiento de recordatorios
   * const results = await reminderService.processReminders();
   * const successful = results.filter(r => r.success).length;
   * console.log(`${successful}/${results.length} recordatorios enviados exitosamente`);
   * ```
   */
  async processReminders(): Promise<ReminderResult[]> {
    console.log('Iniciando procesamiento de recordatorios automáticos...');
    
    try {
      // Obtener todas las sedes con recordatorios habilitados
      const activeBranches = await db
        .select({
          branchId: branchSettings.branchId,
          reminderHours: branchSettings.reminderHours,
          remindersEnabled: branchSettings.remindersEnabled,
          settings: branchSettings.settings
        })
        .from(branchSettings)
        .where(eq(branchSettings.remindersEnabled, true));

      if (activeBranches.length === 0) {
        console.log('No hay sedes con recordatorios habilitados');
        return [];
      }

      const now = new Date();
      const results: ReminderResult[] = [];

      // Procesar cada sede con recordatorios habilitados
      for (const branch of activeBranches) {
        // Obtener horarios múltiples de recordatorio
        let reminderTimes: number[] = [branch.reminderHours]; // Valor por defecto
        
        try {
          const settings = branch.settings as any;
          if (settings?.reminders?.emailReminders?.times && Array.isArray(settings.reminders.emailReminders.times)) {
            reminderTimes = settings.reminders.emailReminders.times;
          }
        } catch (error) {
          console.error(`Error procesando horarios múltiples para sede ${branch.branchId}:`, error);
        }

        console.log(`Procesando sede ${branch.branchId} con horarios de recordatorio: ${reminderTimes.join(', ')}h`);

        // Procesar cada horario de recordatorio
        for (const reminderHours of reminderTimes) {
          const reminderTime = new Date(now.getTime() + (reminderHours * 60 * 60 * 1000));
          const maxReminderTime = new Date(now.getTime() + ((reminderHours + 0.5) * 60 * 60 * 1000)); // Buffer de 30 min
          const minReminderTime = new Date(now.getTime() + ((reminderHours - 0.5) * 60 * 60 * 1000)); // Buffer de 30 min

          console.log(`  - Buscando citas para recordatorio de ${reminderHours}h (${minReminderTime.toLocaleString()} - ${maxReminderTime.toLocaleString()})`);

          // Buscar citas en el rango de tiempo para este horario específico
          const branchAppointments = await db
            .select({
              id: appointments.id,
              confirmationCode: appointments.confirmationCode,
              scheduledAt: appointments.scheduledAt,
              branchId: appointments.branchId,
              userEmail: users.email,
              userName: users.username,
              serviceName: services.name,
              branchName: branches.name,
              branchAddress: branches.address,
              branchPhone: branches.phone
            })
            .from(appointments)
            .innerJoin(users, eq(appointments.userId, users.id))
            .innerJoin(branches, eq(appointments.branchId, branches.id))
            .innerJoin(services, eq(appointments.serviceId, services.id))
            .where(and(
              eq(appointments.branchId, branch.branchId),
              eq(appointments.status, 'scheduled'),
              gte(appointments.scheduledAt, minReminderTime),
              lte(appointments.scheduledAt, maxReminderTime)
            ));

          console.log(`    - Encontradas ${branchAppointments.length} citas candidatas para recordatorio de ${reminderHours}h`);

          // Procesar cada cita individualmente
          for (const apt of branchAppointments) {
            // Verificar si ya existe un recordatorio enviado para esta cita en el horario específico
            const appointmentScheduledTime = new Date(apt.scheduledAt);
            const expectedReminderTime = new Date(appointmentScheduledTime.getTime() - (reminderHours * 60 * 60 * 1000));
            
            // Buscar recordatorios enviados en un rango de tiempo alrededor del horario esperado (±30 min)
            const reminderTimeStart = new Date(expectedReminderTime.getTime() - (30 * 60 * 1000));
            const reminderTimeEnd = new Date(expectedReminderTime.getTime() + (30 * 60 * 1000));
            
            const existingReminders = await db
              .select()
              .from(appointmentReminders)
              .where(and(
                eq(appointmentReminders.appointmentId, apt.id),
                eq(appointmentReminders.reminderType, 'email'),
                eq(appointmentReminders.status, 'sent'),
                gte(appointmentReminders.sentAt, reminderTimeStart),
                lte(appointmentReminders.sentAt, reminderTimeEnd)
              ));

            if (existingReminders.length === 0) {
              // Enviar recordatorio para esta cita específica
              const appointmentData: AppointmentReminderData = {
                id: apt.id,
                confirmationCode: apt.confirmationCode || `TEMP-${apt.id}`,
                scheduledAt: new Date(apt.scheduledAt),
                userEmail: apt.userEmail,
                userName: apt.userName,
                serviceName: apt.serviceName || 'Servicio no especificado',
                branchId: apt.branchId,
                branchName: apt.branchName,
                branchAddress: apt.branchAddress || undefined,
                branchPhone: apt.branchPhone || undefined
              };

              const result = await this.sendReminderEmail(appointmentData, reminderHours);
              results.push(result);
              
              // Pequeña pausa entre envíos para no sobrecargar el servidor de email
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              console.log(`    - Cita #${apt.confirmationCode} ya tiene recordatorio de ${reminderHours}h enviado`);
            }
          }
        }
      }

      // Resumen de resultados
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log(`Recordatorios procesados: ${successful} exitosos, ${failed} fallidos`);
      
      return results;

    } catch (error) {
      console.error('Error en procesamiento de recordatorios:', error);
      return [];
    }
  }

  /**
   * Programa un recordatorio individual para una cita específica
   * 
   * Permite programar manualmente un recordatorio para una cita,
   * útil para casos especiales o reprogramaciones.
   * 
   * @public
   * @param {number} appointmentId - ID de la cita
   * @returns {Promise<ReminderResult>} Resultado del programado
   * 
   * @example
   * ```typescript
   * // Programar recordatorio para cita específica
   * const result = await reminderService.scheduleReminder(123);
   * if (result.success) {
   *   console.log('Recordatorio programado exitosamente');
   * }
   * ```
   */
  async scheduleReminder(appointmentId: number): Promise<ReminderResult> {
    try {
      // Buscar la cita con todos los datos necesarios
      const [appointment] = await db
        .select({
          id: appointments.id,
          confirmationCode: appointments.confirmationCode,
          scheduledAt: appointments.scheduledAt,
          branchId: appointments.branchId,
          userEmail: users.email,
          userName: users.username,
          serviceName: services.name, // JOIN con services para obtener el nombre
          branchName: branches.name,
          branchAddress: branches.address,
          branchPhone: branches.phone
        })
        .from(appointments)
        .innerJoin(users, eq(appointments.userId, users.id))
        .innerJoin(branches, eq(appointments.branchId, branches.id))
        .innerJoin(services, eq(appointments.serviceId, services.id)) // JOIN con services
        .where(and(
          eq(appointments.id, appointmentId),
          eq(appointments.status, 'scheduled')
        ))
        .limit(1);

      if (!appointment) {
        return {
          success: false,
          error: 'Cita no encontrada o no está programada'
        };
      }

      // Verificar que la sede tenga recordatorios habilitados
      const remindersEnabled = await BranchSettingsService.areBranchRemindersEnabled(appointment.branchId);
      
      if (!remindersEnabled) {
        return {
          success: false,
          error: 'Los recordatorios no están habilitados para esta sede'
        };
      }

      // Verificar que no exista ya un recordatorio enviado
      const existingReminder = await db
        .select()
        .from(appointmentReminders)
        .where(and(
          eq(appointmentReminders.appointmentId, appointmentId),
          inArray(appointmentReminders.status, ['sent', 'pending'])
        ))
        .limit(1);

      if (existingReminder.length > 0) {
        return {
          success: false,
          error: 'Ya existe un recordatorio para esta cita'
        };
      }

      // Convertir datos y enviar recordatorio
      const appointmentData: AppointmentReminderData = {
        id: appointment.id,
        confirmationCode: appointment.confirmationCode || `TEMP-${appointment.id}`, // Manejar null
        scheduledAt: new Date(appointment.scheduledAt),
        userEmail: appointment.userEmail,
        userName: appointment.userName,
        serviceName: appointment.serviceName || 'Servicio no especificado',
        branchId: appointment.branchId, // Agregar branchId faltante
        branchName: appointment.branchName,
        branchAddress: appointment.branchAddress || undefined,
        branchPhone: appointment.branchPhone || undefined
      };

      return await this.sendReminderEmail(appointmentData);

    } catch (error) {
      console.error(`Error programando recordatorio para cita ${appointmentId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Cancela recordatorios pendientes para una cita
   * 
   * Marca como cancelados los recordatorios que aún no se han enviado,
   * útil cuando se cancela o reprograma una cita.
   * 
   * @public
   * @param {number} appointmentId - ID de la cita
   * @returns {Promise<boolean>} true si se cancelaron recordatorios
   * 
   * @example
   * ```typescript
   * // Cancelar recordatorios al cancelar una cita
   * const cancelled = await reminderService.cancelReminders(appointmentId);
   * if (cancelled) {
   *   console.log('Recordatorios cancelados');
   * }
   * ```
   */
  async cancelReminders(appointmentId: number): Promise<boolean> {
    try {
      const result = await db
        .update(appointmentReminders)
        .set({
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(and(
          eq(appointmentReminders.appointmentId, appointmentId),
          eq(appointmentReminders.status, 'pending')
        ));

      console.log(`Recordatorios cancelados para cita ${appointmentId}`);
      return true;

    } catch (error) {
      console.error(`Error cancelando recordatorios para cita ${appointmentId}:`, error);
      return false;
    }
  }
}

/**
 * Instancia singleton del servicio de recordatorios
 * 
 * Esta instancia está lista para ser utilizada en toda la aplicación
 * para gestionar recordatorios automáticos por email.
 * 
 * @constant {ReminderService} reminderService
 * @example
 * ```typescript
 * import { reminderService } from './services/reminder-service';
 * 
 * // Procesar recordatorios automáticamente
 * await reminderService.processReminders();
 * ```
 */
export const reminderService = new ReminderService();
