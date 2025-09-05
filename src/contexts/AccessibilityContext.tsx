/**
 * Contexto de accesibilidad para gestionar modo oscuro y tamaño de fuente
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);

  // Cargar configuraciones guardadas al inicializar
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('accessibility-darkMode');
    const savedFontSize = localStorage.getItem('accessibility-fontSize');

    if (savedDarkMode) {
      setIsDarkMode(savedDarkMode === 'true');
    }

    if (savedFontSize) {
      const parsedFontSize = parseInt(savedFontSize, 10);
      if (parsedFontSize >= MIN_FONT_SIZE && parsedFontSize <= MAX_FONT_SIZE) {
        setFontSize(parsedFontSize);
      }
    }
  }, []);

  // Aplicar tema oscuro
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('accessibility-darkMode', isDarkMode.toString());
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
