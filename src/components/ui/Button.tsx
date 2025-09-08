/**
 * Componente Button reutilizable para la aplicación VitalCare.
 *
 * Este componente proporciona un botón estilizado con múltiples variantes y tamaños,
 * utilizando variables CSS personalizadas para mantener consistencia con el tema de la aplicación.
 * Soporta todas las props estándar de HTMLButtonElement y añade funcionalidades de accesibilidad.
 *
 * @component
 * @example
 * ```tsx
 * import { Button } from '@/components/ui/Button';
 *
 * function MyComponent() {
 *   return (
 *     <div>
 *       <Button variant="default" size="default" onClick={handleClick}>
 *         Click me
 *       </Button>
 *       <Button variant="outline" size="sm">
 *         Outline Button
 *       </Button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @description
 * El componente utiliza React.forwardRef para permitir el acceso directo al elemento DOM,
 * facilitando el manejo de foco y otras interacciones. Las clases CSS se combinan usando
 * la utilidad cn() para optimizar el rendimiento y evitar conflictos de estilos.
 *
 * Variantes disponibles:
 * - default: Botón primario con fondo azul.
 * - destructive: Botón para acciones peligrosas (rojo).
 * - outline: Botón con borde y fondo transparente.
 * - secondary: Botón secundario con fondo gris.
 * - ghost: Botón sin fondo, solo hover.
 * - link: Botón que se ve como un enlace.
 *
 * Tamaños disponibles:
 * - default: Tamaño estándar.
 * - sm: Tamaño pequeño.
 * - lg: Tamaño grande.
 * - icon: Tamaño cuadrado para iconos.
 *
 * @see {@link cn} para la utilidad de combinación de clases CSS.
 */

import * as React from "react"
import { cn } from "@/utils/cn"

/**
 * Props para el componente Button, extendiendo las props nativas de HTMLButtonElement.
 * @interface ButtonProps
 * @extends React.ButtonHTMLAttributes<HTMLButtonElement>
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visual del botón */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  /** Tamaño del botón */
  size?: "default" | "sm" | "lg" | "icon"
}

/**
 * Componente Button que renderiza un botón estilizado con variantes y tamaños personalizables.
 * @param {ButtonProps} props - Las props del componente.
 * @param {React.Ref<HTMLButtonElement>} ref - Referencia al elemento button.
 * @returns {JSX.Element} El botón renderizado.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    /**
     * Clases base aplicadas a todos los botones para consistencia.
     * Incluye estilos de accesibilidad y transiciones.
     * @type {string}
     */
    const baseClasses = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:text-base"
    
    /**
     * Objeto con las clases CSS para cada variante del botón.
     * Utiliza variables CSS personalizadas para el tema.
     * @type {Record<string, string>}
     */
    const variants = {
      default: "bg-[var(--vc-button-primary)] text-white hover:bg-blue-700 focus:ring-blue-500",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
      outline: "border-2 border-[var(--vc-border)] bg-[var(--vc-bg)] hover:bg-[var(--vc-hover)] text-[var(--vc-text)] focus:ring-blue-500",
      secondary: "bg-[var(--vc-bg-secondary)] text-[var(--vc-text)] hover:bg-[var(--vc-hover)] focus:ring-gray-500",
      ghost: "hover:bg-[var(--vc-hover)] text-[var(--vc-text)] focus:ring-gray-500",
      link: "text-[var(--vc-button-primary)] underline-offset-4 hover:underline",
    }

    /**
     * Objeto con las clases CSS para cada tamaño del botón.
     * Incluye tamaños responsivos para diferentes dispositivos.
     * @type {Record<string, string>}
     */
    const sizes = {
      default: "h-10 px-4 py-2 sm:h-11 sm:px-6 sm:py-3",
      sm: "h-8 px-3 py-1 text-xs sm:h-9 sm:px-4 sm:py-2 sm:text-sm",
      lg: "h-12 px-6 py-3 text-base sm:h-14 sm:px-8 sm:py-4 sm:text-lg",
      icon: "h-10 w-10 sm:h-11 sm:w-11",
    }

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
