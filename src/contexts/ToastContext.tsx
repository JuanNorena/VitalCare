/**
 * Contexto de React para el manejo global de notificaciones toast en VitalCare.
 *
 * Este módulo proporciona un sistema completo de notificaciones toast que permite
 * mostrar mensajes temporales al usuario desde cualquier parte de la aplicación.
 * Incluye diferentes tipos de toast, posiciones configurables y gestión automática
 * del estado y ciclo de vida de las notificaciones.
 *
 * @description
 * Funcionalidades principales:
 * - Sistema de notificaciones toast global
 * - Cuatro tipos de toast: success, error, warning, info
 * - Posicionamiento configurable (top-right, bottom-left, etc.)
 * - Duración automática configurable
 * - Gestión automática del estado con React Context
 * - API simplificada con métodos convenience
 * - Animaciones de entrada/salida suaves
 * - Cierre manual e automático
 *
 * El contexto utiliza el patrón Provider/Consumer de React para compartir
 * el estado de las notificaciones entre todos los componentes de la aplicación.
 *
 * @example
 * ```tsx
 * // En el componente raíz (main.tsx o App.tsx)
 * import { ToastProvider } from '@/contexts/ToastContext';
 *
 * function App() {
 *   return (
 *     <ToastProvider>
 *       <YourAppComponents />
 *     </ToastProvider>
 *   );
 * }
 *
 * // En cualquier componente
 * import { useToast } from '@/contexts/ToastContext';
 *
 * function MyComponent() {
 *   const { showSuccess, showError } = useToast();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       showSuccess('Datos guardados', 'Los cambios se han guardado correctamente');
 *     } catch (error) {
 *       showError('Error al guardar', 'No se pudieron guardar los datos');
 *     }
 *   };
 *
 *   return <button onClick={handleSave}>Guardar</button>;
 * }
 * ```
 *
 * @see {@link ToastContainer} para el componente que renderiza los toasts.
 * @see {@link Toast} para el componente individual de toast.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from '@/components/ui/ToastContainer';

/**
 * Interfaz que define la estructura de datos de un toast.
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
 * Interfaz del contexto de toast que define todas las funciones disponibles.
 */
interface ToastContextType {
  /** Lista actual de toasts activos */
  toasts: ToastData[];
  /** Función para agregar un nuevo toast */
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  /** Función para remover un toast específico */
  removeToast: (id: string) => void;
  /** Función para limpiar todos los toasts */
  clearToasts: () => void;
  /** Función convenience para mostrar toast de éxito */
  showSuccess: (title: string, description?: string, duration?: number) => void;
  /** Función convenience para mostrar toast de error */
  showError: (title: string, description?: string, duration?: number) => void;
  /** Función convenience para mostrar toast de advertencia */
  showWarning: (title: string, description?: string, duration?: number) => void;
  /** Función convenience para mostrar toast informativo */
  showInfo: (title: string, description?: string, duration?: number) => void;
}

/**
 * Contexto de React para compartir el estado de los toasts.
 * Se crea con createContext y se inicializa como undefined.
 */
const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Provider del contexto de toast que maneja el estado global de las notificaciones.
 *
 * @component
 * @param {Object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Componentes hijos que tendrán acceso al contexto.
 * @returns {JSX.Element} Provider que envuelve los children con el ToastContainer.
 *
 * @description
 * Este componente maneja todo el estado de los toasts y proporciona las funciones
 * para crear, mostrar y gestionar las notificaciones. También renderiza el
 * ToastContainer que muestra visualmente los toasts.
 *
 * @example
 * ```tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * ```
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  /**
   * Estado que mantiene la lista de toasts activos.
   * @type {ToastData[]}
   */
  const [toasts, setToasts] = useState<ToastData[]>([]);

  /**
   * Función para agregar un nuevo toast a la lista.
   * Genera automáticamente un ID único y establece duración por defecto.
   *
   * @param {Omit<ToastData, 'id'>} toast - Datos del toast sin el ID.
   *
   * @example
   * ```typescript
   * addToast({
   *   title: 'Operación exitosa',
   *   description: 'Los datos se guardaron correctamente',
   *   type: 'success',
   *   duration: 3000
   * });
   * ```
   */
  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastData = {
      ...toast,
      id,
      duration: toast.duration ?? 5000, // Default 5 seconds
    };

    setToasts((prev) => [...prev, newToast]);
  }, []);

  /**
   * Función para remover un toast específico de la lista.
   *
   * @param {string} id - ID del toast a remover.
   *
   * @example
   * ```typescript
   * removeToast('toast-123456789');
   * ```
   */
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Función para limpiar todos los toasts activos.
   *
   * @example
   * ```typescript
   * clearToasts(); // Remueve todos los toasts
   * ```
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  /**
   * Función convenience para mostrar un toast de éxito.
   *
   * @param {string} title - Título del toast.
   * @param {string} [description] - Descripción opcional.
   * @param {number} [duration] - Duración en ms (por defecto 5000).
   *
   * @example
   * ```typescript
   * showSuccess('Guardado', 'Los datos se guardaron correctamente');
   * ```
   */
  const showSuccess = useCallback((title: string, description?: string, duration?: number) => {
    addToast({ title, description, type: 'success', duration });
  }, [addToast]);

  /**
   * Función convenience para mostrar un toast de error.
   *
   * @param {string} title - Título del toast.
   * @param {string} [description] - Descripción opcional.
   * @param {number} [duration] - Duración en ms (por defecto 5000).
   *
   * @example
   * ```typescript
   * showError('Error', 'No se pudieron guardar los datos');
   * ```
   */
  const showError = useCallback((title: string, description?: string, duration?: number) => {
    addToast({ title, description, type: 'error', duration });
  }, [addToast]);

  /**
   * Función convenience para mostrar un toast de advertencia.
   *
   * @param {string} title - Título del toast.
   * @param {string} [description] - Descripción opcional.
   * @param {number} [duration] - Duración en ms (por defecto 5000).
   *
   * @example
   * ```typescript
   * showWarning('Advertencia', 'Esta acción no se puede deshacer');
   * ```
   */
  const showWarning = useCallback((title: string, description?: string, duration?: number) => {
    addToast({ title, description, type: 'warning', duration });
  }, [addToast]);

  /**
   * Función convenience para mostrar un toast informativo.
   *
   * @param {string} title - Título del toast.
   * @param {string} [description] - Descripción opcional.
   * @param {number} [duration] - Duración en ms (por defecto 5000).
   *
   * @example
   * ```typescript
   * showInfo('Información', 'La sesión expira en 5 minutos');
   * ```
   */
  const showInfo = useCallback((title: string, description?: string, duration?: number) => {
    addToast({ title, description, type: 'info', duration });
  }, [addToast]);

  /**
   * Objeto que contiene todas las funciones y estado del contexto.
   * Se pasa como valor al ToastContext.Provider.
   */
  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
        position="top-right"
      />
    </ToastContext.Provider>
  );
}

/**
 * Hook personalizado para acceder al contexto de toast.
 * Debe usarse dentro de un ToastProvider.
 *
 * @returns {ToastContextType} Objeto con todas las funciones de toast.
 * @throws {Error} Si se usa fuera de un ToastProvider.
 *
 * @example
 * ```typescript
 * const { showSuccess, showError, toasts } = useToast();
 * ```
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
