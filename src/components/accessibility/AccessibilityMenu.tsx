import { useState } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

/**
 * Componente de menú de accesibilidad para la aplicación VitalCare.
 *
 * Este componente proporciona una interfaz de usuario para ajustar configuraciones de accesibilidad,
 * incluyendo el cambio entre modo oscuro y claro, aumento y disminución del tamaño de fuente,
 * y reinicio de configuraciones. Está diseñado para ser accesible y responsivo, con versiones
 * específicas para escritorio y móvil.
 *
 * @component
 * @example
 * ```tsx
 * import { AccessibilityMenu } from '@/components/accessibility/AccessibilityMenu';
 *
 * function App() {
 *   return (
 *     <div>
 *       <AccessibilityMenu />
 *     </div>
 *   );
 * }
 * ```
 *
 * @description
 * El componente utiliza el contexto `useAccessibility` para gestionar el estado global de accesibilidad.
 * En escritorio, se muestra como una barra vertical fija en el lado derecho de la pantalla.
 * En móvil, se presenta como un menú deslizante que se activa con un botón flotante.
 *
 * Funcionalidades principales:
 * - Alternar entre modo oscuro y claro.
 * - Aumentar o disminuir el tamaño de fuente.
 * - Reiniciar todas las configuraciones de accesibilidad a sus valores predeterminados.
 *
 * @see {@link useAccessibility} para más detalles sobre el contexto de accesibilidad.
 */
export function AccessibilityMenu() {
  /**
   * Estado interno para controlar la apertura y cierre del menú en dispositivos móviles.
   * @type {boolean}
   */
  const [open, setOpen] = useState(false);

  /**
   * Hook del contexto de accesibilidad que proporciona funciones y estado para gestionar
   * las configuraciones de accesibilidad a nivel global.
   * @type {Object}
   * @property {boolean} dark - Indica si el modo oscuro está activado.
   * @property {Function} toggleDark - Función para alternar entre modo oscuro y claro.
   * @property {Function} increaseFont - Función para aumentar el tamaño de fuente.
   * @property {Function} decreaseFont - Función para disminuir el tamaño de fuente.
   * @property {Function} reset - Función para reiniciar todas las configuraciones de accesibilidad.
   */
  const { dark, toggleDark, increaseFont, decreaseFont, reset } = useAccessibility();

  return (
    <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-50">
      {/* Sección de escritorio: Barra vertical fija con botones de accesibilidad */}
      <div className="hidden md:flex flex-col items-center space-y-2 bg-blue-700 text-white rounded-l-3xl px-4 py-6 shadow-xl">
        {/* Botón para alternar modo oscuro */}
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

        {/* Botón para aumentar tamaño de fuente */}
        <button
          aria-label="Aumentar tamaño de fuente"
          title="Aumentar tamaño"
          onClick={increaseFont}
          className="w-14 h-14 bg-white rounded-xl flex items-center justify-center focus-visible shadow-md hover:shadow-lg transition-shadow"
        >
          <span className="text-xl font-bold text-blue-700">A+</span>
        </button>

        {/* Botón para disminuir tamaño de fuente */}
        <button
          aria-label="Disminuir tamaño de fuente"
          title="Disminuir tamaño"
          onClick={decreaseFont}
          className="w-14 h-14 bg-white rounded-xl flex items-center justify-center focus-visible shadow-md hover:shadow-lg transition-shadow"
        >
          <span className="text-xl font-bold text-blue-700">A-</span>
        </button>

        {/* Botón para reiniciar configuración de accesibilidad */}
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

      {/* Sección móvil: Menú deslizante con botón flotante */}
      <div className="md:hidden">
        {/* Botón flotante para abrir el menú - solo visible cuando el menú está cerrado */}
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

        {/* Panel deslizante del menú - se anima desde la derecha */}
        <div className={`fixed top-1/2 transform -translate-y-1/2 transition-all duration-300 ease-in-out z-40 ${
          open ? 'right-0' : 'right-[-80px] sm:right-[-100px]'
        }`}>
          <div className="flex flex-col items-center space-y-1 sm:space-y-2 bg-blue-700 text-white rounded-l-2xl sm:rounded-l-3xl px-2 py-3 sm:px-4 sm:py-6 shadow-xl">
            {/* Botón para alternar modo oscuro en móvil */}
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

            {/* Botón para aumentar tamaño de fuente en móvil */}
            <button
              aria-label="Aumentar tamaño de fuente"
              title="Aumentar tamaño"
              onClick={increaseFont}
              className="w-10 h-10 sm:w-14 sm:h-14 bg-white rounded-lg sm:rounded-xl flex items-center justify-center focus-visible shadow-md hover:shadow-lg transition-shadow"
            >
              <span className="text-lg sm:text-xl font-bold text-blue-700">A+</span>
            </button>

            {/* Botón para disminuir tamaño de fuente en móvil */}
            <button
              aria-label="Disminuir tamaño de fuente"
              title="Disminuir tamaño"
              onClick={decreaseFont}
              className="w-10 h-10 sm:w-14 sm:h-14 bg-white rounded-lg sm:rounded-xl flex items-center justify-center focus-visible shadow-md hover:shadow-lg transition-shadow"
            >
              <span className="text-lg sm:text-xl font-bold text-blue-700">A-</span>
            </button>

            {/* Botón para reiniciar configuración en móvil */}
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

            {/* Botón para cerrar el menú - flecha apuntando a la izquierda */}
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

        {/* Overlay de fondo cuando el menú está abierto - cierra el menú al hacer clic */}
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
