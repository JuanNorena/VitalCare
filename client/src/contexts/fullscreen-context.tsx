import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Tipo que define la estructura del contexto de pantalla completa.
 * Proporciona el estado y métodos para controlar el modo de pantalla completa.
 */
interface FullscreenContextType {
  /** Indica si la aplicación está actualmente en modo de pantalla completa */
  isFullscreen: boolean;
  /** 
   * Función para establecer manualmente el estado de pantalla completa
   * @param value - Nuevo valor del estado de pantalla completa
   */
  setIsFullscreen: (value: boolean) => void;
  /** Función para alternar entre modo pantalla completa y modo normal */
  toggleFullscreen: () => void;
}

/**
 * Contexto de React para gestionar el estado de pantalla completa.
 * Proporciona acceso global al estado y funciones de control de pantalla completa.
 */
const FullscreenContext = createContext<FullscreenContextType | undefined>(undefined);

/**
 * Hook personalizado para acceder al contexto de pantalla completa.
 * Debe ser utilizado dentro de un componente envuelto por FullscreenProvider.
 * 
 * @returns Objeto con el estado y funciones para controlar la pantalla completa
 * @throws Error si se usa fuera del FullscreenProvider
 * 
 * @example
 * ```tsx
 * const { isFullscreen, toggleFullscreen } = useFullscreen();
 * 
 * return (
 *   <button onClick={toggleFullscreen}>
 *     {isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
 *   </button>
 * );
 * ```
 */
export const useFullscreen = () => {
  const context = useContext(FullscreenContext);
  if (context === undefined) {
    throw new Error('useFullscreen must be used within a FullscreenProvider');
  }
  return context;
};

/**
 * Propiedades del componente FullscreenProvider.
 */
interface FullscreenProviderProps {
  /** Componentes hijos que tendrán acceso al contexto de pantalla completa */
  children: React.ReactNode;
}

/**
 * Proveedor de contexto para la funcionalidad de pantalla completa.
 * Gestiona el estado global de pantalla completa y proporciona métodos para controlarlo.
 * 
 * Utiliza la API nativa del navegador (`document.requestFullscreen` y `document.exitFullscreen`)
 * para manejar las transiciones de pantalla completa y sincroniza el estado interno
 * con los eventos del navegador.
 * 
 * @param props - Propiedades del componente
 * @returns Proveedor de contexto envolviendo los componentes hijos
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <FullscreenProvider>
 *       <Dashboard />
 *       <Visualizer />
 *     </FullscreenProvider>
 *   );
 * }
 * ```
 */
export const FullscreenProvider: React.FC<FullscreenProviderProps> = ({ children }) => {
  /** Estado interno que rastrea si la aplicación está en modo de pantalla completa */
  const [isFullscreen, setIsFullscreen] = useState(false);

  /**
   * Alterna entre el modo de pantalla completa y el modo normal.
   * Utiliza las APIs nativas del navegador para entrar o salir de pantalla completa.
   * 
   * - Si no está en pantalla completa: ejecuta `requestFullscreen()` en el elemento documento
   * - Si está en pantalla completa: ejecuta `exitFullscreen()` para salir
   * 
   * Maneja errores de forma silenciosa registrándolos en la consola.
   * El estado se actualiza automáticamente a través del listener de eventos.
   */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Entrar en pantalla completa
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error entering fullscreen:", err);
      });
    } else {
      // Salir de pantalla completa
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error("Error exiting fullscreen:", err);
      });
    }
  };

  /**
   * Efecto que se ejecuta al montar el componente para configurar el listener
   * de eventos de cambios en el estado de pantalla completa.
   * 
   * Escucha el evento 'fullscreenchange' del documento y actualiza el estado
   * interno cuando el usuario entra o sale de pantalla completa mediante
   * atajos de teclado (como F11) o métodos del navegador.
   * 
   * Se limpia automáticamente al desmontar el componente para evitar memory leaks.
   */
  useEffect(() => {
    /**
     * Maneja los cambios en el estado de pantalla completa del navegador.
     * Sincroniza el estado interno con el estado real del documento.
     */
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  /** Objeto de valor que se proporciona a través del contexto */
  const value = {
    isFullscreen,
    setIsFullscreen,
    toggleFullscreen,
  };

  return (
    <FullscreenContext.Provider value={value}>
      {children}
    </FullscreenContext.Provider>
  );
};
