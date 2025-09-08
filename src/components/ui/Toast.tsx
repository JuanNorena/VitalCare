/**
 * Componente React Toast para mostrar notificaciones individuales en VitalCare.
 *
 * Este componente representa una notificación toast individual con diferentes
 * tipos de mensaje (éxito, error, advertencia, información). Incluye iconos,
 * estilos temáticos, auto-cierre automático y cierre manual por el usuario.
 *
 * @description
 * Funcionalidades principales:
 * - Cuatro tipos de toast: success, error, warning, info
 * - Iconos SVG específicos para cada tipo
 * - Estilos temáticos con soporte para modo oscuro
 * - Auto-cierre automático configurable
 * - Cierre manual con botón X
 * - Animaciones de transición suaves
 * - Accesibilidad con roles ARIA
 * - Diseño responsive y adaptable
 *
 * El componente maneja su propio ciclo de vida con auto-cierre y proporciona
 * una interfaz consistente para diferentes tipos de notificaciones en la aplicación.
 *
 * @example
 * ```typescript
 * import { Toast } from '@/components/ui/Toast';
 *
 * function NotificationExample() {
 *   const handleClose = (id) => {
 *     console.log('Toast cerrado:', id);
 *   };
 *
 *   return (
 *     <Toast
 *       id="toast-1"
 *       title="Operación exitosa"
 *       description="Los datos se guardaron correctamente"
 *       type="success"
 *       duration={5000}
 *       onClose={handleClose}
 *     />
 *   );
 * }
 * ```
 *
 * @see {@link ToastContainer} para el contenedor que gestiona múltiples toasts.
 * @see {@link ToastContext} para el contexto global de notificaciones.
 */

import { useEffect } from 'react';
import { cn } from '@/utils/cn';

/**
 * Props del componente Toast.
 */
export interface ToastProps {
  /** Identificador único del toast */
  id: string;
  /** Título del toast */
  title: string;
  /** Descripción opcional del toast */
  description?: string;
  /** Tipo de toast que determina el estilo y icono */
  type: 'success' | 'error' | 'warning' | 'info';
  /** Duración en milisegundos antes de auto-cerrarse (por defecto 5000) */
  duration?: number;
  /** Función callback que se ejecuta al cerrar el toast */
  onClose: (id: string) => void;
}

/**
 * Componente Toast que muestra una notificación individual.
 *
 * @component
 * @param {ToastProps} props - Propiedades del componente.
 * @param {string} props.id - ID único del toast.
 * @param {string} props.title - Título del toast.
 * @param {string} [props.description] - Descripción opcional.
 * @param {'success' | 'error' | 'warning' | 'info'} props.type - Tipo de toast.
 * @param {number} [props.duration=5000] - Duración en ms antes de auto-cerrarse.
 * @param {(id: string) => void} props.onClose - Función para cerrar el toast.
 * @returns {JSX.Element} Elemento toast renderizado.
 *
 * @description
 * Este componente renderiza una notificación toast con:
 * - Icono específico según el tipo
 * - Estilos temáticos coherentes
 * - Auto-cierre automático
 * - Botón de cierre manual
 * - Soporte completo para accesibilidad
 *
 * @example
 * ```typescript
 * <Toast
 *   id="success-toast"
 *   title="Guardado exitosamente"
 *   description="Los cambios han sido guardados"
 *   type="success"
 *   onClose={handleClose}
 * />
 * ```
 */
export function Toast({ id, title, description, type, duration = 5000, onClose }: ToastProps) {
  /**
   * Efecto para manejar el auto-cierre del toast.
   * Configura un temporizador que cierra automáticamente el toast después
   * de la duración especificada.
   */
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  /**
   * Función que retorna los estilos CSS según el tipo de toast.
   * Incluye colores de fondo, borde, texto e iconos para cada variante.
   *
   * @returns {Object} Objeto con clases CSS para diferentes elementos.
   */
  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-600',
          border: 'border-green-700',
          icon: 'text-white',
          title: 'text-white',
          description: 'text-white',
        };
      case 'error':
        return {
          bg: 'bg-red-600',
          border: 'border-red-700',
          icon: 'text-white',
          title: 'text-white',
          description: 'text-white',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
          title: 'text-yellow-800 dark:text-yellow-200',
          description: 'text-yellow-700 dark:text-yellow-300',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          title: 'text-blue-800 dark:text-blue-200',
          description: 'text-blue-700 dark:text-blue-300',
        };
    }
  };

  /**
   * Objeto con los estilos calculados para el toast actual.
   * @type {Object}
   */
  const styles = getToastStyles();

  /**
   * Función que retorna el icono SVG correspondiente al tipo de toast.
   *
   * @returns {JSX.Element} Elemento SVG del icono.
   */
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm w-full transition-all duration-300 ease-in-out",
        styles.bg,
        styles.border
      )}
      role="alert"
    >
      <div className={cn("flex-shrink-0 mt-0.5", styles.icon)}>
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className={cn("text-sm font-medium", styles.title)}>
          {title}
        </h4>
        {description && (
          <p className={cn("text-sm mt-1", styles.description)}>
            {description}
          </p>
        )}
      </div>

      <button
        onClick={() => onClose(id)}
        className={cn(
          "flex-shrink-0 ml-2 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors",
          styles.icon
        )}
        aria-label="Cerrar notificación"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
