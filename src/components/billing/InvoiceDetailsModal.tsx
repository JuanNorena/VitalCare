/**
 * Modal de Detalles de Factura.
 * 
 * Muestra información completa de una factura incluyendo:
 * - Datos del paciente
 * - Información de la consulta
 * - Historial de pagos
 * - Estado actual
 * 
 * @module components/billing/InvoiceDetailsModal
 */

import { X, Download, CreditCard, Calendar, User, FileText, CheckCircle } from 'lucide-react';
import { useInvoice, usePaymentsByInvoice, useDownloadReceipt } from '@/hooks/useBilling';
import { billingHelpers } from '@/services/billing';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface InvoiceDetailsModalProps {
  /** UUID de la factura a mostrar */
  invoiceId: string;
  /** Callback al cerrar el modal */
  onClose: () => void;
  /** Callback para iniciar el pago */
  onPayClick?: (invoiceId: string) => void;
}

export function InvoiceDetailsModal({
  invoiceId,
  onClose,
  onPayClick,
}: InvoiceDetailsModalProps) {
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const { data: payments } = usePaymentsByInvoice(invoiceId);
  const { mutate: downloadReceipt, isPending: isDownloading } = useDownloadReceipt();

  /**
   * Maneja la descarga del comprobante.
   */
  const handleDownload = () => {
    downloadReceipt(invoiceId, {
      onSuccess: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `factura-${invoiceId.slice(0, 8)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      onError: () => {
        alert('Error al descargar el comprobante. Intenta nuevamente.');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <Card className="w-full max-w-2xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando detalles...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <Card className="w-full max-w-2xl p-8 text-center">
          <p className="text-red-600 dark:text-red-400">Factura no encontrada</p>
          <Button variant="outline" onClick={onClose} className="mt-4">
            Cerrar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-3xl my-8">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Factura #{invoice.id.slice(0, 8)}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(invoice.createdAt).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Estado y Monto */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Estado</p>
              <span
                className={`inline-block px-4 py-2 rounded-lg font-medium ${billingHelpers.getInvoiceStatusColor(
                  invoice.status
                )}`}
              >
                {billingHelpers.getInvoiceStatusText(invoice.status)}
              </span>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {billingHelpers.formatCurrency(invoice.total)}
              </p>
            </div>
          </div>

          {/* Información del Paciente */}
          {invoice.patientName && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Información del Paciente
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Nombre:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {invoice.patientName}
                  </span>
                </div>
                {invoice.patientEmail && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {invoice.patientEmail}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información de la Consulta */}
          {invoice.consultationId && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Consulta Médica
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">ID Consulta:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {invoice.consultationId.slice(0, 8)}
                  </span>
                </div>
                {invoice.doctorName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Doctor:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {invoice.doctorName}
                    </span>
                  </div>
                )}
                {invoice.consultationDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Fecha:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(invoice.consultationDate).toLocaleDateString('es-CO')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Historial de Pagos */}
          {payments && payments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Historial de Pagos
              </h3>
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {billingHelpers.formatCurrency(payment.amount)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {payment.method === 'WOMPI' && 'Pago en línea'}
                          {payment.method === 'CASH' && 'Efectivo'}
                          {payment.method === 'CREDIT_CARD' && 'Tarjeta de crédito'}
                          {payment.method === 'DEBIT_CARD' && 'Tarjeta débito'}
                          {payment.method === 'INSURANCE' && 'Seguro'}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${billingHelpers.getPaymentStatusColor(
                          payment.status
                        )}`}
                      >
                        {billingHelpers.getPaymentStatusText(payment.status)}
                      </span>
                    </div>
                    {payment.transactionId && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        ID: {payment.transactionId}
                      </p>
                    )}
                    {payment.paymentDate && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(payment.paymentDate).toLocaleString('es-CO')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {invoice.status === 'PAID' && (
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloading ? 'Descargando...' : 'Descargar Comprobante'}
              </Button>
            )}
            
            {invoice.status === 'PENDING' && onPayClick && (
              <Button
                variant="default"
                onClick={() => onPayClick(invoice.id)}
                className="flex-1"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pagar Ahora
              </Button>
            )}
            
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cerrar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
