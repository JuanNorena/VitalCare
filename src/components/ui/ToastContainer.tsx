/**
 * Contenedor de Toasts para mostrar múltiples notificaciones
 */

import { useEffect, useState } from 'react';
import { Toast } from './Toast';
import { cn } from '@/utils/cn';

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function ToastContainer({
  toasts,
  onRemove,
  position = 'top-right'
}: ToastContainerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (toasts.length > 0) {
      setIsVisible(true);
    } else {
      // Pequeño delay para la animación de salida
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [toasts.length]);

  if (!isVisible && toasts.length === 0) return null;

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
