/**
 * @fileoverview Utilidades para transformación de datos de reportes
 * 
 * Este archivo contiene funciones utilitarias para transformar datos
 * entre diferentes formatos utilizados en los reportes de tiempo de espera.
 * 
 * @version 1.0.0
 * @since 2025-01-30
 */

import { TimeMetrics, WaitTimeMetrics } from "@/types/reports";

/**
 * Transforma TimeMetrics del backend a WaitTimeMetrics para compatibilidad con componentes existentes
 * 
 * @param timeMetrics - Métricas de tiempo del backend
 * @returns Métricas transformadas para los componentes frontend
 */
export function transformTimeMetricsToWaitTimeMetrics(timeMetrics: TimeMetrics): WaitTimeMetrics {
  return {
    averageWaitTime: timeMetrics.average,
    minWaitTime: timeMetrics.minimum,
    maxWaitTime: timeMetrics.maximum,
    medianWaitTime: timeMetrics.median,
    totalAttentions: timeMetrics.count
  };
}

/**
 * Convierte minutos a formato horas y minutos
 * 
 * @param minutes - Tiempo en minutos
 * @returns Objeto con horas y minutos
 */
export function minutesToHoursAndMinutes(minutes: number): { hours: number; minutes: number } {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return { hours, minutes: remainingMinutes };
}

/**
 * Formatea tiempo en minutos a texto legible
 * 
 * @param minutes - Tiempo en minutos
 * @param showMinutesLabel - Si mostrar la etiqueta "m" al final
 * @returns Tiempo formateado como string
 */
export function formatTimeToText(minutes: number, showMinutesLabel: boolean = true): string {
  const { hours, minutes: mins } = minutesToHoursAndMinutes(minutes);
  
  if (hours === 0) {
    return showMinutesLabel ? `${mins}m` : `${mins}`;
  }
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}m`;
}

/**
 * Genera el contenido del tooltip para mostrar conversión de tiempo
 * 
 * @param minutes - Tiempo en minutos
 * @returns Texto del tooltip con información detallada
 */
export function generateTimeTooltip(minutes: number): string {
  const { hours, minutes: mins } = minutesToHoursAndMinutes(minutes);
  const rounded = Math.round(minutes);
  
  if (hours === 0) {
    return `${rounded} minutos`;
  }
  
  if (mins === 0) {
    return `${rounded} minutos (${hours} hora${hours > 1 ? 's' : ''})`;
  }
  
  return `${rounded} minutos (${hours} hora${hours > 1 ? 's' : ''} y ${mins} minuto${mins > 1 ? 's' : ''})`;
}

/**
 * Genera el contenido del tooltip internacionalizado para mostrar conversión de tiempo
 * 
 * @param minutes - Tiempo en minutos
 * @param t - Función de traducción de react-i18next
 * @returns Texto del tooltip con información detallada e internacionalizada
 */
export function generateTimeTooltipI18n(minutes: number, t: (key: string) => string): string {
  const { hours, minutes: mins } = minutesToHoursAndMinutes(minutes);
  const rounded = Math.round(minutes);
  
  if (hours === 0) {
    const minuteText = rounded === 1 ? t('common.minute') : t('common.minutes');
    return `${rounded} ${minuteText}`;
  }
  
  if (mins === 0) {
    const minuteText = rounded === 1 ? t('common.minute') : t('common.minutes');
    const hourText = hours === 1 ? t('common.hour') : t('common.hours');
    return `${rounded} ${minuteText} (${hours} ${hourText})`;
  }
  
  const minuteText = rounded === 1 ? t('common.minute') : t('common.minutes');
  const hourText = hours === 1 ? t('common.hour') : t('common.hours');
  const minutePartText = mins === 1 ? t('common.minute') : t('common.minutes');
  const andText = t('common.and');
  
  return `${rounded} ${minuteText} (${hours} ${hourText} ${andText} ${mins} ${minutePartText})`;
}

/**
 * Formatea tiempo en minutos para gráficos (versión simplificada)
 */
function formatTimeForChart(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  return `${Math.round(minutes / 60 * 10) / 10}h`;
}

/**
 * Transforma TimeMetrics del backend a texto formateado para mostrar en gráficos
 */
export function formatTimeMetrics(metrics: TimeMetrics): string {
  return `Promedio: ${formatTimeForChart(metrics.average)}, Min: ${formatTimeForChart(metrics.minimum)}, Max: ${formatTimeForChart(metrics.maximum)}`;
}
