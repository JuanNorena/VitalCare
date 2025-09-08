/**
 * Utilidad para combinar clases CSS de Tailwind CSS.
 *
 * Esta función combina múltiples clases CSS utilizando clsx para manejo condicional
 * y tailwind-merge para resolver conflictos de clases de Tailwind. Es una utilidad
 * esencial en aplicaciones React con Tailwind CSS para combinar clases dinámicas
 * de manera eficiente y sin conflictos.
 *
 * @example
 * ```tsx
 * import { cn } from '@/utils/cn';
 *
 * // Combinar clases básicas
 * const buttonClasses = cn('px-4 py-2 rounded', 'bg-blue-500');
 *
 * // Combinar clases condicionales
 * const buttonClasses = cn(
 *   'px-4 py-2 rounded',
 *   isPrimary && 'bg-blue-500 text-white',
 *   isDisabled && 'opacity-50 cursor-not-allowed'
 * );
 *
 * // Resolver conflictos de Tailwind
 * const classes = cn('px-2', 'px-4'); // Resultado: 'px-4' (la última gana)
 * ```
 *
 * @description
 * La función cn (class names) es un wrapper que:
 * 1. Usa clsx para combinar clases condicionales de manera inteligente
 * 2. Usa tailwind-merge para resolver conflictos entre clases de Tailwind
 * 3. Retorna una cadena de clases CSS optimizada
 *
 * Es especialmente útil para:
 * - Clases condicionales basadas en props o estado
 * - Combinar clases base con clases modificadoras
 * - Resolver conflictos entre utilidades de Tailwind
 * - Mantener el código limpio y legible
 *
 * @param {...ClassValue[]} inputs - Clases CSS a combinar (strings, arrays, objetos, etc.)
 * @returns {string} Cadena de clases CSS combinadas y optimizadas.
 *
 * @see {@link https://github.com/lukeed/clsx} para clsx documentation.
 * @see {@link https://github.com/dcastil/tailwind-merge} para tailwind-merge documentation.
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Función principal para combinar clases CSS.
 *
 * @function cn
 * @param {...ClassValue[]} inputs - Argumentos variables de clases CSS.
 * @returns {string} Clases combinadas y resueltas.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
