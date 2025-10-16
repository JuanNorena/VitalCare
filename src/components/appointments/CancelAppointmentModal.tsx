/**
 * Modal de confirmación para cancelar citas médicas.
 * 
 * Proporciona una interfaz visual clara y accesible para que los usuarios
 * confirmen la cancelación de una cita médica antes de ejecutar la acción.
 * 
 * @component
 * @example
 * ```tsx
 * const [showModal, setShowModal] = useState(false);
 * const [appointmentToCancel, setAppointmentToCancel] = useState(null);
 * 
 * <CancelAppointmentModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onConfirm={() => handleCancelAppointment(appointmentToCancel)}
 *   appointmentDate="16 de octubre de 2025, 07:26 p. m."
 *   isLoading={isCancelling}
 * />
 * ```
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface CancelAppointmentModalProps {
  /** Controla si el modal está visible */
  isOpen: boolean;
  /** Función llamada al cerrar el modal sin confirmar */
  onClose: () => void;
  /** Función llamada al confirmar la cancelación */
  onConfirm: () => void;
  /** Fecha y hora de la cita en formato legible */
  appointmentDate: string;
  /** Indica si la operación de cancelación está en curso */
  isLoading?: boolean;
}

/**
 * Modal de confirmación para cancelar citas médicas.
 * 
 * Características:
 * - Diseño centrado y responsivo
 * - Fondo oscuro semi-transparente (backdrop)
 * - Animaciones suaves de entrada/salida
 * - Botones claramente diferenciados (Cancelar acción vs Confirmar)
 * - Estado de carga durante la operación
 * - Accesibilidad con ESC para cerrar
 * - Prevención de scroll del body cuando está abierto
 * 
 * @param {CancelAppointmentModalProps} props - Propiedades del componente
 * @returns {JSX.Element | null} Modal de confirmación o null si no está abierto
 */
export function CancelAppointmentModal({
  isOpen,
  onClose,
  onConfirm,
  appointmentDate,
  isLoading = false
}: CancelAppointmentModalProps) {
  /**
   * Efecto para manejar el cierre con tecla ESC y prevenir scroll.
   */
  useEffect(() => {
    if (!isOpen) return;

    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';

    // Manejar tecla ESC para cerrar
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);

    // Cleanup
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - Fondo oscuro semi-transparente */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={isLoading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <Card className="relative w-full max-w-md mx-auto transform transition-all animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="p-6">
          {/* Icono de Advertencia */}
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Título */}
          <h3 className="text-xl font-bold text-center text-[var(--vc-text)] mb-2">
            ¿Estás seguro de que quieres cancelar esta cita?
          </h3>

          {/* Descripción */}
          <p className="text-center text-[var(--vc-text)]/70 mb-4">
            Fecha programada: <span className="font-semibold text-[var(--vc-text)]">{appointmentDate}</span>
          </p>

          {/* Mensaje de advertencia */}
          <div className="p-4 mb-6 rounded-lg bg-amber-100 dark:bg-amber-950 border-2 border-amber-400 dark:border-amber-600">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              <strong className="text-amber-950 dark:text-amber-50">⚠️ Nota:</strong> Esta acción no se puede deshacer. Se notificará al personal médico sobre la cancelación.
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Botón Volver/Cancelar acción */}
            <Button
              onClick={onClose}
              disabled={isLoading}
              variant="outline"
              className="flex-1 order-2 sm:order-1"
            >
              No, volver
            </Button>

            {/* Botón Confirmar Cancelación */}
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 order-1 sm:order-2 bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Cancelando...
                </span>
              ) : (
                'Sí, cancelar cita'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
