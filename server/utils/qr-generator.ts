import QRCode from 'qrcode';
import { type Appointment } from '@db/schema';

/**
 * Estructura de datos que se incluye en los códigos QR para citas médicas.
 * 
 * Esta interfaz define el formato estándar de los datos que se codifican
 * en formato JSON dentro de cada código QR generado para citas y turnos.
 * 
 * @interface QRAppointmentData
 * @example
 * ```typescript
 * const qrData: QRAppointmentData = {
 *   appointmentId: 123,
 *   confirmationCode: 'ABC12345',
 *   type: 'appointment',
 *   scheduledAt: '2025-06-16T10:00:00.000Z',
 *   serviceId: 1,
 *   servicePointId: 2,
 *   userId: 456
 * };
 * ```
 */
interface QRAppointmentData {
  /** ID único de la cita en la base de datos */
  appointmentId: number;
  
  /** Código de confirmación alfanumérico de 8 caracteres */
  confirmationCode: string;
  
  /** Tipo de cita: 'appointment' para citas regulares, 'turn' para autoservicio, 'public' para citas públicas */
  type: 'appointment' | 'turn' | 'public';
  
  /** Fecha y hora programada de la cita en formato ISO 8601 */
  scheduledAt: string;
  
  /** ID del servicio médico asociado a la cita */
  serviceId: number;
  
  /** ID del punto de atención asignado (opcional hasta el check-in) */
  servicePointId?: number;
  
  /** ID del usuario que agendó la cita (opcional para citas públicas) */
  userId?: number;
  
  /** Datos del cliente para citas públicas anónimas */
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
}

/**
 * Genera los datos estructurados que se incluirán en el código QR.
 * 
 * Transforma la información de una cita médica en un objeto estandarizado
 * que será serializado como JSON y codificado en el código QR. Maneja
 * valores opcionales y conversiones de tipos necesarias.
 * 
 * @function generateQRData
 * @param {Appointment} appointment - Objeto de cita médica de la base de datos
 * @returns {QRAppointmentData} Objeto estructurado con los datos para el QR
 * 
 * @example
 * ```typescript
 * const appointment = {
 *   id: 123,
 *   confirmationCode: 'ABC12345',
 *   type: 'appointment',
 *   scheduledAt: new Date('2025-06-16T10:00:00Z'),
 *   serviceId: 1,
 *   servicePointId: 2,
 *   userId: 456
 * };
 * 
 * const qrData = generateQRData(appointment);
 * console.log(qrData.scheduledAt); // '2025-06-16T10:00:00.000Z'
 * ```
 * 
 * @since 1.0.0
 */
export function generateQRData(appointment: Appointment): QRAppointmentData {
  const baseData = {
    appointmentId: appointment.id,
    confirmationCode: appointment.confirmationCode || '',
    type: appointment.type as 'appointment' | 'turn' | 'public',
    scheduledAt: appointment.scheduledAt.toISOString(),
    serviceId: appointment.serviceId,
    servicePointId: appointment.servicePointId || undefined,
  };

  // Para citas públicas, incluir datos del huésped en lugar del userId
  if (appointment.type === 'public') {
    return {
      ...baseData,
      guestName: appointment.guestName || undefined,
      guestEmail: appointment.guestEmail || undefined,
      guestPhone: appointment.guestPhone || undefined
    };
  }

  // Para citas regulares, incluir userId
  return {
    ...baseData,
    userId: appointment.userId || undefined
  };
}

/**
 * Genera un código QR en formato base64 para una cita médica.
 * 
 * Crea un código QR que contiene todos los datos necesarios de la cita
 * en formato JSON. El QR generado incluye configuraciones optimizadas
 * para escaneado y visualización, con colores estándar y tamaño apropiado.
 * 
 * @async
 * @function generateAppointmentQR
 * @param {Appointment} appointment - Datos completos de la cita médica
 * @returns {Promise<string>} Promesa que resuelve con el código QR en formato base64 (data URL)
 * @throws {Error} Si ocurre un error durante la generación del código QR
 * 
 * @example
 * ```typescript
 * try {
 *   const appointment = await getAppointmentById(123);
 *   const qrCode = await generateAppointmentQR(appointment);
 *   
 *   // qrCode será algo como: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 *   res.json({ qrCode });
 * } catch (error) {
 *   console.error('Error al generar QR:', error);
 * }
 * ```
 * 
 * @see {@link generateQRData} Para la estructura de datos del QR
 * @see {@link https://www.npmjs.com/package/qrcode} Documentación de la librería QRCode
 * @since 1.0.0
 */
export async function generateAppointmentQR(appointment: Appointment): Promise<string> {  try {
    // Generar datos estructurados para el QR
    const qrData = generateQRData(appointment);
    
    // Convertir a JSON string para codificar en el QR
    const qrPayload = JSON.stringify(qrData);
    
    // Generar QR con configuraciones optimizadas
    const qrCode = await QRCode.toDataURL(qrPayload, {
      margin: 1,                    // Margen mínimo para mejor escaneado
      color: {
        dark: '#000000',            // Color negro para alta legibilidad
        light: '#FFFFFF'            // Fondo blanco para contraste máximo
      },
      width: 256,                   // Tamaño del QR en píxeles (256x256)
    });

    return qrCode;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Genera un código QR específicamente para turnos de autoservicio.
 * 
 * Función especializada para generar códigos QR para turnos obtenidos
 * a través del sistema de autoservicio. Utiliza la misma lógica que
 * generateAppointmentQR pero está separada para mayor claridad semántica.
 * 
 * @async
 * @function generateTurnQR
 * @param {Appointment} appointment - Datos del turno de autoservicio
 * @returns {Promise<string>} Promesa que resuelve con el código QR en formato base64
 * @throws {Error} Si ocurre un error durante la generación del código QR
 * 
 * @example
 * ```typescript
 * // Para turnos generados en autoservicio
 * const turnAppointment = {
 *   ...appointmentData,
 *   type: 'turn'  // Marcado como turno de autoservicio
 * };
 * 
 * const turnQR = await generateTurnQR(turnAppointment);
 * ```
 * 
 * @see {@link generateAppointmentQR} Implementación base para generación de QR
 * @since 1.0.0
 */
export async function generateTurnQR(appointment: Appointment): Promise<string> {
  return generateAppointmentQR(appointment);
}

/**
 * Valida y deserializa los datos de un código QR escaneado.
 * 
 * Procesa el contenido JSON de un código QR escaneado, valida la estructura
 * de datos y los tipos requeridos. Proporciona validación robusta para
 * prevenir errores de datos malformados o códigos QR inválidos.
 * 
 * @function parseQRData
 * @param {string} qrData - Contenido JSON del código QR escaneado como string
 * @returns {QRAppointmentData | null} Datos parseados y validados, o null si son inválidos
 * 
 * @example
 * ```typescript
 * // Procesar QR escaneado
 * const scannedContent = '{"appointmentId":123,"confirmationCode":"ABC12345","type":"appointment",...}';
 * const qrData = parseQRData(scannedContent);
 * 
 * if (qrData) {
 *   console.log(`Cita ${qrData.appointmentId} con código ${qrData.confirmationCode}`);
 *   // Proceder con check-in
 * } else {
 *   console.error('Código QR inválido');
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Casos de validación
 * parseQRData('{"appointmentId":123}');           // null - faltan campos requeridos
 * parseQRData('{"type":"invalid"}');              // null - tipo inválido
 * parseQRData('invalid json');                    // null - JSON malformado
 * parseQRData('{"appointmentId":123,"confirmationCode":"ABC","type":"appointment"}'); // válido
 * ```
 * 
 * @since 1.0.0
 */
export function parseQRData(qrData: string): QRAppointmentData | null {  try {
    // Intentar parsear el JSON del QR
    const parsed = JSON.parse(qrData) as QRAppointmentData;
    
    // Validar campos requeridos obligatorios
    if (!parsed.appointmentId || !parsed.confirmationCode || !parsed.type) {
      return null;
    }
    
    // Validar que el tipo sea uno de los valores permitidos
    if (!['appointment', 'turn'].includes(parsed.type)) {
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('Error parsing QR data:', error);
    return null;
  }
}

/**
 * Genera un código de confirmación único para nuevas citas médicas.
 * 
 * Crea un código alfanumérico aleatorio de 8 caracteres utilizando
 * letras mayúsculas y números. El código generado es único por ejecución
 * pero no garantiza unicidad global (debe validarse en la base de datos).
 * 
 * @function generateConfirmationCode
 * @returns {string} Código alfanumérico de exactamente 8 caracteres
 * 
 * @example
 * ```typescript
 * // Generar múltiples códigos
 * const code1 = generateConfirmationCode(); // "A3B7F9K2"
 * const code2 = generateConfirmationCode(); // "M8N4P1Q6"
 * const code3 = generateConfirmationCode(); // "X2Y5Z8W3"
 * 
 * // Usar en creación de citas
 * const newAppointment = {
 *   ...appointmentData,
 *   confirmationCode: generateConfirmationCode()
 * };
 * ```
 * 
 * @example
 * ```typescript
 * // Validar unicidad en base de datos
 * let confirmationCode;
 * let isUnique = false;
 * 
 * do {
 *   confirmationCode = generateConfirmationCode();
 *   const existing = await db.select().from(appointments)
 *     .where(eq(appointments.confirmationCode, confirmationCode));
 *   isUnique = existing.length === 0;
 * } while (!isUnique);
 * ```
 * 
 * @since 1.0.0
 * @todo Considerar implementar validación de unicidad integrada
 * @todo Evaluar uso de algoritmos criptográficos para mayor seguridad
 */
export function generateConfirmationCode(): string {
  // Caracteres permitidos: letras mayúsculas y números (excluyendo caracteres ambiguos)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // Generar código de exactamente 8 caracteres
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Genera un código QR para una encuesta de satisfacción.
 * 
 * Crea un código QR que contiene la información necesaria para acceder
 * directamente a una encuesta de satisfacción usando el token único.
 * 
 * @param {string} surveyToken - Token único de la encuesta
 * @param {string} [baseUrl] - URL base de la aplicación (opcional)
 * @returns {Promise<string>} Promise que resuelve a una string base64 del QR
 * @throws {Error} Si falla la generación del código QR
 * 
 * @example
 * ```typescript
 * const qrCode = await generateSurveyQR('abc123token');
 * // Resultado: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 * ```
 */
export async function generateSurveyQR(surveyToken: string, baseUrl?: string): Promise<string> {
  try {
    const appUrl = baseUrl || process.env.APP_URL || 'http://localhost:5000';
    
    // Datos estructurados para el QR de encuesta
    const qrData = {
      type: 'survey',
      token: surveyToken,
      url: `${appUrl}/survey/${surveyToken}`,
      timestamp: new Date().toISOString()
    };
    
    // Convertir a JSON string para codificar en el QR
    const qrPayload = JSON.stringify(qrData);
    
    // Generar QR con configuraciones optimizadas para encuestas
    const qrCode = await QRCode.toDataURL(qrPayload, {
      margin: 1,
      color: {
        dark: '#2563eb',    // Color azul corporativo
        light: '#FFFFFF'    // Fondo blanco
      },
      errorCorrectionLevel: 'M',  // Nivel medio de corrección de errores
      width: 300           // Tamaño apropiado para emails e impresión
    });
    
    console.log(`✅ QR de encuesta generado exitosamente para token: ${surveyToken}`);
    return qrCode;
    
  } catch (error) {
    console.error('❌ Error generando QR de encuesta:', error);
    throw new Error(`Fallo en la generación del código QR de encuesta: ${error}`);
  }
}
