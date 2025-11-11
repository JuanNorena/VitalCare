/**
 * Modal de Checkout de Pago con integración de Wompi.
 * 
 * Este componente maneja todo el flujo de pago:
 * 1. Crea una sesión de pago en el backend
 * 2. Inicializa el widget de Wompi con la firma de integridad
 * 3. Abre el checkout de Wompi
 * 4. Monitorea el estado del pago via polling
 * 5. Muestra el resultado final
 * 
 * @module components/billing/PaymentCheckoutModal
 */

import { useEffect, useState, useRef } from 'react';
import { X, CreditCard, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { useCreatePaymentSession, usePaymentStatus, useInvoice } from '@/hooks/useBilling';
import { billingHelpers } from '@/services/billing';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { CheckoutSignatureResponse, WompiCheckoutResult } from '@/types/billing';

/**
 * Props del componente.
 */
interface PaymentCheckoutModalProps {
  /** UUID de la factura a pagar */
  invoiceId: string;
  /** Callback al cerrar el modal */
  onClose: () => void;
  /** Callback cuando el pago es exitoso */
  onSuccess?: (transactionId: string) => void;
  /** Callback cuando el pago falla */
  onError?: (error: string) => void;
}

/**
 * Estados posibles del proceso de pago.
 */
type PaymentState = 
  | 'IDLE'           // Estado inicial
  | 'CREATING'       // Creando sesión de pago
  | 'READY'          // Listo para abrir Wompi
  | 'PROCESSING'     // Checkout abierto, esperando resultado
  | 'POLLING'        // Verificando estado en backend
  | 'SUCCESS'        // Pago exitoso
  | 'DECLINED'       // Pago rechazado
  | 'ERROR';         // Error en el proceso

/**
 * Declaración global para el widget de Wompi.
 */
declare global {
  interface Window {
    WidgetCheckout?: any;
  }
}

export function PaymentCheckoutModal({
  invoiceId,
  onClose,
  onSuccess,
  onError,
}: PaymentCheckoutModalProps) {
  const [state, setState] = useState<PaymentState>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [sessionData, setSessionData] = useState<CheckoutSignatureResponse | null>(null);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const widgetRef = useRef<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Hooks
  const { data: invoice } = useInvoice(invoiceId);
  const { mutate: createSession } = useCreatePaymentSession();
  const { data: paymentStatus } = usePaymentStatus(paymentReference, {
    enabled: state === 'POLLING',
    refetchInterval: 3000, // Poll cada 3 segundos
  });

  /**
   * Carga el script de Wompi dinámicamente.
   */
  useEffect(() => {
    if (state !== 'IDLE') return;

    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Wompi widget cargado');
      handleCreateSession();
    };
    script.onerror = () => {
      console.error('❌ Error cargando Wompi widget');
      setState('ERROR');
      setErrorMessage('No se pudo cargar el sistema de pagos. Verifica tu conexión.');
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  /**
   * Monitorea el estado del pago via polling.
   */
  useEffect(() => {
    if (state === 'POLLING' && paymentStatus) {
      console.log('📊 Estado del pago:', paymentStatus.status);

      switch (paymentStatus.status) {
        case 'APPROVED':
          setState('SUCCESS');
          stopPolling();
          onSuccess?.(paymentStatus.transactionId || '');
          break;

        case 'DECLINED':
        case 'ERROR':
          setState('DECLINED');
          stopPolling();
          setErrorMessage('El pago fue rechazado. Verifica tus datos e intenta nuevamente.');
          onError?.('Pago rechazado');
          break;

        case 'VOIDED':
          setState('ERROR');
          stopPolling();
          setErrorMessage('El pago fue cancelado.');
          onError?.('Pago cancelado');
          break;

        // PENDING: seguir polling
        default:
          console.log('⏳ Pago aún pendiente...');
      }
    }
  }, [paymentStatus, state]);

  /**
   * Limpieza al desmontar el componente.
   */
  useEffect(() => {
    return () => {
      stopPolling();
      closeWidget();
    };
  }, []);

  /**
   * Detiene el polling del estado del pago.
   */
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  /**
   * Cierra el widget de Wompi si está abierto.
   */
  const closeWidget = () => {
    if (widgetRef.current && widgetRef.current.close) {
      widgetRef.current.close();
    }
  };

  /**
   * Crea la sesión de pago en el backend.
   */
  const handleCreateSession = () => {
    setState('CREATING');

    createSession(
      {
        invoiceId,
        currency: 'COP',
      },
      {
        onSuccess: (data) => {
          console.log('✅ Sesión creada:', data);
          setSessionData(data);
          setPaymentReference(data.reference);
          setState('READY');
        },
        onError: (error: any) => {
          console.error('❌ Error creando sesión:', error);
          setState('ERROR');
          setErrorMessage(
            error?.response?.data?.message || 
            'Error al iniciar el proceso de pago. Intenta nuevamente.'
          );
          onError?.(error.message);
        },
      }
    );
  };

  /**
   * Abre el checkout de Wompi.
   */
  const handleOpenCheckout = () => {
    if (!sessionData || !window.WidgetCheckout) {
      setState('ERROR');
      setErrorMessage('El sistema de pagos no está listo. Recarga la página.');
      return;
    }

    setState('PROCESSING');

    try {
      // Configurar el widget de Wompi
      const checkout = new window.WidgetCheckout({
        currency: sessionData.currency,
        amountInCents: sessionData.amountInCents,
        reference: sessionData.reference,
        publicKey: sessionData.publicKey,
        signature: {
          integrity: sessionData.signature,
        },
        redirectUrl: window.location.origin + '/billing', // Redirect después del pago
      });

      widgetRef.current = checkout;

      // Manejar el resultado del checkout
      checkout.open((result: WompiCheckoutResult) => {
        console.log('💳 Resultado de Wompi:', result);

        if (result.transaction) {
          // Transacción iniciada, verificar estado
          console.log('🔄 Transacción iniciada, verificando estado...');
          setState('POLLING');
        } else {
          // Usuario cerró el widget sin completar
          console.log('❌ Usuario canceló el pago');
          setState('IDLE');
        }
      });
    } catch (error) {
      console.error('❌ Error abriendo checkout:', error);
      setState('ERROR');
      setErrorMessage('Error al abrir el checkout. Intenta nuevamente.');
    }
  };

  /**
   * Maneja el reintentar el pago.
   */
  const handleRetry = () => {
    setState('IDLE');
    setErrorMessage('');
    setSessionData(null);
    setPaymentReference('');
    stopPolling();
    closeWidget();
    handleCreateSession();
  };

  /**
   * Renderiza el contenido según el estado.
   */
  const renderContent = () => {
    switch (state) {
      case 'IDLE':
      case 'CREATING':
        return (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Preparando pago...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Estamos configurando tu método de pago seguro
            </p>
          </div>
        );

      case 'READY':
        return (
          <div className="text-center py-8">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Todo listo para pagar
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Factura: #{invoice?.id.slice(0, 8)}
            </p>
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total a pagar</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {invoice && billingHelpers.formatCurrency(invoice.total)}
              </p>
            </div>
            <Button
              variant="default"
              size="lg"
              onClick={handleOpenCheckout}
              className="w-full"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Continuar al pago
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
              Serás redirigido a nuestra pasarela de pago segura
            </p>
          </div>
        );

      case 'PROCESSING':
        return (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Procesando pago...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Completa el pago en la ventana de Wompi
            </p>
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ No cierres esta ventana hasta completar el pago
              </p>
            </div>
          </div>
        );

      case 'POLLING':
        return (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Verificando pago...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Estamos confirmando tu transacción
            </p>
          </div>
        );

      case 'SUCCESS':
        return (
          <div className="text-center py-8">
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              ¡Pago exitoso!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tu factura ha sido pagada correctamente
            </p>
            <Button variant="default" onClick={onClose} className="w-full">
              Cerrar
            </Button>
          </div>
        );

      case 'DECLINED':
      case 'ERROR':
        return (
          <div className="text-center py-8">
            <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              {state === 'DECLINED' ? (
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {state === 'DECLINED' ? 'Pago rechazado' : 'Error en el pago'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {errorMessage || 'Ocurrió un error procesando el pago'}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cerrar
              </Button>
              <Button variant="default" onClick={handleRetry} className="flex-1">
                Reintentar
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md relative">
        {/* Botón cerrar - Solo si no está procesando */}
        {state !== 'PROCESSING' && state !== 'POLLING' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Contenido dinámico */}
        <div className="p-6">
          {renderContent()}
        </div>
      </Card>
    </div>
  );
}
