/**
 * Hook personalizado para gestionar facturación y pagos.
 * 
 * Proporciona acceso a todas las operaciones de facturas y pagos con
 * React Query para caching, sincronización y manejo de estado optimizado.
 * 
 * @module hooks/useBilling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesService, paymentsService } from '@/services/billing';
import type {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  CreatePaymentSessionRequest,
  InvoiceFilters,
} from '@/types/billing';

/**
 * Query keys para React Query.
 * Centralizadas para fácil invalidación y sincronización.
 */
export const billingKeys = {
  all: ['billing'] as const,
  invoices: () => [...billingKeys.all, 'invoices'] as const,
  invoicesList: (filters?: InvoiceFilters) => [...billingKeys.invoices(), 'list', filters] as const,
  invoice: (id: string) => [...billingKeys.invoices(), 'detail', id] as const,
  invoicesPending: () => [...billingKeys.invoices(), 'pending'] as const,
  invoicesPaid: () => [...billingKeys.invoices(), 'paid'] as const,
  invoicesStats: () => [...billingKeys.invoices(), 'stats'] as const,
  payments: () => [...billingKeys.all, 'payments'] as const,
  paymentsByInvoice: (invoiceId: string) => [...billingKeys.payments(), 'invoice', invoiceId] as const,
  payment: (id: string) => [...billingKeys.payments(), 'detail', id] as const,
  paymentByReference: (reference: string) => [...billingKeys.payments(), 'reference', reference] as const,
};

/**
 * Hook para obtener la lista de facturas con filtros opcionales.
 * 
 * @param filters - Filtros opcionales para la consulta
 * @param options - Opciones de React Query
 * @returns Query con las facturas
 * 
 * @example
 * ```typescript
 * const { data: facturas, isLoading, error } = useInvoices({ 
 *   status: 'PENDING' 
 * });
 * ```
 */
export function useInvoices(filters?: InvoiceFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: billingKeys.invoicesList(filters),
    queryFn: () => invoicesService.getAll(filters),
    staleTime: 30000, // 30 segundos
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook para obtener una factura específica con detalles extendidos.
 * 
 * @param id - UUID de la factura
 * @param options - Opciones de React Query
 * @returns Query con los datos de la factura
 * 
 * @example
 * ```typescript
 * const { data: factura, isLoading } = useInvoice(invoiceId);
 * if (factura) {
 *   console.log(factura.patientName, factura.total);
 * }
 * ```
 */
export function useInvoice(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: billingKeys.invoice(id),
    queryFn: () => invoicesService.getById(id),
    staleTime: 60000, // 1 minuto
    enabled: options?.enabled ?? !!id,
  });
}

/**
 * Hook para obtener facturas pendientes de pago.
 * 
 * @returns Query con las facturas pendientes
 * 
 * @example
 * ```typescript
 * const { data: pendientes, isLoading } = usePendingInvoices();
 * ```
 */
export function usePendingInvoices() {
  return useQuery({
    queryKey: billingKeys.invoicesPending(),
    queryFn: () => invoicesService.getPending(),
    staleTime: 30000,
  });
}

/**
 * Hook para obtener facturas pagadas.
 * 
 * @returns Query con las facturas pagadas
 */
export function usePaidInvoices() {
  return useQuery({
    queryKey: billingKeys.invoicesPaid(),
    queryFn: () => invoicesService.getPaid(),
    staleTime: 60000,
  });
}

/**
 * Hook para obtener estadísticas de facturación.
 * 
 * @returns Query con las estadísticas
 * 
 * @example
 * ```typescript
 * const { data: stats } = useBillingStats();
 * if (stats) {
 *   console.log(`Total: ${stats.totalAmount}`);
 * }
 * ```
 */
export function useBillingStats() {
  return useQuery({
    queryKey: billingKeys.invoicesStats(),
    queryFn: () => invoicesService.getStats(),
    staleTime: 120000, // 2 minutos
  });
}

/**
 * Hook para crear una nueva factura.
 * 
 * @returns Mutation para crear facturas
 * 
 * @example
 * ```typescript
 * const { mutate: crearFactura, isPending } = useCreateInvoice();
 * 
 * crearFactura({
 *   patientId: 'uuid',
 *   consultationId: 'uuid',
 *   total: 50000
 * }, {
 *   onSuccess: (factura) => {
 *     console.log('Factura creada:', factura.id);
 *   },
 *   onError: (error) => {
 *     console.error('Error:', error.message);
 *   }
 * });
 * ```
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoice: CreateInvoiceDto) => invoicesService.create(invoice),
    onSuccess: () => {
      // Invalidar todas las queries de facturas para refrescar los datos
      queryClient.invalidateQueries({ queryKey: billingKeys.invoices() });
      queryClient.invalidateQueries({ queryKey: billingKeys.invoicesStats() });
    },
  });
}

/**
 * Hook para actualizar una factura existente.
 * 
 * @returns Mutation para actualizar facturas
 * 
 * @example
 * ```typescript
 * const { mutate: actualizarFactura } = useUpdateInvoice();
 * 
 * actualizarFactura({
 *   id: 'uuid-factura',
 *   updates: { total: 55000 }
 * });
 * ```
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateInvoiceDto }) =>
      invoicesService.update(id, updates),
    onSuccess: (data) => {
      // Actualizar el cache de la factura específica
      queryClient.setQueryData(billingKeys.invoice(data.id), data);
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: billingKeys.invoicesList() });
      queryClient.invalidateQueries({ queryKey: billingKeys.invoicesStats() });
    },
  });
}

/**
 * Hook para cancelar una factura.
 * 
 * @returns Mutation para cancelar facturas
 * 
 * @example
 * ```typescript
 * const { mutate: cancelarFactura, isPending } = useCancelInvoice();
 * 
 * cancelarFactura('uuid-factura', {
 *   onSuccess: () => {
 *     alert('Factura cancelada');
 *   }
 * });
 * ```
 */
export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoicesService.cancel(id),
    onSuccess: (data) => {
      queryClient.setQueryData(billingKeys.invoice(data.id), data);
      queryClient.invalidateQueries({ queryKey: billingKeys.invoicesList() });
      queryClient.invalidateQueries({ queryKey: billingKeys.invoicesStats() });
    },
  });
}

/**
 * Hook para eliminar una factura.
 * 
 * @returns Mutation para eliminar facturas
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoicesService.delete(id),
    onSuccess: (_, id) => {
      // Remover del cache
      queryClient.removeQueries({ queryKey: billingKeys.invoice(id) });
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: billingKeys.invoicesList() });
      queryClient.invalidateQueries({ queryKey: billingKeys.invoicesStats() });
    },
  });
}

/**
 * Hook para obtener los pagos de una factura específica.
 * 
 * @param invoiceId - UUID de la factura
 * @param options - Opciones de React Query
 * @returns Query con los pagos
 * 
 * @example
 * ```typescript
 * const { data: pagos } = usePaymentsByInvoice(invoiceId);
 * ```
 */
export function usePaymentsByInvoice(invoiceId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: billingKeys.paymentsByInvoice(invoiceId),
    queryFn: () => paymentsService.getByInvoice(invoiceId),
    staleTime: 30000,
    enabled: options?.enabled ?? !!invoiceId,
  });
}

/**
 * Hook para obtener un pago específico.
 * 
 * @param id - UUID del pago
 * @param options - Opciones de React Query
 * @returns Query con el pago
 */
export function usePayment(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: billingKeys.payment(id),
    queryFn: () => paymentsService.getById(id),
    staleTime: 60000,
    enabled: options?.enabled ?? !!id,
  });
}

/**
 * Hook para crear una sesión de pago con Wompi.
 * 
 * @returns Mutation para crear sesiones de pago
 * 
 * @example
 * ```typescript
 * const { mutate: crearSesion, isPending } = useCreatePaymentSession();
 * 
 * crearSesion({
 *   invoiceId: 'uuid-factura',
 *   currency: 'COP'
 * }, {
 *   onSuccess: (session) => {
 *     // Abrir checkout de Wompi con session
 *     openWompiCheckout(session);
 *   }
 * });
 * ```
 */
export function useCreatePaymentSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreatePaymentSessionRequest) =>
      paymentsService.createSession(request),
    onSuccess: (_, variables) => {
      // Invalidar pagos de la factura
      queryClient.invalidateQueries({
        queryKey: billingKeys.paymentsByInvoice(variables.invoiceId),
      });
    },
  });
}

/**
 * Hook para verificar el estado de un pago por referencia.
 * 
 * Útil para polling después de iniciar un pago.
 * 
 * @param reference - Referencia del pago
 * @param options - Opciones de React Query
 * @returns Query con el estado del pago
 * 
 * @example
 * ```typescript
 * const { data: payment } = usePaymentStatus(reference, {
 *   enabled: !!reference,
 *   refetchInterval: 3000 // Poll cada 3 segundos
 * });
 * 
 * if (payment?.status === 'APPROVED') {
 *   // Pago aprobado
 * }
 * ```
 */
export function usePaymentStatus(
  reference: string,
  options?: { 
    enabled?: boolean; 
    refetchInterval?: number | false;
  }
) {
  return useQuery({
    queryKey: billingKeys.paymentByReference(reference),
    queryFn: () => paymentsService.checkStatus(reference),
    staleTime: 0, // Siempre considerado stale para polling
    refetchInterval: options?.refetchInterval ?? false,
    enabled: options?.enabled ?? !!reference,
  });
}

/**
 * Hook para registrar un pago manual.
 * 
 * Solo para personal administrativo.
 * 
 * @returns Mutation para registrar pagos manuales
 * 
 * @example
 * ```typescript
 * const { mutate: registrarPago } = useRegisterManualPayment();
 * 
 * registrarPago({
 *   invoiceId: 'uuid-factura',
 *   amount: 50000,
 *   method: 'CASH',
 *   paymentDate: new Date().toISOString()
 * });
 * ```
 */
export function useRegisterManualPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payment: {
      invoiceId: string;
      amount: number;
      method: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'INSURANCE';
      paymentDate: string;
    }) => paymentsService.registerManualPayment(payment),
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: billingKeys.paymentsByInvoice(data.invoiceId),
      });
      queryClient.invalidateQueries({
        queryKey: billingKeys.invoice(data.invoiceId),
      });
      queryClient.invalidateQueries({
        queryKey: billingKeys.invoicesList(),
      });
      queryClient.invalidateQueries({
        queryKey: billingKeys.invoicesStats(),
      });
    },
  });
}

/**
 * Hook para descargar el comprobante de una factura en PDF.
 * 
 * @returns Mutation para descargar el PDF
 * 
 * @example
 * ```typescript
 * const { mutate: descargarPDF, isPending } = useDownloadReceipt();
 * 
 * descargarPDF('uuid-factura', {
 *   onSuccess: (blob) => {
 *     const url = URL.createObjectURL(blob);
 *     const link = document.createElement('a');
 *     link.href = url;
 *     link.download = 'factura.pdf';
 *     link.click();
 *     URL.revokeObjectURL(url);
 *   }
 * });
 * ```
 */
export function useDownloadReceipt() {
  return useMutation({
    mutationFn: (id: string) => invoicesService.downloadReceipt(id),
  });
}
