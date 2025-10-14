/**
 * Componente DatePicker personalizado para la aplicación VitalCare.
 *
 * Este componente proporciona un selector de fecha y hora mejorado con:
 * - Interfaz visual coherente con el diseño de VitalCare
 * - Soporte para modo claro y oscuro
 * - Validación de fechas mínimas y máximas
 * - Formato de fecha localizado (es-CO)
 * - Accesibilidad mejorada
 * - Calendario visual interactivo
 *
 * @component
 * @example
 * ```tsx
 * import { DatePicker } from '@/components/ui/DatePicker';
 *
 * function MyForm() {
 *   const [date, setDate] = useState('');
 *
 *   return (
 *     <DatePicker
 *       value={date}
 *       onChange={(e) => setDate(e.target.value)}
 *       label="Fecha de la cita"
 *       minDate={new Date()}
 *       required
 *     />
 *   );
 * }
 * ```
 *
 * @description
 * El componente combina un input nativo datetime-local con una interfaz visual
 * mejorada que incluye un calendario desplegable. Utiliza las variables CSS
 * del tema de VitalCare para mantener consistencia visual.
 *
 * Características:
 * - Calendario visual con navegación mensual
 * - Selección de hora con controles incrementales
 * - Validación automática de rangos de fechas
 * - Formato de visualización localizado
 * - Estilos adaptativos a tema claro/oscuro
 * - Estados de error y validación
 *
 * @see {@link Input} para el componente base de entrada.
 * @see {@link cn} para la utilidad de combinación de clases CSS.
 */

import * as React from "react";
import { cn } from "@/utils/cn";
import { Calendar, Clock } from "lucide-react";

/**
 * Props para el componente DatePicker.
 * @interface DatePickerProps
 */
export interface DatePickerProps {
  /** Valor actual de la fecha en formato ISO string */
  value: string;
  /** Función callback cuando cambia la fecha */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Etiqueta descriptiva del campo */
  label?: string;
  /** Fecha mínima permitida */
  minDate?: Date | string;
  /** Fecha máxima permitida */
  maxDate?: Date | string;
  /** Indica si el campo es requerido */
  required?: boolean;
  /** Indica si el campo está deshabilitado */
  disabled?: boolean;
  /** Mensaje de error personalizado */
  error?: string;
  /** Clases CSS adicionales */
  className?: string;
  /** Nombre del campo para formularios */
  name?: string;
  /** ID del campo */
  id?: string;
  /** Placeholder para el campo */
  placeholder?: string;
  /** Tipo de selector: 'date' solo fecha, 'datetime-local' fecha y hora */
  type?: "date" | "datetime-local";
  /** Texto de ayuda adicional */
  helpText?: string;
}

/**
 * Componente DatePicker que renderiza un selector de fecha y hora mejorado.
 * @param {DatePickerProps} props - Las props del componente.
 * @returns {JSX.Element} El selector de fecha renderizado.
 */
export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      label,
      minDate,
      maxDate,
      required = false,
      disabled = false,
      error,
      className,
      name,
      id,
      placeholder = "Selecciona fecha",
      type = "datetime-local",
      helpText,
    },
    ref
  ) => {
    /**
     * Formatea una fecha para el atributo min/max del input.
     * @param {Date | string} date - Fecha a formatear.
     * @returns {string} Fecha en formato YYYY-MM-DD o YYYY-MM-DDTHH:mm.
     */
    const formatDateForInput = (date: Date | string): string => {
      const d = typeof date === "string" ? new Date(date) : date;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      
      if (type === "date") {
        return `${year}-${month}-${day}`;
      }
      
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    /**
     * Formatea una fecha para mostrarla al usuario.
     * @param {string} dateString - Fecha en formato ISO.
     * @returns {string} Fecha formateada legible.
     */
    const formatDateForDisplay = (dateString: string): string => {
      if (!dateString) return "";
      
      if (type === "date") {
        // Para tipo "date", parsear manualmente para evitar problemas de zona horaria
        // dateString viene en formato "YYYY-MM-DD"
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        
        return date.toLocaleDateString("es-CO", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
      
      // Para datetime-local, usar Date normal
      const date = new Date(dateString);
      return date.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // Preparar valores min y max
    const minValue = minDate ? formatDateForInput(minDate) : undefined;
    const maxValue = maxDate ? formatDateForInput(maxDate) : undefined;

    return (
      <div className={cn("space-y-2", className)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-[var(--vc-text)]"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Contenedor del input con icono */}
        <div className="relative">
          {/* Icono de calendario - clickeable para abrir el selector */}
          <div 
            className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer z-10 hover:scale-110 transition-transform"
            onClick={() => {
              // Hacer clic en el input para abrir el selector de fecha
              if (ref && 'current' in ref && ref.current) {
                ref.current.showPicker?.();
              }
            }}
          >
            <Calendar className="w-5 h-5 text-[var(--vc-text)]/60 hover:text-[var(--vc-text)]" />
          </div>

          {/* Input nativo con estilos personalizados */}
          <input
            ref={ref}
            type={type}
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            min={minValue}
            max={maxValue}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            className={cn(
              // Estilos base
              "flex h-11 w-full rounded-lg border pl-11 py-2 text-sm transition-all duration-200",
              // Padding derecho según tipo
              type === "datetime-local" ? "pr-14" : "pr-10",
              // Colores del tema
              "bg-[var(--vc-input-bg)] text-[var(--vc-text)] border-[var(--vc-border)]",
              // Estados de foco
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
              // Estados hover
              "hover:border-blue-400",
              // Estados deshabilitado
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-800",
              // Estados de error
              error && "border-red-500 focus-visible:ring-red-500",
              // Ocultar el indicador nativo del calendario (usamos nuestro icono personalizado)
              "[&::-webkit-calendar-picker-indicator]:opacity-0",
              "[&::-webkit-calendar-picker-indicator]:absolute",
              "[&::-webkit-calendar-picker-indicator]:right-0",
              "[&::-webkit-calendar-picker-indicator]:w-full",
              "[&::-webkit-calendar-picker-indicator]:h-full",
              "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
              // Responsive
              "sm:text-base"
            )}
          />

          {/* Icono de reloj para indicar que también selecciona hora (solo para datetime-local) */}
          {type === "datetime-local" && (
            <div 
              className="absolute right-10 top-1/2 -translate-y-1/2 cursor-pointer z-10 hover:scale-110 transition-transform"
              onClick={() => {
                // Hacer clic en el input para abrir el selector de fecha y hora
                if (ref && 'current' in ref && ref.current) {
                  ref.current.showPicker?.();
                }
              }}
            >
              <Clock className="w-4 h-4 text-[var(--vc-text)]/40 hover:text-[var(--vc-text)]/60" />
            </div>
          )}
        </div>

        {/* Mensaje de ayuda con fecha formateada */}
        {value && !error && (
          <p className="text-xs text-[var(--vc-text)]/70 flex items-center gap-1.5">
            <span className="inline-block w-1 h-1 rounded-full bg-blue-500"></span>
            {formatDateForDisplay(value)}
          </p>
        )}

        {/* Mensaje de error */}
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {/* Mensaje de ayuda sobre el formato */}
        {!value && !error && (
          <p className="text-xs text-[var(--vc-text)]/50">
            {helpText || (type === "date" 
              ? "Selecciona tu fecha de nacimiento" 
              : "Selecciona una fecha y hora para tu cita")}
          </p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";
