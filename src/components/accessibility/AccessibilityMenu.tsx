/**
 * Menú lateral de accesibilidad
 */

import { useState } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Button } from '@/components/ui/Button';

export function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    isDarkMode,
    fontSize,
    toggleDarkMode,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
  } = useAccessibility();

  return (
    <>
      {/* Botón de accesibilidad fijo */}
      <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-l-lg shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Abrir menú de accesibilidad"
          title="Accesibilidad"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
          >
            <path
              d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 6.5V8.5L18.5 9C19.8 9.2 21 9 21 9ZM3 9C3 9 4.2 9.2 5.5 9L9 8.5V6.5L3 7V9ZM9 10C9 10 9 10.5 9 11V16H11V19H13V16H15V11C15 10.5 15 10 15 10H9Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      {/* Panel lateral de accesibilidad */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Accesibilidad
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Cerrar menú de accesibilidad"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenido del menú */}
          <div className="space-y-6 flex-1">
            {/* Modo oscuro */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Tema
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">
                  Modo oscuro
                </span>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  aria-pressed={isDarkMode}
                  aria-label={`${isDarkMode ? 'Desactivar' : 'Activar'} modo oscuro`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDarkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Tamaño de fuente */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Tamaño de texto
              </h3>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">
                  Tamaño actual: {fontSize}px
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={decreaseFontSize}
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center text-sm"
                  aria-label="Disminuir tamaño de texto"
                  title="Texto más pequeño"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                  <span className="ml-1">A</span>
                </Button>
                
                <Button
                  onClick={resetFontSize}
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  aria-label="Restablecer tamaño de texto"
                  title="Tamaño normal"
                >
                  Reset
                </Button>
                
                <Button
                  onClick={increaseFontSize}
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center text-sm"
                  aria-label="Aumentar tamaño de texto"
                  title="Texto más grande"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="ml-1">A</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay para cerrar el menú en móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
