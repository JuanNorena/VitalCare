/**
 * @fileoverview Componente para mostrar tiempo con tooltip de conversión
 * 
 * Componente que muestra tiempo en minutos con un tooltip que explica
 * la conversión a horas y minutos cuando se pasa el cursor sobre él.
 * 
 * @version 1.0.0
 * @since 2025-01-30
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { generateTimeTooltipI18n } from "@/utils/reportsUtils";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface TimeDisplayProps {
  /** Tiempo en minutos */
  minutes: number;
  /** Variante del badge */
  variant?: "default" | "secondary" | "destructive" | "outline";
  /** Clases CSS adicionales */
  className?: string;
  /** Color del badge personalizado */
  colorClasses?: string;
}

/**
 * Componente para mostrar tiempo con tooltip de conversión
 * 
 * @param props - Propiedades del componente
 * @returns Elemento JSX con badge y tooltip
 * 
 * @example
 * ```tsx
 * <TimeDisplay 
 *   minutes={304} 
 *   colorClasses="bg-green-100 text-green-700"
 * />
 * ```
 */
export function TimeDisplay({ 
  minutes, 
  variant = "secondary", 
  className,
  colorClasses 
}: TimeDisplayProps) {
  const { t } = useTranslation();
  const roundedMinutes = Math.round(minutes);
  const tooltipContent = generateTimeTooltipI18n(minutes, t);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge 
            variant={variant} 
            className={cn(
              "text-xs md:text-sm flex-shrink-0 ml-2 cursor-help",
              colorClasses,
              className
            )}
          >
            {roundedMinutes}m
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default TimeDisplay;
