/**
 * Archivo de configuración inicial para las pruebas de Vitest.
 * 
 * Este archivo se ejecuta una vez antes de todos los tests y configura:
 * - Matchers personalizados de Testing Library (@testing-library/jest-dom)
 * - Mocks globales para funcionalidades del navegador
 * - Configuración de variables de entorno para testing
 * 
 * Los matchers como `toBeInTheDocument()`, `toHaveClass()`, etc.
 * están disponibles automáticamente en todos los tests después de este setup.
 * 
 * @see https://testing-library.com/docs/ecosystem-jest-dom
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

/**
 * Limpieza automática después de cada test.
 * Esto elimina todos los componentes montados del DOM virtual.
 */
afterEach(() => {
  cleanup();
});

/**
 * Mock de localStorage para simular el almacenamiento del navegador.
 * Proporciona una implementación funcional de localStorage en el entorno de testing.
 */
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

/**
 * Mock de sessionStorage con la misma implementación que localStorage.
 */
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(global, 'sessionStorage', {
  value: sessionStorageMock,
});

/**
 * Mock de window.matchMedia para pruebas de responsive design.
 * Necesario para componentes que usen media queries.
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/**
 * Variables de entorno para testing.
 * Simula las variables que normalmente se cargarían desde .env
 */
process.env.VITE_API_BASE_URL = 'http://localhost:8080/api';

/**
 * Mock de console.error para capturar errores esperados en tests
 * sin llenar la consola de mensajes durante la ejecución de tests.
 */
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    // Ignora advertencias específicas de React Testing Library
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
