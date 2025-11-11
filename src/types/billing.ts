/**
 * Tipos TypeScript para el módulo de Facturación y Pagos.
 * 
 * Este archivo define todas las interfaces y tipos relacionados con
 * el proceso de facturación y cobro de servicios médicos, incluyendo
 * la integración con la pasarela de pagos Wompi.
 * 
 * @module types/billing
 */

/**
 * Estados posibles de una factura en el sistema.
 */
export type InvoiceStatus = 'PENDING' | 'PAID' | 'CANCELLED';

/**
 * Estados posibles de un pago (alineados con Wompi).
 */
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED';

/**
 * Métodos de pago disponibles en el sistema.
 */
export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'INSURANCE' | 'WOMPI';

/**
 * Interfaz principal para una factura médica.
 * 
 * Representa una factura generada por servicios médicos prestados,
 * típicamente vinculada a una consulta médica completada.
 */
export interface Invoice {
  /** Identificador único de la factura (UUID) */
  id: string;
  
  /** ID del paciente al que pertenece la factura */
  patientId: string;
  
  /** ID de la consulta médica asociada (opcional) */
  consultationId?: string;
  
  /** Monto total de la factura */
  total: number;
  
  /** Estado actual de la factura */
  status: InvoiceStatus;
  
  /** Fecha de creación de la factura */
  createdAt: string;
  
  /** Fecha de última actualización */
  updatedAt: string;
}

/**
 * Interfaz para un registro de pago.
 * 
 * Representa un pago realizado o intentado para una factura específica.
 * Incluye información de la transacción con Wompi si aplica.
 */
export interface Payment {
  /** Identificador único del pago (UUID) */
  id: string;
  
  /** ID de la factura asociada */
  invoiceId: string;
  
  /** Monto del pago */
  amount: number;
  
  /** Método de pago utilizado */
  method: PaymentMethod;
  
  /** Fecha y hora del pago */
  paymentDate: string;
  
  /** Referencia única del pago (generada para Wompi) */
  reference?: string;
  
  /** ID de transacción de Wompi */
  transactionId?: string;
  
  /** Estado actual del pago */
  status: PaymentStatus;
}

/**
 * DTO para crear una nueva factura.
 */
export interface CreateInvoiceDto {
  /** ID del paciente */
  patientId: string;
  
  /** ID de la consulta (opcional) */
  consultationId?: string;
  
  /** Monto total de la factura */
  total: number;
}

/**
 * DTO para actualizar una factura existente.
 */
export interface UpdateInvoiceDto {
  /** Nuevo monto total (opcional) */
  total?: number;
  
  /** Nuevo estado (opcional) */
  status?: InvoiceStatus;
}

/**
 * Solicitud para crear una sesión de pago con Wompi.
 */
export interface CreatePaymentSessionRequest {
  /** ID de la factura a pagar */
  invoiceId: string;
  
  /** Código de moneda (ej: "COP" para pesos colombianos) */
  currency: string;
}

/**
 * Respuesta con los datos necesarios para iniciar el checkout de Wompi.
 * 
 * Contiene toda la información requerida para abrir el widget de pago
 * de Wompi en el frontend.
 */
export interface CheckoutSignatureResponse {
  /** Referencia única de la transacción */
  reference: string;
  
  /** Monto en centavos (ej: 5000000 = $50,000 COP) */
  amountInCents: number;
  
  /** Código de moneda */
  currency: string;
  
  /** Firma MD5 de integridad */
  signature: string;
  
  /** Llave pública de Wompi para el checkout */
  publicKey: string;
}

/**
 * Configuración para el widget de checkout de Wompi.
 */
export interface WompiCheckoutConfig {
  /** Código de moneda */
  currency: string;
  
  /** Monto en centavos */
  amountInCents: number;
  
  /** Referencia de la transacción */
  reference: string;
  
  /** Llave pública de Wompi */
  publicKey: string;
  
  /** Objeto con la firma de integridad */
  signature: {
    integrity: string;
  };
  
  /** URL de redirección después del pago (opcional) */
  redirectUrl?: string;
  
  /** Tema del widget (opcional) */
  theme?: 'light' | 'dark';
}

/**
 * Resultado del proceso de pago en Wompi.
 */
export interface WompiCheckoutResult {
  /** Información de la transacción */
  transaction?: {
    /** ID de la transacción en Wompi */
    id: string;
    
    /** Estado de la transacción */
    status: 'APPROVED' | 'DECLINED' | 'PENDING' | 'ERROR';
    
    /** Referencia de la transacción */
    reference: string;
    
    /** Monto en centavos */
    amount_in_cents: number;
    
    /** Fecha de la transacción */
    created_at: string;
  };
  
  /** Errores si los hay */
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Filtros para consultar facturas.
 */
export interface InvoiceFilters {
  /** Filtrar por estado */
  status?: InvoiceStatus;
  
  /** Filtrar por ID de paciente */
  patientId?: string;
  
  /** Fecha desde (ISO 8601) */
  from?: string;
  
  /** Fecha hasta (ISO 8601) */
  to?: string;
}

/**
 * Factura con información extendida del paciente y consulta.
 */
export interface InvoiceWithDetails extends Invoice {
  /** Nombre completo del paciente */
  patientName?: string;
  
  /** Email del paciente */
  patientEmail?: string;
  
  /** Motivo de la consulta */
  consultationReason?: string;
  
  /** Fecha de la consulta */
  consultationDate?: string;
  
  /** Nombre del doctor que atendió */
  doctorName?: string;
  
  /** Lista de pagos asociados a esta factura */
  payments?: Payment[];
}

/**
 * Estadísticas de facturación.
 */
export interface BillingStats {
  /** Total de facturas */
  totalInvoices: number;
  
  /** Facturas pendientes de pago */
  pendingInvoices: number;
  
  /** Facturas pagadas */
  paidInvoices: number;
  
  /** Facturas canceladas */
  cancelledInvoices: number;
  
  /** Monto total facturado */
  totalAmount: number;
  
  /** Monto total cobrado */
  collectedAmount: number;
  
  /** Monto pendiente de cobro */
  pendingAmount: number;
  
  /** Promedio de días para pago */
  averageDaysToPay?: number;
  
  /** Tasa de éxito de pagos (%) */
  paymentSuccessRate?: number;
}
