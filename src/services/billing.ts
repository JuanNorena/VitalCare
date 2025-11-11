/**
 * Servicio de API para Facturación y Pagos.
 * 
 * Este módulo maneja todas las operaciones relacionadas con facturas y pagos,
 * incluyendo la integración con la pasarela de pagos Wompi.
 * 
 * @module services/billing
 */

import { apiClient } from './api';
import type {
  Invoice,
  Payment,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  CreatePaymentSessionRequest,
  CheckoutSignatureResponse,
  InvoiceFilters,
  InvoiceWithDetails,
  BillingStats
} from '@/types/billing';

/**
 * Servicio de Facturas (Invoices).
 * 
 * Gestiona todas las operaciones CRUD relacionadas con facturas médicas.
 */
export const invoicesService = {
  /**
   * Obtiene todas las facturas del usuario actual.
   * 
   * El backend filtrará automáticamente según el rol:
   * - Pacientes: Solo sus propias facturas
   * - Doctores: Facturas de sus consultas
   * - Admin/Personal: Todas las facturas
   * 
   * @param filters - Filtros opcionales para la consulta
   * @returns Promise con array de facturas
   * 
   * @example
   * ```typescript
   * const facturas = await invoicesService.getAll({ status: 'PENDING' });
   * ```
   */
  getAll: async (filters?: InvoiceFilters): Promise<Invoice[]> => {
    const params = new URLSearchParams();
    
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.patientId) {
      params.append('patientId', filters.patientId);
    }
    if (filters?.from) {
      params.append('from', filters.from);
    }
    if (filters?.to) {
      params.append('to', filters.to);
    }

    const queryString = params.toString();
    const url = queryString ? `/invoices?${queryString}` : '/invoices';
    
    const data = await apiClient.get<Invoice[]>(url);
    return data;
  },

  /**
   * Obtiene una factura por su ID, incluyendo detalles extendidos.
   * 
   * @param id - UUID de la factura
   * @returns Promise con los datos de la factura
   * 
   * @throws {Error} Si la factura no existe o el usuario no tiene permisos
   * 
   * @example
   * ```typescript
   * const factura = await invoicesService.getById('uuid-123');
   * console.log(factura.patientName, factura.total);
   * ```
   */
  getById: async (id: string): Promise<InvoiceWithDetails> => {
    const data = await apiClient.get<InvoiceWithDetails>(`/invoices/${id}`);
    return data;
  },

  /**
   * Obtiene facturas pendientes de pago del usuario actual.
   * 
   * @returns Promise con array de facturas pendientes
   * 
   * @example
   * ```typescript
   * const pendientes = await invoicesService.getPending();
   * if (pendientes.length > 0) {
   *   console.log('Tienes facturas por pagar');
   * }
   * ```
   */
  getPending: async (): Promise<Invoice[]> => {
    return invoicesService.getAll({ status: 'PENDING' });
  },

  /**
   * Obtiene facturas pagadas del usuario actual.
   * 
   * @returns Promise con array de facturas pagadas
   */
  getPaid: async (): Promise<Invoice[]> => {
    return invoicesService.getAll({ status: 'PAID' });
  },

  /**
   * Crea una nueva factura.
   * 
   * Generalmente llamado automáticamente cuando un doctor
   * finaliza una consulta médica.
   * 
   * @param invoice - Datos de la nueva factura
   * @returns Promise con la factura creada
   * 
   * @example
   * ```typescript
   * const nuevaFactura = await invoicesService.create({
   *   patientId: 'uuid-paciente',
   *   consultationId: 'uuid-consulta',
   *   total: 50000
   * });
   * ```
   */
  create: async (invoice: CreateInvoiceDto): Promise<Invoice> => {
    const data = await apiClient.post<Invoice>('/invoices', invoice);
    return data;
  },

  /**
   * Actualiza una factura existente.
   * 
   * Solo permitido para facturas en estado PENDING.
   * 
   * @param id - UUID de la factura
   * @param updates - Campos a actualizar
   * @returns Promise con la factura actualizada
   * 
   * @example
   * ```typescript
   * const actualizada = await invoicesService.update('uuid-123', {
   *   total: 55000
   * });
   * ```
   */
  update: async (id: string, updates: UpdateInvoiceDto): Promise<Invoice> => {
    const data = await apiClient.put<Invoice>(`/invoices/${id}`, updates);
    return data;
  },

  /**
   * Cancela una factura.
   * 
   * Cambia el estado a CANCELLED. Solo permitido para facturas PENDING.
   * 
   * @param id - UUID de la factura
   * @returns Promise con la factura cancelada
   * 
   * @example
   * ```typescript
   * await invoicesService.cancel('uuid-123');
   * ```
   */
  cancel: async (id: string): Promise<Invoice> => {
    const data = await apiClient.put<Invoice>(`/invoices/${id}/cancel`, {});
    return data;
  },

  /**
   * Elimina una factura (soft delete).
   * 
   * @param id - UUID de la factura
   * @returns Promise void
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/invoices/${id}`);
  },

  /**
   * Obtiene estadísticas de facturación.
   * 
   * @returns Promise con estadísticas agregadas
   * 
   * @example
   * ```typescript
   * const stats = await invoicesService.getStats();
   * console.log(`Total facturado: $${stats.totalAmount}`);
   * ```
   */
  getStats: async (): Promise<BillingStats> => {
    const data = await apiClient.get<BillingStats>('/invoices/stats');
    return data;
  },

  /**
   * Descarga el comprobante de una factura en PDF.
   * 
   * @param id - UUID de la factura
   * @returns Promise con el Blob del PDF
   * 
   * @example
   * ```typescript
   * const pdf = await invoicesService.downloadReceipt('uuid-123');
   * const url = URL.createObjectURL(pdf);
   * window.open(url);
   * ```
   */
  downloadReceipt: async (id: string): Promise<Blob> => {
    // TODO: Implementar descarga de blob cuando el backend lo soporte
    const response = await fetch(`/invoices/${id}/receipt`);
    const blob = await response.blob();
    return blob;
  },
};

/**
 * Servicio de Pagos (Payments).
 * 
 * Gestiona pagos y la integración con Wompi.
 */
export const paymentsService = {
  /**
   * Obtiene todos los pagos de una factura específica.
   * 
   * @param invoiceId - UUID de la factura
   * @returns Promise con array de pagos
   * 
   * @example
   * ```typescript
   * const pagos = await paymentsService.getByInvoice('uuid-factura');
   * ```
   */
  getByInvoice: async (invoiceId: string): Promise<Payment[]> => {
    const data = await apiClient.get<Payment[]>(`/payments/invoice/${invoiceId}`);
    return data;
  },

  /**
   * Obtiene un pago por su ID.
   * 
   * @param id - UUID del pago
   * @returns Promise con los datos del pago
   */
  getById: async (id: string): Promise<Payment> => {
    const data = await apiClient.get<Payment>(`/payments/${id}`);
    return data;
  },

  /**
   * Crea una sesión de pago con Wompi.
   * 
   * Este endpoint genera todos los datos necesarios para abrir el checkout
   * de Wompi, incluyendo la firma de integridad.
   * 
   * @param request - Datos de la solicitud (invoiceId y currency)
   * @returns Promise con los datos de la sesión de pago
   * 
   * @example
   * ```typescript
   * const session = await paymentsService.createSession({
   *   invoiceId: 'uuid-factura',
   *   currency: 'COP'
   * });
   * 
   * // Usar session para abrir el widget de Wompi
   * const checkout = new WidgetCheckout({
   *   currency: session.currency,
   *   amountInCents: session.amountInCents,
   *   reference: session.reference,
   *   publicKey: session.publicKey,
   *   signature: {
   *     integrity: session.signature
   *   }
   * });
   * 
   * checkout.open();
   * ```
   */
  createSession: async (request: CreatePaymentSessionRequest): Promise<CheckoutSignatureResponse> => {
    const data = await apiClient.post<CheckoutSignatureResponse>('/payments/session', request);
    return data;
  },

  /**
   * Verifica el estado de un pago por su referencia.
   * 
   * Útil para hacer polling después de iniciar un pago y verificar
   * si el webhook ya actualizó el estado.
   * 
   * @param reference - Referencia del pago
   * @returns Promise con el pago encontrado o null
   * 
   * @example
   * ```typescript
   * const payment = await paymentsService.checkStatus('INV-123456');
   * if (payment?.status === 'APPROVED') {
   *   console.log('Pago aprobado!');
   * }
   * ```
   */
  checkStatus: async (reference: string): Promise<Payment | null> => {
    try {
      const data = await apiClient.get<Payment>(`/payments/reference/${reference}`);
      return data;
    } catch (error) {
      return null;
    }
  },

  /**
   * Registra un pago manual (efectivo, transferencia, etc.).
   * 
   * Solo disponible para personal administrativo.
   * 
   * @param payment - Datos del pago manual
   * @returns Promise con el pago registrado
   * 
   * @example
   * ```typescript
   * const pago = await paymentsService.registerManualPayment({
   *   invoiceId: 'uuid-factura',
   *   amount: 50000,
   *   method: 'CASH',
   *   paymentDate: new Date().toISOString()
   * });
   * ```
   */
  registerManualPayment: async (payment: {
    invoiceId: string;
    amount: number;
    method: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'INSURANCE';
    paymentDate: string;
  }): Promise<Payment> => {
    const data = await apiClient.post<Payment>('/payments/manual', payment);
    return data;
  },
};

/**
 * Helpers para formateo de datos de facturación.
 */
export const billingHelpers = {
  /**
   * Formatea un monto monetario a string con separadores de miles.
   * 
   * @param amount - Monto a formatear
   * @param currency - Código de moneda (default: 'COP')
   * @returns String formateado
   * 
   * @example
   * ```typescript
   * formatCurrency(50000); // "$50,000 COP"
   * formatCurrency(1234567.89); // "$1,234,567.89 COP"
   * ```
   */
  formatCurrency: (amount: number, currency: string = 'COP'): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  /**
   * Convierte pesos a centavos (para Wompi).
   * 
   * @param amount - Monto en pesos
   * @returns Monto en centavos
   * 
   * @example
   * ```typescript
   * toC entavos(500); // 50000
   * toCentavos(1234.56); // 123456
   * ```
   */
  toCentavos: (amount: number): number => {
    return Math.round(amount * 100);
  },

  /**
   * Convierte centavos a pesos.
   * 
   * @param centavos - Monto en centavos
   * @returns Monto en pesos
   */
  toPesos: (centavos: number): number => {
    return centavos / 100;
  },

  /**
   * Obtiene el color asociado a un estado de factura.
   * 
   * @param status - Estado de la factura
   * @returns Color en formato Tailwind
   */
  getInvoiceStatusColor: (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  },

  /**
   * Obtiene el texto en español para un estado de factura.
   * 
   * @param status - Estado de la factura
   * @returns Texto en español
   */
  getInvoiceStatusText: (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'PAID':
        return 'Pagada';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status;
    }
  },

  /**
   * Obtiene el color asociado a un estado de pago.
   * 
   * @param status - Estado del pago
   * @returns Color en formato Tailwind
   */
  getPaymentStatusColor: (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'DECLINED':
        return 'bg-red-100 text-red-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'VOIDED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  },

  /**
   * Obtiene el texto en español para un estado de pago.
   * 
   * @param status - Estado del pago
   * @returns Texto en español
   */
  getPaymentStatusText: (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'APPROVED':
        return 'Aprobado';
      case 'DECLINED':
        return 'Rechazado';
      case 'ERROR':
        return 'Error';
      case 'VOIDED':
        return 'Anulado';
      default:
        return status;
    }
  },
};
