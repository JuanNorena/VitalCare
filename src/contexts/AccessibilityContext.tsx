/**
 * Contexto de accesibilidad para VitalCare.
 *
 * Este contexto proporciona funcionalidades de accesibilidad globales para toda la aplicación,
 * incluyendo modo oscuro, escala de fuente y persistencia de preferencias en localStorage.
 * Está diseñado para ser usado por el AccessibilityMenu y cualquier componente que necesite
 * acceder a las configuraciones de accesibilidad del usuario.
 *
 * @example
 * ```tsx
 * import { useAccessibility } from '@/contexts/AccessibilityContext';
 *
 * function MyComponent() {
 *   const { dark, fontScale, toggleDark, increaseFont } = useAccessibility();
 *
 *   return (
 *     <div>
 *       <button onClick={toggleDark}>
 *         Modo {dark ? 'claro' : 'oscuro'}
 *       </button>
 *       <button onClick={increaseFont}>
 *         Aumentar fuente ({fontScale})
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @description
 * El contexto maneja:
 * - Modo oscuro/claro con sincronización automática del DOM
 * - Escala de fuente con límites (0.8x - 1.6x)
 * - Persistencia de preferencias en localStorage
 * - Sincronización entre pestañas del navegador
 * - Detección automática de preferencias del sistema
 *
 * Las preferencias se almacenan con las claves:
 * - 'vc:dark': '1' para modo oscuro, '0' para modo claro
 * - 'vc:fontScale': número decimal entre 0.8 y 1.6
 *
 * @see {@link AccessibilityMenu} para el componente que usa este contexto.
 * @see {@link useAccessibility} para el hook personalizado.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Estado del contexto de accesibilidad.
 * Define todas las propiedades y funciones disponibles en el contexto.
 * @interface AccessibilityState
 */
type AccessibilityState = {
  /** Indica si el modo oscuro está activado */
  dark: boolean;
  /** Escala actual de la fuente (entre 0.8 y 1.6) */
  fontScale: number;
  /** Función para alternar entre modo oscuro y claro */
  toggleDark: () => void;
  /** Función para establecer directamente el modo oscuro */
  setDark: (v: boolean) => void;
  /** Función para aumentar el tamaño de fuente */
  increaseFont: () => void;
  /** Función para disminuir el tamaño de fuente */
  decreaseFont: () => void;
  /** Función para resetear todas las configuraciones a valores por defecto */
  reset: () => void;
};

/**
 * Clave para almacenar la preferencia de modo oscuro en localStorage.
 * @constant {string}
 */
const ACCESS_KEY_DARK = 'vc:dark';

/**
 * Clave para almacenar la escala de fuente en localStorage.
 * @constant {string}
 */
const ACCESS_KEY_FONT = 'vc:fontScale';

/**
 * Estado por defecto del contexto de accesibilidad.
 * @constant {Object}
 */
const defaultState = {
  dark: false,
  fontScale: 1,
};

/**
 * Contexto de React para el estado de accesibilidad.
 * Proporciona el estado y funciones de accesibilidad a todos los componentes hijos.
 * @type {React.Context<AccessibilityState | undefined>}
 */
const AccessibilityContext = createContext<AccessibilityState | undefined>(undefined);

/**
 * Proveedor del contexto de accesibilidad.
 *
 * Este componente envuelve la aplicación y proporciona el contexto de accesibilidad
 * a todos sus componentes hijos. Maneja la inicialización, persistencia y
 * sincronización de las preferencias de accesibilidad.
 *
 * @component
 * @param {Object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Componentes hijos que tendrán acceso al contexto.
 * @returns {JSX.Element} Proveedor del contexto con los componentes hijos.
 *
 * @example
 * ```tsx
 * // En main.tsx o App.tsx
 * <AccessibilityProvider>
 *   <App />
 * </AccessibilityProvider>
 * ```
 */
export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  /**
   * Estado del modo oscuro.
   * Se inicializa desde localStorage o preferencia del sistema.
   * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
   */
  const [dark, setDarkState] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(ACCESS_KEY_DARK);
      if (v === '1') return true;
      if (v === '0') return false;
    } catch (e) {}
    // fallback to system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  /**
   * Estado de la escala de fuente.
   * Se inicializa desde localStorage o valor por defecto.
   * @type {[number, React.Dispatch<React.SetStateAction<number>>]}
   */
  const [fontScale, setFontScale] = useState<number>(() => {
    try {
      const v = localStorage.getItem(ACCESS_KEY_FONT);
      if (v) return Number(v);
    } catch (e) {}
    return defaultState.fontScale;
  });

  // ========================================
  // EFECTOS PARA SINCRONIZACIÓN
  // ========================================

  /**
   * Efecto para sincronizar el modo oscuro con el DOM y localStorage.
   * Agrega/remueve la clase 'dark' del elemento raíz y persiste la preferencia.
   */
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark'); else root.classList.remove('dark');
    try { localStorage.setItem(ACCESS_KEY_DARK, dark ? '1' : '0'); } catch {}
  }, [dark]);

  /**
   * Efecto para sincronizar la escala de fuente con CSS y localStorage.
   * Aplica la escala con límites (0.8x - 1.6x) y persiste la preferencia.
   */
  useEffect(() => {
    const clamped = Math.max(0.8, Math.min(1.6, fontScale));
    document.documentElement.style.setProperty('--vc-font-scale', String(clamped));
    try { localStorage.setItem(ACCESS_KEY_FONT, String(clamped)); } catch (e) {}
  }, [fontScale]);

  /**
   * Efecto para sincronizar cambios de localStorage entre pestañas.
   * Escucha eventos de storage para mantener consistencia entre pestañas abiertas.
   */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACCESS_KEY_DARK) setDarkState(e.newValue === '1');
      if (e.key === ACCESS_KEY_FONT) setFontScale(e.newValue ? Number(e.newValue) : defaultState.fontScale);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ========================================
  // FUNCIONES DEL CONTEXTO
  // ========================================

  /**
   * Alterna entre modo oscuro y claro.
   * @function toggleDark
   */
  const toggleDark = () => setDarkState(d => !d);

  /**
   * Establece directamente el modo oscuro.
   * @function setDark
   * @param {boolean} v - True para modo oscuro, false para modo claro.
   */
  const setDark = (v: boolean) => setDarkState(v);

  /**
   * Aumenta la escala de fuente en 0.1, con límite máximo de 1.6.
   * @function increaseFont
   */
  const increaseFont = () => setFontScale(s => Math.min(1.6, +(s + 0.1).toFixed(2)));

  /**
   * Disminuye la escala de fuente en 0.1, con límite mínimo de 0.8.
   * @function decreaseFont
   */
  const decreaseFont = () => setFontScale(s => Math.max(0.8, +(s - 0.1).toFixed(2)));

  /**
   * Resetea todas las configuraciones de accesibilidad a valores por defecto.
   * - Modo oscuro: según preferencia del sistema
   * - Escala de fuente: 1.0 (100%)
   * @function reset
   */
  const reset = () => {
    setDarkState(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setFontScale(defaultState.fontScale);
  };

  return (
    <AccessibilityContext.Provider value={{ dark, fontScale, toggleDark, setDark, increaseFont, decreaseFont, reset }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

/**
 * Hook personalizado para acceder al contexto de accesibilidad.
 *
 * Debe ser usado dentro de un componente envuelto por AccessibilityProvider.
 * Proporciona acceso a todas las propiedades y funciones del contexto.
 *
 * @function useAccessibility
 * @returns {AccessibilityState} Estado y funciones del contexto de accesibilidad.
 * @throws {Error} Si se usa fuera de AccessibilityProvider.
 *
 * @example
 * ```tsx
 * const { dark, toggleDark, increaseFont } = useAccessibility();
 * ```
 */
export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}

export default AccessibilityContext;
