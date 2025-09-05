import { useState } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export function AccessibilityMenu() {
  const { dark, toggleDark, increaseFont, decreaseFont, reset } = useAccessibility();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-50">
      {/* Desktop: vertical strip exactly like image 2 */}
      <div className="hidden md:flex flex-col items-center space-y-2 bg-blue-700 text-white rounded-l-3xl px-4 py-6 shadow-xl">
        <button
          aria-label="Alternar modo oscuro"
          title="Alternar modo oscuro"
          aria-pressed={dark}
          onClick={toggleDark}
          className="w-14 h-14 bg-white rounded-xl flex items-center justify-center focus-visible shadow-md hover:shadow-lg transition-shadow"
        >
          {dark ? (
            <svg className="w-7 h-7 text-blue-700" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M21.64 13a1 1 0 00-.93-1.34 7 7 0 11-8.97-8.97A1 1 0 0011 3.36a9 9 0 109.64 9.64z" />
            </svg>
          ) : (
            <svg className="w-7 h-7 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-6.36l-1.41 1.41M7.05 16.95l-1.41 1.41M18.36 18.36l-1.41-1.41M7.05 7.05L5.64 5.64" />
            </svg>
          )}
        </button>

        <button
          aria-label="Aumentar tamaño de fuente"
          title="Aumentar tamaño"
          onClick={increaseFont}
          className="w-14 h-14 bg-white rounded-xl flex items-center justify-center focus-visible shadow-md hover:shadow-lg transition-shadow"
        >
          <span className="text-xl font-bold text-blue-700">A+</span>
        </button>

        <button
          aria-label="Disminuir tamaño de fuente"
          title="Disminuir tamaño"
          onClick={decreaseFont}
          className="w-14 h-14 bg-white rounded-xl flex items-center justify-center focus-visible shadow-md hover:shadow-lg transition-shadow"
        >
          <span className="text-xl font-bold text-blue-700">A-</span>
        </button>

        <button
          aria-label="Reiniciar configuración de accesibilidad"
          title="Reiniciar"
          onClick={reset}
          className="w-14 h-14 bg-white rounded-xl flex items-center justify-center focus-visible shadow-md hover:shadow-lg transition-shadow"
        >
          <svg className="w-7 h-7 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M1 4v6h6M23 20v-6h-6"/>
            <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
        </button>
      </div>

      {/* Mobile: sliding drawer from right - responsive sizing */}
      <div className="md:hidden">
        {/* Toggle button - only shows when menu is closed */}
        {!open && (
          <button
            aria-label="Abrir menú de accesibilidad"
            title="Abrir menú de accesibilidad"
            onClick={() => setOpen(true)}
            className="fixed right-2 bottom-4 sm:right-4 sm:bottom-6 w-12 h-12 sm:w-14 sm:h-14 bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg focus-visible z-50"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Sliding menu panel - compact on small screens */}
        <div className={`fixed top-1/2 transform -translate-y-1/2 transition-all duration-300 ease-in-out z-40 ${
          open ? 'right-0' : 'right-[-80px] sm:right-[-100px]'
        }`}>
          <div className="flex flex-col items-center space-y-1 sm:space-y-2 bg-blue-700 text-white rounded-l-2xl sm:rounded-l-3xl px-2 py-3 sm:px-4 sm:py-6 shadow-xl">
            <button
              aria-label="Alternar modo oscuro"
              title="Alternar modo oscuro"
              aria-pressed={dark}
              onClick={toggleDark}
              className="w-10 h-10 sm:w-14 sm:h-14 bg-white rounded-lg sm:rounded-xl flex items-center justify-center focus-visible shadow-md hover:shadow-lg transition-shadow"
            >
              {dark ? (
                <svg className="w-5 h-5 sm:w-7 sm:h-7 text-blue-700" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M21.64 13a1 1 0 00-.93-1.34 7 7 0 11-8.97-8.97A1 1 0 0011 3.36a9 9 0 109.64 9.64z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 sm:w-7 sm:h-7 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                  <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-6.36l-1.41 1.41M7.05 16.95l-1.41 1.41M18.36 18.36l-1.41-1.41M7.05 7.05L5.64 5.64" />
                </svg>
              )}
            </button>

            <button
              aria-label="Aumentar tamaño de fuente"
              title="Aumentar tamaño"
              onClick={increaseFont}
              className="w-10 h-10 sm:w-14 sm:h-14 bg-white rounded-lg sm:rounded-xl flex items-center justify-center focus-visible shadow-md hover:shadow-lg transition-shadow"
            >
              <span className="text-lg sm:text-xl font-bold text-blue-700">A+</span>
            </button>

            <button
              aria-label="Disminuir tamaño de fuente"
              title="Disminuir tamaño"
              onClick={decreaseFont}
              className="w-10 h-10 sm:w-14 sm:h-14 bg-white rounded-lg sm:rounded-xl flex items-center justify-center focus-visible shadow-md hover:shadow-lg transition-shadow"
            >
              <span className="text-lg sm:text-xl font-bold text-blue-700">A-</span>
            </button>

            <button
              aria-label="Reiniciar configuración de accesibilidad"
              title="Reiniciar"
              onClick={reset}
              className="w-10 h-10 sm:w-14 sm:h-14 bg-white rounded-lg sm:rounded-xl flex items-center justify-center focus-visible shadow-md hover:shadow-lg transition-shadow"
            >
              <svg className="w-5 h-5 sm:w-7 sm:h-7 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M1 4v6h6M23 20v-6h-6"/>
                <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
            </button>

            {/* Close button - arrow pointing left */}
            <button
              aria-label="Cerrar menú de accesibilidad"
              title="Cerrar menú"
              onClick={() => setOpen(false)}
              className="w-10 h-10 sm:w-14 sm:h-14 bg-white rounded-lg sm:rounded-xl flex items-center justify-center focus-visible shadow-md hover:shadow-lg transition-shadow"
            >
              <svg className="w-5 h-5 sm:w-7 sm:h-7 text-blue-700 transform rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Backdrop overlay when open - closes menu when clicked */}
        {open && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-20 z-30"
            onClick={() => setOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

export default AccessibilityMenu;
