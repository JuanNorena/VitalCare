/**
 * Contexto de accesibilidad para gestionar modo oscuro y tamaño de fuente
 */

import { createContext, useContext, useEffect, useLayoutEffect, useState, ReactNode } from 'react';

interface AccessibilityContextType {
  isDarkMode: boolean;
  fontSize: number;
  toggleDarkMode: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const DEFAULT_FONT_SIZE = 16;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 24;
const FONT_SIZE_STEP = 2;

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  // Estado inicial sincronizado con localStorage para evitar parpadeo; default modo claro
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('accessibility-darkMode');
      // Solo retornar true si explícitamente está guardado como 'true'
      return saved === 'true';
    } catch {
      // Si localStorage no está disponible (SSR), default a modo claro
      return false;
    }
  });
  
  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('accessibility-fontSize');
      const n = saved ? parseInt(saved, 10) : DEFAULT_FONT_SIZE;
      return Number.isFinite(n) ? Math.min(Math.max(n, MIN_FONT_SIZE), MAX_FONT_SIZE) : DEFAULT_FONT_SIZE;
    } catch {
      return DEFAULT_FONT_SIZE;
    }
  });

  // Aplicar tema inmediatamente (antes de pintar) para que por defecto sea claro
  useLayoutEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    // Limpiar todas las clases de tema primero
    root.classList.remove('dark', 'light');
    body.classList.remove('dark', 'light');
    
    if (isDarkMode) {
      root.classList.add('dark');
      body.classList.add('dark');
      // Forzar estilos inline para asegurar aplicación
      root.style.colorScheme = 'dark';
      body.style.backgroundColor = '#1f2937';
      body.style.color = '#f9fafb';
      console.log('🌙 Modo oscuro activado - clases aplicadas:', root.classList.toString());
    } else {
      root.classList.add('light');
      body.classList.add('light');
      // Forzar estilos inline para modo claro
      root.style.colorScheme = 'light';
      body.style.backgroundColor = '#ffffff';
      body.style.color = '#1f2937';
      console.log('☀️ Modo claro activado - clases aplicadas:', root.classList.toString());
    }
    
    // Trigger reflow para asegurar que los cambios se apliquen
    void root.offsetHeight;
  }, [isDarkMode]);

  // Persistir preferencia
  useEffect(() => {
    try {
      localStorage.setItem('accessibility-darkMode', isDarkMode.toString());
    } catch {
      console.warn('No se pudo guardar la preferencia de tema');
    }
  }, [isDarkMode]);

  // Aplicar tamaño de fuente
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${fontSize}px`;
    localStorage.setItem('accessibility-fontSize', fontSize.toString());
  }, [fontSize]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + FONT_SIZE_STEP, MAX_FONT_SIZE));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - FONT_SIZE_STEP, MIN_FONT_SIZE));
  };

  const resetFontSize = () => {
    setFontSize(DEFAULT_FONT_SIZE);
  };

  const value: AccessibilityContextType = {
    isDarkMode,
    fontSize,
    toggleDarkMode,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
