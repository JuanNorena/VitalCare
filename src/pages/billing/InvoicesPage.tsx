/**
 * Página de Facturación - Lista de facturas médicas.
 * 
 * Permite visualizar, filtrar y gestionar facturas. Los usuarios pueden:
 * - Ver todas sus facturas con detalles
 * - Filtrar por estado (Pendiente, Pagada, Cancelada)
 * - Iniciar el proceso de pago
 * - Ver detalles de cada factura
 * - Descargar comprobantes
 * 
 * @module pages/billing/InvoicesPage
 */

import { useState } from 'react';
import { useInvoices, useBillingStats } from '@/hooks/useBilling';
import { billingHelpers } from '@/services/billing';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PaymentCheckoutModal } from '@/components/billing/PaymentCheckoutModal';
import { InvoiceDetailsModal } from '@/components/billing/InvoiceDetailsModal';
import type { InvoiceStatus } from '@/types/billing';
import { 
  FileText, 
  Filter, 
  Download, 
  CreditCard, 
  Eye,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle
} from 'lucide-react';

type FilterTab = 'ALL' | InvoiceStatus;

export function InvoicesPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Obtener facturas con filtro
  const filters = activeFilter !== 'ALL' ? { status: activeFilter } : undefined;
  const { data: invoices, isLoading, error, refetch } = useInvoices(filters);
  const { data: stats, refetch: refetchStats } = useBillingStats();

  /**
   * Maneja el inicio del proceso de pago.
   */
  const handlePayClick = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setShowPaymentModal(true);
  };

  /**
   * Maneja el cierre del modal de pago.
   */
  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedInvoiceId(null);
    // Refrescar datos
    refetch();
    refetchStats();
  };

  /**
   * Maneja el éxito del pago.
   */
  const handlePaymentSuccess = (transactionId: string) => {
    console.log('✅ Pago exitoso. Transaction ID:', transactionId);
    // El modal ya maneja el mensaje de éxito
  };

  /**
   * Maneja la visualización de detalles.
   */
  const handleViewDetails = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setShowDetailsModal(true);
  };

  /**
   * Maneja el cierre del modal de detalles.
   */
  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedInvoiceId(null);
  };

  /**
   * Maneja la descarga del comprobante.
   */
  const handleDownloadReceipt = (invoiceId: string) => {
    // TODO: Implementar descarga de PDF
    console.log('Descargar comprobante:', invoiceId);
  };

  /**
   * Filtros disponibles.
   */
  const filters_tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'ALL', label: 'Todas', count: stats?.totalInvoices },
    { key: 'PENDING', label: 'Pendientes', count: stats?.pendingInvoices },
    { key: 'PAID', label: 'Pagadas', count: stats?.paidInvoices },
    { key: 'CANCELLED', label: 'Canceladas' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Facturación
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona y consulta todas tus facturas médicas
        </p>
      </div>

      {/* Estadísticas - Resumen */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Facturado
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {billingHelpers.formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pendientes
                </p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                  {stats.pendingInvoices}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pagadas
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {stats.paidInvoices}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tasa de Éxito
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.paymentSuccessRate?.toFixed(1) || '0'}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filtros de Tabs */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 shrink-0">
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filtrar:</span>
          </div>
          <div className="flex gap-2">
            {filters_tabs.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeFilter === filter.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {filter.label}
                {filter.count !== undefined && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/20">
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Lista de Facturas */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <Card className="p-8 text-center">
          <p className="text-red-600 dark:text-red-400">
            Error al cargar las facturas. Por favor, intenta nuevamente.
          </p>
        </Card>
      )}

      {!isLoading && !error && invoices && invoices.length === 0 && (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No hay facturas
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {activeFilter === 'ALL'
              ? 'No tienes facturas registradas aún.'
              : `No hay facturas con estado "${billingHelpers.getInvoiceStatusText(activeFilter)}".`}
          </p>
        </Card>
      )}

      {!isLoading && !error && invoices && invoices.length > 0 && (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Info Principal */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Factura #{invoice.id.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(invoice.createdAt).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {invoice.consultationId && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
                      Consulta médica
                    </p>
                  )}
                </div>

                {/* Monto */}
                <div className="text-center lg:text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {billingHelpers.formatCurrency(invoice.total)}
                  </p>
                </div>

                {/* Estado */}
                <div className="flex items-center justify-center lg:justify-start">
                  <span
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${billingHelpers.getInvoiceStatusColor(
                      invoice.status
                    )}`}
                  >
                    {billingHelpers.getInvoiceStatusText(invoice.status)}
                  </span>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(invoice.id)}
                    title="Ver detalles"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>

                  {invoice.status === 'PAID' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReceipt(invoice.id)}
                      title="Descargar comprobante"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}

                  {invoice.status === 'PENDING' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handlePayClick(invoice.id)}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pagar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de pago */}
      {showPaymentModal && selectedInvoiceId && (
        <PaymentCheckoutModal
          invoiceId={selectedInvoiceId}
          onClose={handleClosePaymentModal}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Modal de detalles */}
      {showDetailsModal && selectedInvoiceId && (
        <InvoiceDetailsModal
          invoiceId={selectedInvoiceId}
          onClose={handleCloseDetailsModal}
          onPayClick={handlePayClick}
        />
      )}
    </div>
  );
}
