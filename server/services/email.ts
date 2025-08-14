import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Opciones para el envío de correos electrónicos
 * @interface EmailOptions
 */
interface EmailOptions {
  /** Dirección de correo electrónico del destinatario */
  to: string;
  /** Asunto del correo electrónico */
  subject: string;
  /** Contenido HTML del correo electrónico */
  html: string;
  /** Contenido de texto plano del correo electrónico (opcional) */
  text?: string;
}

/**
 * Datos del usuario para el correo de bienvenida
 * @interface UserRegistrationData
 */
interface UserRegistrationData {
  /** Nombre de usuario registrado */
  username: string;
  /** Dirección de correo electrónico del usuario */
  email: string;
}

/**
 * Datos necesarios para enviar una confirmación de reserva por correo
 * @interface BookingConfirmationData
 */
interface BookingConfirmationData {
  /** Dirección de correo electrónico del cliente */
  email: string;
  /** Nombre completo del cliente */
  customerName: string;
  /** Nombre del servicio reservado */
  serviceName: string;
  /** Fecha de la cita en formato legible */
  appointmentDate: string;
  /** Hora de la cita */
  appointmentTime: string;
  /** Nombre de la sucursal */
  branchName: string;
  /** Dirección de la sucursal */
  branchAddress?: string;
  /** Teléfono de la sucursal */
  branchPhone?: string;
  /** Notas adicionales del cliente */
  notes?: string;
  /** Duración estimada del servicio en minutos */
  duration: number;
  /** Datos del formulario dinámico del servicio */
  dynamicFormData?: Array<{
    label: string;
    value: string;
  }>;
  /** Código de confirmación de la cita */
  confirmationCode?: string;
  /** Código QR en formato base64 para check-in */
  qrCode?: string;
}

/**
 * Datos necesarios para enviar una encuesta de satisfacción por correo
 * @interface SurveyEmailData
 */
interface SurveyEmailData {
  /** Dirección de correo electrónico del destinatario */
  email: string;
  /** Nombre del paciente o cliente */
  patientName: string;
  /** Token único de la encuesta para generar el enlace */
  token: string;
  /** Código QR en formato base64 (opcional) */
  qrCode?: string;
  /** Nombre del servicio evaluado */
  serviceName: string;
  /** Nombre de la sede donde se realizó el servicio */
  branchName: string;
}

/**
 * Datos necesarios para enviar una notificación de reprogramación por correo
 * @interface RescheduleNotificationData
 */
interface RescheduleNotificationData {
  /** Dirección de correo electrónico del destinatario */
  email: string;
  /** Nombre del cliente */
  customerName: string;
  /** Nombre del servicio */
  serviceName: string;
  /** Nueva fecha de la cita en formato legible */
  newAppointmentDate: string;
  /** Nueva hora de la cita */
  newAppointmentTime: string;
  /** Fecha original de la cita en formato legible */
  originalAppointmentDate: string;
  /** Hora original de la cita */
  originalAppointmentTime: string;
  /** Código de confirmación de la cita */
  confirmationCode: string;
  /** Motivo de la reprogramación (opcional) */
  reason?: string;
  /** Nombre de la sucursal */
  branchName: string;
  /** Dirección de la sucursal (opcional) */
  branchAddress?: string;
  /** Teléfono de la sucursal (opcional) */
  branchPhone?: string;
}

/**
 * Datos necesarios para enviar una confirmación de cita por correo
 * @interface AppointmentConfirmationData
 */
interface AppointmentConfirmationData {
  /** Dirección de correo electrónico del cliente */
  email: string;
  /** Nombre completo del cliente */
  customerName: string;
  /** Nombre del servicio */
  serviceName: string;
  /** Fecha de la cita en formato legible */
  appointmentDate: string;
  /** Hora de la cita */
  appointmentTime: string;
  /** Código de confirmación de la cita */
  confirmationCode: string;
  /** Nombre de la sucursal */
  branchName: string;
  /** Dirección de la sucursal (opcional) */
  branchAddress?: string;
  /** Teléfono de la sucursal (opcional) */
  branchPhone?: string;
  /** Duración estimada del servicio en minutos */
  duration: number;
}

/**
 * Datos necesarios para enviar una notificación de cancelación por correo
 * @interface CancellationNotificationData
 */
interface CancellationNotificationData {
  /** Dirección de correo electrónico del cliente */
  email: string;
  /** Nombre completo del cliente */
  customerName: string;
  /** Nombre del servicio */
  serviceName: string;
  /** Fecha de la cita cancelada en formato legible */
  appointmentDate: string;
  /** Hora de la cita cancelada */
  appointmentTime: string;
  /** Código de confirmación de la cita */
  confirmationCode: string;
  /** Motivo de la cancelación (opcional) */
  reason?: string;
  /** Nombre de la sucursal */
  branchName: string;
  /** Dirección de la sucursal (opcional) */
  branchAddress?: string;
  /** Teléfono de la sucursal (opcional) */
  branchPhone?: string;
}

/**
 * Servicio de correo electrónico para el Sistema de Gestión de Atención Plus
 * 
 * Esta clase proporciona funcionalidades para el envío de correos electrónicos
 * utilizando Nodemailer. Soporta múltiples proveedores SMTP y permite el envío
 * de correos con plantillas HTML profesionales.
 * 
 * @class EmailService
 * @version 1.0.0
 * 
 * @example
 * ```typescript
 * // Enviar correo de bienvenida
 * await emailService.sendWelcomeEmail({
 *   username: 'juan_perez',
 *   email: 'juan@ejemplo.com'
 * });
 * 
 * // Verificar conexión SMTP
 * const isConnected = await emailService.testConnection();
 * ```
 */
class EmailService {
  /** Transporter de Nodemailer configurado para el envío de correos */
  private transporter: Transporter;

  /**
   * Constructor del servicio de correo electrónico
   * 
   * Inicializa el transporter de Nodemailer con la configuración SMTP
   * obtenida de las variables de entorno.
   * 
   * Variables de entorno requeridas:
   * - SMTP_HOST: Servidor SMTP
   * - SMTP_PORT: Puerto del servidor SMTP (por defecto 465)
   * - SMTP_SECURE: Conexión segura (true/false)
   * - SMTP_USER: Usuario para autenticación SMTP
   * - SMTP_PASS: Contraseña para autenticación SMTP
   * - FROM_NAME: Nombre del remitente
   * - FROM_EMAIL: Dirección de correo del remitente
   */
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Método privado para el envío de correos electrónicos
   * 
   * Configura las opciones de correo y utiliza el transporter para enviar
   * el mensaje. Incluye logging de éxito y manejo de errores.
   * 
   * @private
   * @param {EmailOptions} options - Opciones del correo a enviar
   * @returns {Promise<void>} Promise que se resuelve cuando el correo es enviado
   * @throws {Error} Lanza error si el envío falla
   * 
   * @example
   * ```typescript
   * await this.sendEmail({
   *   to: 'usuario@ejemplo.com',
   *   subject: 'Mensaje de prueba',
   *   html: '<h1>Hola mundo</h1>',
   *   text: 'Hola mundo'
   * });
   * ```
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    try {
      console.log(`📧 Intentando enviar email a: ${options.to}`);
      console.log(`📧 Asunto: ${options.subject}`);
      console.log(`📧 Configuración SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} (secure: ${process.env.SMTP_SECURE})`);
      
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Email sent successfully to ${options.to}`);
      console.log(`📧 Message ID: ${info.messageId}`);
      console.log(`📧 Response: ${info.response}`);
      
      // Log adicional para debugging
      if (info.accepted && info.accepted.length > 0) {
        console.log(`📧 Accepted recipients: ${info.accepted.join(', ')}`);
      }
      if (info.rejected && info.rejected.length > 0) {
        console.log(`⚠️ Rejected recipients: ${info.rejected.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
      console.error('📧 Mail options were:', JSON.stringify(mailOptions, null, 2));
      throw new Error('Failed to send email');
    }
  }

  /**
   * Envía un correo de bienvenida a un usuario recién registrado
   * 
   * Genera y envía un correo electrónico de bienvenida con plantilla HTML
   * profesional que incluye información sobre las funcionalidades del sistema
   * y los detalles de la cuenta del usuario.
   * 
   * Características del correo:
   * - Plantilla HTML responsive con branding corporativo
   * - Versión de texto plano para compatibilidad
   * - Información de funcionalidades del sistema
   * - Detalles de la cuenta creada
   * 
   * @public
   * @param {UserRegistrationData} userData - Datos del usuario registrado
   * @returns {Promise<void>} Promise que se resuelve cuando el correo es enviado
   * @throws {Error} Lanza error si el envío del correo falla
   * 
   * @example
   * ```typescript
   * await emailService.sendWelcomeEmail({
   *   username: 'maria_garcia',
   *   email: 'maria.garcia@empresa.com'
   * });
   * ```
   */
  async sendWelcomeEmail(userData: UserRegistrationData): Promise<void> {
    const subject = 'Bienvenido al Sistema de Gestión de Atención Plus';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .welcome-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
          .feature { margin: 15px 0; padding: 10px; background-color: #e0f2fe; border-radius: 4px; }
          .feature-title { font-weight: bold; color: #0369a1; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏢 Sistema de Gestión de Atención Plus</h1>
          </div>
          
          <div class="content">
            <div class="welcome-box">
              <h2>¡Bienvenido, ${userData.username}!</h2>
              <p>Gracias por registrarte en nuestro Sistema de Gestión de Atención Plus. Tu cuenta ha sido creada exitosamente.</p>
            </div>

            <h3>🚀 ¿Qué puedes hacer con tu cuenta?</h3>
            
            <div class="feature">
              <div class="feature-title">📅 Gestión de Citas</div>
              <p>Reserva citas online de forma rápida y sencilla</p>
            </div>

            <div class="feature">
              <div class="feature-title">📱 Check-in Digital</div>
              <p>Utiliza códigos QR para hacer check-in automático</p>
            </div>

            <div class="feature">
              <div class="feature-title">🎯 Sistema de Turnos</div>
              <p>Sigue el estado de tu turno en tiempo real</p>
            </div>

            <div class="feature">
              <div class="feature-title">📧 Notificaciones</div>
              <p>Recibe confirmaciones y recordatorios por email</p>
            </div>

            <div class="welcome-box">
              <h3>📋 Detalles de tu cuenta:</h3>
              <p><strong>Usuario:</strong> ${userData.username}</p>
              <p><strong>Email:</strong> ${userData.email}</p>
              <p><strong>Fecha de registro:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
            </div>

            <p>Para comenzar a usar el sistema, simplemente inicia sesión con las credenciales que creaste durante el registro.</p>
            
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
          </div>
          
          <div class="footer">
            <p>Este es un mensaje automático del Sistema de Gestión de Atención Plus</p>
            <p>© ${new Date().getFullYear()} VacaSoft - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Bienvenido al Sistema de Gestión de Atención Plus

      Hola ${userData.username},

      Gracias por registrarte en nuestro sistema. Tu cuenta ha sido creada exitosamente.

      Detalles de tu cuenta:
      - Usuario: ${userData.username}
      - Email: ${userData.email}
      - Fecha de registro: ${new Date().toLocaleDateString('es-ES')}

      Para comenzar a usar el sistema, inicia sesión con las credenciales que creaste.

      ¡Bienvenido!

      Sistema de Gestión de Atención Plus
      © ${new Date().getFullYear()} VacaSoft
    `;

    await this.sendEmail({
      to: userData.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Envía un correo electrónico con una encuesta de satisfacción.
   * 
   * Genera y envía un correo electrónico profesional que incluye:
   * - Enlace directo a la encuesta
   * - Código QR para acceso móvil
   * - Información del servicio recibido
   * - Diseño responsive y accesible
   * 
   * @param {SurveyEmailData} surveyData - Datos de la encuesta y destinatario
   * @returns {Promise<void>} Promise que se resuelve cuando el correo es enviado
   * @throws {Error} Lanza error si el envío del correo falla
   * 
   * @example
   * ```typescript
   * await emailService.sendSurveyEmail({
   *   email: 'cliente@empresa.com',
   *   patientName: 'Juan Pérez',
   *   token: 'abc123...',
   *   qrCode: 'data:image/png;base64,...',
   *   serviceName: 'Consulta General',
   *   branchName: 'Sede Centro'
   * });
   * ```
   */
  async sendSurveyEmail(surveyData: SurveyEmailData): Promise<void> {
  
    const subject = 'Encuesta de Satisfacción - Su opinión es importante para nosotros';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .survey-box { background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .cta-button { 
            display: inline-block; 
            background-color: #2563eb !important; 
            color: white !important; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: bold;
            margin: 20px 0;
            border: none !important;
          }
          .qr-section { text-align: center; margin: 30px 0; padding: 20px; background-color: #e0f2fe; border-radius: 8px; }
          .service-info { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
          .highlight { color: #2563eb; font-weight: bold; }
          @media only screen and (max-width: 600px) {
            .container { padding: 10px; }
            .header, .content { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Encuesta de Satisfacción</h1>
            <p>Su experiencia es muy importante para nosotros</p>
          </div>
          
          <div class="content">
            <div class="survey-box">
              <h2>¡Hola, ${surveyData.patientName}!</h2>
              <p>Esperamos que haya tenido una excelente experiencia con nuestros servicios. Su opinión nos ayuda a mejorar continuamente.</p>
              
              <div class="service-info">
                <h3>🏥 Detalles del Servicio</h3>
                <p><strong>Servicio:</strong> <span class="highlight">${surveyData.serviceName}</span></p>
                <p><strong>Sede:</strong> <span class="highlight">${surveyData.branchName}</span></p>
                <p><strong>Fecha:</strong> <span class="highlight">${new Date().toLocaleDateString('es-ES')}</span></p>
              </div>

              <p>La encuesta toma solo <strong>2-3 minutos</strong> de su tiempo y nos ayuda enormemente a brindar un mejor servicio.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.APP_URL || 'http://localhost:5000'}/survey/${surveyData.token}" 
                   class="cta-button"
                   style="display: inline-block; background-color: #2563eb !important; color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; border: none !important;">
                  Completar Encuesta Ahora
                </a>
              </div>
            </div>

            ${surveyData.qrCode ? `
            <div class="qr-section">
              <h3>📱 Acceso Rápido con QR</h3>
              <p>También puede escanear este código QR con su teléfono:</p>
              <img src="${surveyData.qrCode}" 
                   alt="Código QR para la encuesta" 
                   style="max-width: 200px; height: auto;" />
              <p style="font-size: 12px; color: #666;">
                Escanee con la cámara de su teléfono o una app de códigos QR
              </p>
            </div>
            ` : ''}

            <div class="survey-box">
              <h3>🎯 ¿Qué evaluaremos?</h3>
              <ul style="color: #555;">
                <li>Tiempo de espera</li>
                <li>Calidad de atención</li>
                <li>Instalaciones y comodidad</li>
                <li>Satisfacción general</li>
                <li>Recomendaciones para mejorar</li>
              </ul>
            </div>

            <p style="text-align: center; font-style: italic; color: #666;">
              Si no puede ver el botón, copie y pegue este enlace en su navegador:<br>
              <span style="word-break: break-all; color: #2563eb;">
                ${process.env.APP_URL || 'http://localhost:5000'}/survey/${surveyData.token}
              </span>
            </p>
          </div>
          
          <div class="footer">
            <p>Gracias por confiar en nosotros</p>
            <p><strong>Sistema de Gestión de Atención Plus</strong></p>
            <p>© ${new Date().getFullYear()} VacaSoft - Todos los derechos reservados</p>
            <p style="font-size: 12px; color: #999;">
              Este correo se envió automáticamente. Si no solicitó esta encuesta, puede ignorar este mensaje.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Encuesta de Satisfacción - Sistema de Gestión de Atención Plus

      Hola ${surveyData.patientName},

      Esperamos que haya tenido una excelente experiencia con nuestros servicios.

      DETALLES DEL SERVICIO:
      - Servicio: ${surveyData.serviceName}
      - Sede: ${surveyData.branchName}
      - Fecha: ${new Date().toLocaleDateString('es-ES')}

      Su opinión es muy importante para nosotros y nos ayuda a mejorar continuamente.

      Para completar la encuesta (2-3 minutos), visite:
      ${process.env.APP_URL || 'http://localhost:5000'}/survey/${surveyData.token}

      ¿Qué evaluaremos?
      - Tiempo de espera
      - Calidad de atención
      - Instalaciones y comodidad
      - Satisfacción general
      - Recomendaciones para mejorar

      Gracias por confiar en nosotros.

      Sistema de Gestión de Atención Plus
      © ${new Date().getFullYear()} VacaSoft
    `;

    await this.sendEmail({
      to: surveyData.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Verifica la conexión con el servidor SMTP
   * 
   * Utiliza el método verify() del transporter para comprobar que la
   * configuración SMTP es correcta y que el servidor está disponible.
   * Útil para diagnóstico y validación de configuración.
   * 
   * @public
   * @returns {Promise<boolean>} Promise que resuelve true si la conexión es exitosa, false en caso contrario
   * 
   * @example
   * ```typescript
   * const isConnected = await emailService.testConnection();
   * if (isConnected) {
   *   console.log('Servidor SMTP disponible');
   * } else {
   *   console.log('Error en configuración SMTP');
   * }
   * ```
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔗 Probando conexión SMTP...');
      console.log(`🔗 Host: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
      console.log(`🔗 Usuario: ${process.env.SMTP_USER}`);
      console.log(`🔗 Secure: ${process.env.SMTP_SECURE}`);
      console.log(`🔗 From: ${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`);
      
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      console.error('🔧 Verifica tu configuración SMTP en las variables de entorno');
      return false;
    }
  }

  /**
   * Envía un correo de confirmación de reserva al cliente
   * 
   * Genera y envía un correo electrónico de confirmación con los detalles
   * de la cita reservada, incluyendo información de contacto de la sucursal.
   * 
   * @public
   * @param {BookingConfirmationData} data - Datos de la reserva para la confirmación
   * @returns {Promise<void>} Promise que se resuelve cuando el correo es enviado
   * @throws {Error} Lanza error si el envío falla
   * 
   * @example
   * ```typescript
   * await emailService.sendBookingConfirmation({
   *   email: 'cliente@ejemplo.com',
   *   customerName: 'Juan Pérez',
   *   serviceName: 'Consulta General',
   *   appointmentDate: '15 de Enero, 2025',
   *   appointmentTime: '10:30',
   *   branchName: 'Clínica Central',
   *   branchAddress: 'Av. Principal 123',
   *   branchPhone: '+56 9 1234 5678',
   *   duration: 30
   * });
   * ```
   */
  async sendBookingConfirmation(data: BookingConfirmationData): Promise<void> {
    const subject = `Confirmación de Reserva - ${data.serviceName}`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Reserva</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
          .button { background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Reserva Confirmada!</h1>
            <p>Hemos recibido tu solicitud de reserva</p>
          </div>
          
          <div class="content">
            <p>Hola <strong>${data.customerName}</strong>,</p>
            
            <p>Te confirmamos que hemos recibido tu solicitud de reserva. A continuación encontrarás todos los detalles:</p>
            
            <div class="appointment-details">
              <h3 style="margin-top: 0; color: #667eea;">Detalles de tu Cita</h3>
              
              <div class="detail-row">
                <span class="detail-label">Servicio:</span>
                <span class="detail-value">${data.serviceName}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Fecha:</span>
                <span class="detail-value">${data.appointmentDate}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Hora:</span>
                <span class="detail-value">${data.appointmentTime}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Duración estimada:</span>
                <span class="detail-value">${data.duration} minutos</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Sucursal:</span>
                <span class="detail-value">${data.branchName}</span>
              </div>
              
              ${data.branchAddress ? `
              <div class="detail-row">
                <span class="detail-label">Dirección:</span>
                <span class="detail-value">${data.branchAddress}</span>
              </div>
              ` : ''}
              
              ${data.branchPhone ? `
              <div class="detail-row">
                <span class="detail-label">Teléfono:</span>
                <span class="detail-value">${data.branchPhone}</span>
              </div>
              ` : ''}
              
              ${data.notes ? `
              <div class="detail-row">
                <span class="detail-label">Notas:</span>
                <span class="detail-value">${data.notes}</span>
              </div>
              ` : ''}
            </div>
            
            ${data.dynamicFormData && data.dynamicFormData.length > 0 ? `
            <div class="appointment-details">
              <h3 style="margin-top: 0; color: #667eea;">Información Adicional del Servicio</h3>
              ${data.dynamicFormData.map(field => `
              <div class="detail-row">
                <span class="detail-label">${field.label}:</span>
                <span class="detail-value">${field.value}</span>
              </div>
              `).join('')}
            </div>
            ` : ''}
            
            ${data.confirmationCode ? `
            <div class="appointment-details" style="text-align: center; border-left-color: #28a745;">
              <h3 style="margin-top: 0; color: #28a745;">Código de Confirmación</h3>
              <p style="font-size: 24px; font-weight: bold; color: #28a745; margin: 10px 0;">${data.confirmationCode}</p>
              <p style="font-size: 14px; color: #666;">Presenta este código en la recepción para hacer check-in</p>
              
              ${data.qrCode ? `
              <div style="margin: 20px 0;">
                <img src="${data.qrCode}" 
                     alt="Código QR para check-in" 
                     style="width: 150px; height: 150px; border: 1px solid #ddd; border-radius: 8px;" />
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                  Escanea este código QR en la sede para hacer check-in automático
                </p>
              </div>
              ` : ''}
            </div>
            ` : ''}
            
            <p><strong>Importante:</strong> ${data.confirmationCode ? 'Tu cita ha sido confirmada.' : 'Esta es una solicitud de reserva. Nuestro equipo se pondrá en contacto contigo para confirmar la disponibilidad y finalizar la reserva.'}</p>
            
            <p>Si necesitas hacer algún cambio o tienes alguna pregunta, no dudes en contactarnos.</p>
          </div>
          
          <div class="footer">
            <p>Gracias por confiar en nosotros</p>
            <p><strong>${data.branchName}</strong></p>
            ${data.branchPhone ? `<p>📞 ${data.branchPhone}</p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Confirmación de Reserva - ${data.serviceName}

Hola ${data.customerName},

${data.confirmationCode ? 'Te confirmamos que tu cita ha sido agendada exitosamente:' : 'Te confirmamos que hemos recibido tu solicitud de reserva:'}

Servicio: ${data.serviceName}
Fecha: ${data.appointmentDate}
Hora: ${data.appointmentTime}
Duración: ${data.duration} minutos
Sucursal: ${data.branchName}
${data.branchAddress ? `Dirección: ${data.branchAddress}` : ''}
${data.branchPhone ? `Teléfono: ${data.branchPhone}` : ''}
${data.notes ? `Notas: ${data.notes}` : ''}

${data.confirmationCode ? `
Código de Confirmación: ${data.confirmationCode}
Presenta este código en la recepción para hacer check-in.
` : ''}

${data.dynamicFormData && data.dynamicFormData.length > 0 ? `
Información Adicional del Servicio:
${data.dynamicFormData.map(field => `${field.label}: ${field.value}`).join('\n')}
` : ''}

${data.confirmationCode ? 
  'Tu cita ha sido confirmada. Te esperamos en la fecha y hora indicadas.' : 
  'Importante: Esta es una solicitud de reserva. Nuestro equipo se pondrá en contacto contigo para confirmar la disponibilidad.'
}

Gracias por confiar en nosotros,
${data.branchName}
    `;

    await this.sendEmail({
      to: data.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Envía un correo de notificación de reprogramación de cita
   * 
   * Genera y envía un correo electrónico informando sobre el cambio
   * de fecha y hora de una cita, incluyendo los detalles originales
   * y los nuevos datos de la cita.
   * 
   * @public
   * @param {RescheduleNotificationData} data - Datos de la reprogramación
   * @returns {Promise<void>} Promise que se resuelve cuando el correo es enviado
   * @throws {Error} Lanza error si el envío falla
   * 
   * @example
   * ```typescript
   * await emailService.sendRescheduleNotification({
   *   email: 'cliente@ejemplo.com',
   *   customerName: 'Juan Pérez',
   *   serviceName: 'Consulta General',
   *   newAppointmentDate: '20 de Enero, 2025',
   *   newAppointmentTime: '14:30',
   *   originalAppointmentDate: '15 de Enero, 2025',
   *   originalAppointmentTime: '10:30',
   *   confirmationCode: 'ABC123',
   *   reason: 'Reagendamiento por disponibilidad',
   *   branchName: 'Clínica Central'
   * });
   * ```
   */
  async sendRescheduleNotification(data: RescheduleNotificationData): Promise<void> {
    const subject = `Cita Reprogramada - ${data.serviceName}`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cita Reprogramada</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          .change-highlight { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #f59e0b; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; }
          .old-value { color: #dc2626; text-decoration: line-through; }
          .new-value { color: #16a34a; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
          .confirmation-code { background: #1e40af; color: white; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0; font-size: 18px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Cita Reprogramada</h1>
            <p>Hemos actualizado los detalles de tu cita</p>
          </div>
          
          <div class="content">
            <p>Hola <strong>${data.customerName}</strong>,</p>
            
            <p>Te informamos que tu cita ha sido reprogramada. A continuación encontrarás los detalles actualizados:</p>
            
            <div class="change-highlight">
              <h3 style="margin-top: 0; color: #ea580c;">⚠️ Cambios Realizados</h3>
              <div class="detail-row">
                <span class="detail-label">Fecha original:</span>
                <span class="old-value">${data.originalAppointmentDate} - ${data.originalAppointmentTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Nueva fecha:</span>
                <span class="new-value">${data.newAppointmentDate} - ${data.newAppointmentTime}</span>
              </div>
              ${data.reason ? `
              <div class="detail-row">
                <span class="detail-label">Motivo:</span>
                <span class="detail-value">${data.reason}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="appointment-details">
              <h3 style="margin-top: 0; color: #f59e0b;">Detalles de tu Cita Actualizada</h3>
              
              <div class="detail-row">
                <span class="detail-label">Servicio:</span>
                <span class="detail-value">${data.serviceName}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Nueva Fecha:</span>
                <span class="detail-value new-value">${data.newAppointmentDate}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Nueva Hora:</span>
                <span class="detail-value new-value">${data.newAppointmentTime}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Sucursal:</span>
                <span class="detail-value">${data.branchName}</span>
              </div>
              
              ${data.branchAddress ? `
              <div class="detail-row">
                <span class="detail-label">Dirección:</span>
                <span class="detail-value">${data.branchAddress}</span>
              </div>
              ` : ''}
              
              ${data.branchPhone ? `
              <div class="detail-row">
                <span class="detail-label">Teléfono:</span>
                <span class="detail-value">${data.branchPhone}</span>
              </div>
              ` : ''}
            </div>

            <div class="confirmation-code">
              <p style="margin: 0;">Código de Confirmación</p>
              <p style="margin: 5px 0 0 0; font-size: 24px;">${data.confirmationCode}</p>
            </div>
            
            <p><strong>Importante:</strong> Conserva este código de confirmación. Lo necesitarás para hacer check-in el día de tu cita.</p>
            
            <p>Si tienes alguna pregunta o necesitas hacer algún cambio adicional, no dudes en contactarnos.</p>
            
            <p>Gracias por tu comprensión.</p>
          </div>
          
          <div class="footer">
            <p><strong>${data.branchName}</strong></p>
            ${data.branchPhone ? `<p>📞 ${data.branchPhone}</p>` : ''}
            <p>Gestión de Atención Plus</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Cita Reprogramada - ${data.serviceName}

Hola ${data.customerName},

Te informamos que tu cita ha sido reprogramada:

CAMBIOS REALIZADOS:
- Fecha original: ${data.originalAppointmentDate} - ${data.originalAppointmentTime}
- Nueva fecha: ${data.newAppointmentDate} - ${data.newAppointmentTime}
${data.reason ? `- Motivo: ${data.reason}` : ''}

DETALLES ACTUALIZADOS:
Servicio: ${data.serviceName}
Nueva Fecha: ${data.newAppointmentDate}
Nueva Hora: ${data.newAppointmentTime}
Sucursal: ${data.branchName}
${data.branchAddress ? `Dirección: ${data.branchAddress}` : ''}
${data.branchPhone ? `Teléfono: ${data.branchPhone}` : ''}

Código de Confirmación: ${data.confirmationCode}

Importante: Conserva este código de confirmación. Lo necesitarás para hacer check-in el día de tu cita.

Gracias por tu comprensión,
${data.branchName}
    `;

    await this.sendEmail({
      to: data.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Envía un correo de confirmación de cita
   * 
   * Este método envía una confirmación por correo electrónico cuando se crea una nueva cita
   * a través de la vista "Reservar Cita" en el sistema. Incluye todos los detalles de la cita
   * y el código de confirmación necesario para el check-in.
   * 
   * @async
   * @method sendAppointmentConfirmation
   * @param {AppointmentConfirmationData} data - Datos de la cita confirmada
   * @throws {Error} Si ocurre un error durante el envío del correo
   * @returns {Promise<void>}
   * 
   * @example
   * ```typescript
   * await emailService.sendAppointmentConfirmation({
   *   email: 'cliente@email.com',
   *   customerName: 'Juan Pérez',
   *   serviceName: 'Consulta General',
   *   appointmentDate: 'lunes, 15 de enero de 2024',
   *   appointmentTime: '10:30',
   *   confirmationCode: 'ABC123',
   *   branchName: 'Sede Centro',
   *   branchAddress: 'Calle Principal 123',
   *   branchPhone: '+1234567890',
   *   duration: 30
   * });
   * ```
   */
  async sendAppointmentConfirmation(data: AppointmentConfirmationData): Promise<void> {
    const subject = `Confirmación de Cita - ${data.serviceName}`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 30px; }
          .appointment-card { background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; text-align: right; }
          .confirmation-code { background-color: #e8f4fd; border: 2px solid #0066cc; padding: 15px; margin: 20px 0; text-align: center; border-radius: 5px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .success-icon { font-size: 48px; color: #28a745; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h1>¡Cita Confirmada!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${data.serviceName}</p>
          </div>
          
          <div class="content">
            <p>Hola <strong>${data.customerName}</strong>,</p>
            <p>Te confirmamos que tu cita ha sido reservada exitosamente. A continuación encuentras todos los detalles:</p>
            
            <div class="appointment-card">
              <h3 style="margin-top: 0; color: #28a745;">📅 Detalles de tu Cita</h3>
              
              <div class="detail-row">
                <span class="detail-label">Servicio:</span>
                <span class="detail-value">${data.serviceName}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Fecha:</span>
                <span class="detail-value">${data.appointmentDate}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Hora:</span>
                <span class="detail-value">${data.appointmentTime}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Duración estimada:</span>
                <span class="detail-value">${data.duration} minutos</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Sede:</span>
                <span class="detail-value">${data.branchName}</span>
              </div>
              
              ${data.branchAddress ? `
              <div class="detail-row">
                <span class="detail-label">Dirección:</span>
                <span class="detail-value">${data.branchAddress}</span>
              </div>
              ` : ''}
              
              ${data.branchPhone ? `
              <div class="detail-row">
                <span class="detail-label">Teléfono:</span>
                <span class="detail-value">${data.branchPhone}</span>
              </div>
              ` : ''}
            </div>

            <div class="confirmation-code">
              <p style="margin: 0; font-weight: bold;">Código de Confirmación</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #0066cc;">${data.confirmationCode}</p>
            </div>
            
            <p><strong>Importante:</strong> Conserva este código de confirmación. Lo necesitarás para hacer check-in el día de tu cita.</p>
            
            <h4>📋 Recomendaciones:</h4>
            <ul>
              <li>Llega 10 minutos antes de tu cita</li>
              <li>Trae tu documento de identidad</li>
              <li>Si necesitas cancelar o reprogramar, hazlo con al menos 24 horas de anticipación</li>
            </ul>
            
            <p>Si tienes alguna pregunta o necesitas hacer algún cambio, no dudes en contactarnos.</p>
            
            <p>¡Te esperamos!</p>
          </div>
          
          <div class="footer">
            <p><strong>${data.branchName}</strong></p>
            ${data.branchPhone ? `<p>📞 ${data.branchPhone}</p>` : ''}
            <p>Gestión de Atención Plus</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
¡Cita Confirmada! - ${data.serviceName}

Hola ${data.customerName},

Te confirmamos que tu cita ha sido reservada exitosamente:

DETALLES DE TU CITA:
Servicio: ${data.serviceName}
Fecha: ${data.appointmentDate}
Hora: ${data.appointmentTime}
Duración estimada: ${data.duration} minutos
Sede: ${data.branchName}
${data.branchAddress ? `Dirección: ${data.branchAddress}` : ''}
${data.branchPhone ? `Teléfono: ${data.branchPhone}` : ''}

Código de Confirmación: ${data.confirmationCode}

IMPORTANTE: Conserva este código de confirmación. Lo necesitarás para hacer check-in el día de tu cita.

RECOMENDACIONES:
- Llega 10 minutos antes de tu cita
- Trae tu documento de identidad
- Si necesitas cancelar o reprogramar, hazlo con al menos 24 horas de anticipación

¡Te esperamos!

${data.branchName}
    `;

    await this.sendEmail({
      to: data.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Envía un correo de notificación de cancelación de cita
   * 
   * Este método envía una notificación por correo electrónico cuando se cancela una cita,
   * confirmando la cancelación y proporcionando información sobre políticas de reembolso
   * si aplican.
   * 
   * @async
   * @method sendCancellationNotification
   * @param {CancellationNotificationData} data - Datos de la cita cancelada
   * @throws {Error} Si ocurre un error durante el envío del correo
   * @returns {Promise<void>}
   * 
   * @example
   * ```typescript
   * await emailService.sendCancellationNotification({
   *   email: 'cliente@email.com',
   *   customerName: 'Juan Pérez',
   *   serviceName: 'Consulta General',
   *   appointmentDate: 'lunes, 15 de enero de 2024',
   *   appointmentTime: '10:30',
   *   confirmationCode: 'ABC123',
   *   reason: 'Enfermedad',
   *   branchName: 'Sede Centro',
   *   branchAddress: 'Calle Principal 123',
   *   branchPhone: '+1234567890'
   * });
   * ```
   */
  async sendCancellationNotification(data: CancellationNotificationData): Promise<void> {
    const subject = `Cita Cancelada - ${data.serviceName}`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 30px; }
          .appointment-card { background-color: #f8f9fa; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; text-align: right; }
          .confirmation-code { background-color: #f8d7da; border: 2px solid #dc3545; padding: 15px; margin: 20px 0; text-align: center; border-radius: 5px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .cancel-icon { font-size: 48px; color: #dc3545; margin-bottom: 15px; }
          .info-box { background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; margin: 20px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="cancel-icon">❌</div>
            <h1>Cita Cancelada</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${data.serviceName}</p>
          </div>
          
          <div class="content">
            <p>Hola <strong>${data.customerName}</strong>,</p>
            <p>Te confirmamos que tu cita ha sido cancelada exitosamente. A continuación encuentras los detalles de la cita cancelada:</p>
            
            <div class="appointment-card">
              <h3 style="margin-top: 0; color: #dc3545;">📅 Detalles de la Cita Cancelada</h3>
              
              <div class="detail-row">
                <span class="detail-label">Servicio:</span>
                <span class="detail-value">${data.serviceName}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Fecha:</span>
                <span class="detail-value">${data.appointmentDate}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Hora:</span>
                <span class="detail-value">${data.appointmentTime}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Sede:</span>
                <span class="detail-value">${data.branchName}</span>
              </div>
              
              ${data.branchAddress ? `
              <div class="detail-row">
                <span class="detail-label">Dirección:</span>
                <span class="detail-value">${data.branchAddress}</span>
              </div>
              ` : ''}
              
              ${data.branchPhone ? `
              <div class="detail-row">
                <span class="detail-label">Teléfono:</span>
                <span class="detail-value">${data.branchPhone}</span>
              </div>
              ` : ''}

              ${data.reason ? `
              <div class="detail-row">
                <span class="detail-label">Motivo:</span>
                <span class="detail-value">${data.reason}</span>
              </div>
              ` : ''}
            </div>

            <div class="confirmation-code">
              <p style="margin: 0; font-weight: bold;">Código de Referencia</p>
              <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #dc3545;">${data.confirmationCode}</p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">(Cancelado)</p>
            </div>
            
            <div class="info-box">
              <h4 style="margin-top: 0; color: #0c5460;">💡 Información importante:</h4>
              <ul style="margin-bottom: 0;">
                <li>Tu horario queda disponible para otros usuarios</li>
                <li>Puedes reservar una nueva cita cuando lo necesites</li>
                <li>Si pagaste por este servicio, verifica las políticas de reembolso con la sede</li>
              </ul>
            </div>
            
            <p>Si necesitas reservar una nueva cita o tienes alguna pregunta, no dudes en contactarnos.</p>
            
            <p>Esperamos poder atenderte pronto.</p>
          </div>
          
          <div class="footer">
            <p><strong>${data.branchName}</strong></p>
            ${data.branchPhone ? `<p>📞 ${data.branchPhone}</p>` : ''}
            <p>Gestión de Atención Plus</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Cita Cancelada - ${data.serviceName}

Hola ${data.customerName},

Te confirmamos que tu cita ha sido cancelada exitosamente:

DETALLES DE LA CITA CANCELADA:
Servicio: ${data.serviceName}
Fecha: ${data.appointmentDate}
Hora: ${data.appointmentTime}
Sede: ${data.branchName}
${data.branchAddress ? `Dirección: ${data.branchAddress}` : ''}
${data.branchPhone ? `Teléfono: ${data.branchPhone}` : ''}
${data.reason ? `Motivo: ${data.reason}` : ''}

Código de Referencia: ${data.confirmationCode} (Cancelado)

INFORMACIÓN IMPORTANTE:
- Tu horario queda disponible para otros usuarios
- Puedes reservar una nueva cita cuando lo necesites
- Si pagaste por este servicio, verifica las políticas de reembolso con la sede

Si necesitas reservar una nueva cita o tienes alguna pregunta, no dudes en contactarnos.

Esperamos poder atenderte pronto.

${data.branchName}
    `;

    await this.sendEmail({
      to: data.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Envía un email personalizado con opciones específicas
   * 
   * Método público para envío de emails con contenido personalizado.
   * Útil para recordatorios y otros tipos de notificaciones.
   * 
   * @public
   * @param {EmailOptions} options - Opciones del email a enviar
   * @returns {Promise<void>} Promise que se resuelve cuando el email es enviado
   * @throws {Error} Lanza error si el envío falla
   * 
   * @example
   * ```typescript
   * await emailService.sendCustomEmail({
   *   to: 'usuario@ejemplo.com',
   *   subject: 'Recordatorio de cita',
   *   html: '<h1>Su cita es mañana</h1>'
   * });
   * ```
   */
  async sendCustomEmail(options: EmailOptions): Promise<void> {
    return this.sendEmail(options);
  }
}

/**
 * Instancia singleton del servicio de correo electrónico
 * 
 * Esta instancia está lista para ser utilizada en toda la aplicación
 * y mantiene la configuración SMTP inicializada.
 * 
 * @constant {EmailService} emailService
 * @example
 * ```typescript
 * import { emailService } from './services/email';
 * 
 * // Usar el servicio
 * await emailService.sendWelcomeEmail(userData);
 * ```
 */
export const emailService = new EmailService();
