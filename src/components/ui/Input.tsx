/**
 * Componente Input reutilizable para la aplicación VitalCare.
 *
 * Este componente proporciona un campo de entrada estilizado que soporta todos los tipos
 * de input HTML estándar. Utiliza variables CSS personalizadas para mantener consistencia
 * con el tema de la aplicación y incluye estilos de foco accesibles.
 *
 * @component
 * @example
 * ```tsx
 * import { Input } from '@/components/ui/Input';
 *
 * function MyForm() {
 *   return (
 *     <div>
 *       <Input
 *         type="text"
 *         placeholder="Ingresa tu nombre"
 *         value={name}
 *         onChange={(e) => setName(e.target.value)}
 *       />
 *       <Input
 *         type="email"
 *         placeholder="correo@ejemplo.com"
 *         required
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @description
 * El componente utiliza React.forwardRef para permitir el acceso directo al elemento input,
 * facilitando el manejo de foco y validaciones. Incluye estilos responsivos y soporte
 * completo para archivos (file inputs) con estilos personalizados.
 *
 * Características:
 * - Soporte completo para todos los tipos de input HTML.
 * - Estilos de foco con anillo azul accesible.
 * - Estados deshabilitado y placeholder personalizables.
 * - Diseño responsivo con tamaños adaptativos.
 * - Integración con variables CSS del tema.
 *
 * @see {@link cn} para la utilidad de combinación de clases CSS.
 */

import * as React from "react"
import { cn } from "@/utils/cn"

/**
 * Props para el componente Input, extendiendo las props nativas de HTMLInputElement.
 * @interface InputProps
 * @extends React.InputHTMLAttributes<HTMLInputElement>
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Componente Input que renderiza un campo de entrada estilizado.
 * @param {InputProps} props - Las props del componente, incluyendo todas las de input HTML.
 * @param {React.Ref<HTMLInputElement>} ref - Referencia al elemento input.
 * @returns {JSX.Element} El campo de entrada renderizado.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[var(--vc-border)] bg-[var(--vc-input-bg)] px-3 py-2 text-sm text-[var(--vc-text)] transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:px-4 sm:text-base",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
