/**
 * Componente React ToastContainer para mostrar múltiples notificaciones toast en VitalCare.
 *
 * Este componente actúa como contenedor para renderizar múltiples notificaciones
 * toast en posiciones específicas de la pantalla. Gestiona la animación de entrada
 * y salida de los toasts, y proporciona un sistema de posicionamiento flexible.
 *
 * @description
 * Funcionalidades principales:
 * - Renderizado de múltiples toasts simultáneamente
 * - Posicionamiento configurable (top-right, bottom-left, etc.)
 * - Animaciones de entrada/salida suaves
 * - Gestión automática de la visibilidad del contenedor
 * - Soporte para diferentes tipos de toast (success, error, warning, info)
 * - Sistema de capas z-index para superposición correcta
 *
 * El componente utiliza el patrón de composición con el componente Toast individual
 * para renderizar cada notificación, y maneja la lógica de animación y posicionamiento.
 *
 * @example
 * ```typescript
 * import { ToastContainer } from '@/components/ui/ToastContainer';
 *
 * function App() {
 *   const [toasts, setToasts] = useState([]);
 *
 *   const removeToast = (id) => {
 *     setToasts(toasts.filter(toast => toast.id !== id));
 *   };
 *
 *   return (
 *     <div>
 *       <ToastContainer
 *         toasts={toasts}
 *         onRemove={removeToast}
 *         position="top-right"
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @see {@link Toast} para el componente individual de toast.
 * @see {@link ToastContext} para el contexto que gestiona el estado global de toasts.
 */

import { useEffect, useState } from 'react';
import { Toast } from './Toast';
import { cn } from '@/utils/cn';

/**
 * Interfaz que define la estructura de datos de un toast.
 * Esta interfaz debe coincidir con la definida en ToastContext.
 */
export interface ToastData {
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
}

/**
 * Props del componente ToastContainer.
 */
interface ToastContainerProps {
  /** Array de toasts a mostrar */
  toasts: ToastData[];
  /** Función callback para remover un toast específico */
  onRemove: (id: string) => void;
  /** Posición del contenedor en la pantalla */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

/**
 * Componente ToastContainer que renderiza múltiples notificaciones toast.
 *
 * @component
 * @param {ToastContainerProps} props - Propiedades del componente.
 * @param {ToastData[]} props.toasts - Array de toasts a mostrar.
 * @param {(id: string) => void} props.onRemove - Función para remover un toast.
 * @param {string} [props.position='top-right'] - Posición del contenedor.
 * @returns {JSX.Element | null} Contenedor de toasts o null si no hay toasts.
 *
 * @description
 * Este componente gestiona la visualización de múltiples toasts con:
 * - Animaciones de entrada y salida
 * - Posicionamiento flexible en la pantalla
 * - Gestión automática de la visibilidad
 * - Apilamiento vertical de toasts
 *
 * @example
 * ```typescript
 * <ToastContainer
 *   toasts={toasts}
 *   onRemove={removeToast}
 *   position="bottom-left"
 * />
 * ```
 */
export function ToastContainer({
  toasts,
  onRemove,
  position = 'top-right'
}: ToastContainerProps) {
  /**
   * Estado para controlar la visibilidad del contenedor.
   * Se usa para manejar las animaciones de entrada/salida.
   * @type {boolean}
   */
  const [isVisible, setIsVisible] = useState(false);

  /**
   * Efecto para gestionar la visibilidad del contenedor basado en la cantidad de toasts.
   * Cuando hay toasts, se muestra inmediatamente. Cuando no hay, se espera un delay
   * para permitir la animación de salida.
   */
  useEffect(() => {
    if (toasts.length > 0) {
      setIsVisible(true);
    } else {
      // Pequeño delay para la animación de salida
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [toasts.length]);

  /**
   * Si no hay toasts y el contenedor no es visible, no renderizar nada.
   */
  if (!isVisible && toasts.length === 0) return null;

  /**
   * Función que retorna las clases CSS para el posicionamiento del contenedor.
   *
   * @returns {string} Clases CSS para el posicionamiento.
   */
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-3 pointer-events-none",
        getPositionClasses()
      )}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto animate-in slide-in-from-right-2 fade-in duration-300"
        >
          <Toast
            {...toast}
            onClose={onRemove}
          />
        </div>
      ))}
    </div>
  );
}
