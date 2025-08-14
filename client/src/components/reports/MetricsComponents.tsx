/**
 * @fileoverview Componentes de métricas para reportes de tiempos de espera
 * 
 * Este archivo contiene componentes para mostrar métricas y estadísticas
 * de tiempos de espera de manera visual y comprensible.
 * 
 * @version 1.0.0
 * @since 2025-01-30
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Clock, 
  Users, 
  Timer, 
  BarChart3, 
  Activity, 
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  HelpCircle
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { WaitTimeMetrics } from "@/types/reports";
import { TimeDisplay } from "@/components/ui/time-display";
import { minutesToHoursAndMinutes, generateTimeTooltipI18n } from "@/utils/reportsUtils";

// =========================================================================
// TIPOS E INTERFACES
// =========================================================================

/**
 * Props para el componente MetricsCard
 */
interface MetricsCardProps {
  /** Métricas a mostrar */
  metrics: WaitTimeMetrics;
  /** Título de la tarjeta */
  title?: string;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * Props para el componente MetricItem
 */
interface MetricItemProps {
  /** Icono del métrico */
  icon: React.ComponentType<{ className?: string }>;
  /** Etiqueta del métrico */
  label: string;
  /** Valor principal */
  value: string | number | React.ReactNode;
  /** Unidad de medida */
  unit?: string;
  /** Valor adicional o comparativo */
  subValue?: string;
  /** Tipo de tendencia */
  trend?: 'up' | 'down' | 'neutral';
  /** Color del métrico */
  color?: 'default' | 'success' | 'warning' | 'destructive';
  /** Texto del tooltip explicativo */
  tooltip?: string;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * Componente para mostrar tiempo con tooltip inline
 */
function TimeValue({ minutes }: { minutes: number }) {
  const { t } = useTranslation();
  const rounded = Math.round(minutes);
  const tooltipText = generateTimeTooltipI18n(minutes, t);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">{rounded}m</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// =========================================================================
// UTILIDADES
// =========================================================================

/**
 * Formatea tiempo en minutos a formato legible
 */
function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Obtiene el color basado en el tiempo de espera
 */
function getTimeColor(minutes: number): 'default' | 'success' | 'warning' | 'destructive' {
  if (minutes <= 15) return 'success';
  if (minutes <= 30) return 'default';
  if (minutes <= 60) return 'warning';
  return 'destructive';
}

/**
 * Calcula el porcentaje con formato
 */
function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

// =========================================================================
// COMPONENTES
// =========================================================================

/**
 * Componente individual para mostrar una métrica
 */
export function MetricItem({
  icon: Icon,
  label,
  value,
  unit = '',
  subValue,
  trend = 'neutral',
  color = 'default',
  tooltip,
  className
}: MetricItemProps) {
  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;
  
  const colorClasses = {
    default: 'text-foreground',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    destructive: 'text-red-600'
  };

  const metricContent = (
    <div className={cn("flex items-center space-x-3 p-3 rounded-lg border", className)}>
      <div className={cn("p-2 rounded-full bg-muted", colorClasses[color])}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-sm font-medium text-muted-foreground truncate">
            {label}
          </p>
          {tooltip && (
            <HelpCircle className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          <p className={cn("text-lg font-semibold", colorClasses[color])}>
            {value}{unit}
          </p>
          {trendIcon && React.createElement(trendIcon, {
            className: cn("h-4 w-4", colorClasses[color])
          })}
        </div>
        {subValue && (
          <p className="text-xs text-muted-foreground">
            {subValue}
          </p>
        )}
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {metricContent}
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="max-w-xs text-sm"
            sideOffset={5}
          >
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return metricContent;
}

/**
 * Tarjeta principal de métricas
 */
export function MetricsCard({ 
  metrics, 
  title,
  className 
}: {
  metrics: WaitTimeMetrics;
  title?: string;
  className?: string;
}) {
  const { t } = useTranslation();

  const averageColor = getTimeColor(metrics.averageWaitTime);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title || t('reports.metrics.title')}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Métricas Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <MetricItem
            icon={Clock}
            label={t('reports.metrics.averageWaitTime')}
            value={<TimeValue minutes={metrics.averageWaitTime} />}
            color={averageColor}
            tooltip={t('reports.metrics.tooltips.averageWaitTime')}
          />
          
          <MetricItem
            icon={Users}
            label={t('reports.metrics.totalAttentions')}
            value={metrics.totalAttentions.toLocaleString()}
            tooltip={t('reports.metrics.tooltips.totalAttentions')}
          />
          
          <MetricItem
            icon={Timer}
            label={t('reports.metrics.medianWaitTime')}
            value={<TimeValue minutes={metrics.medianWaitTime} />}
            subValue={`${t('reports.metrics.range')}: ${formatTime(metrics.minWaitTime)} - ${formatTime(metrics.maxWaitTime)}`}
            tooltip={t('reports.metrics.tooltips.medianWaitTime')}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Componente de tarjeta métrica rápida con tooltip
 */
function QuickMetricCard({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  tooltip 
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | React.ReactNode;
  color: string;
  tooltip?: string;
}) {
  const cardContent = (
    <Card className="p-3 md:p-4">
      <div className="flex items-center space-x-2">
        <Icon className={`h-4 w-4 ${color} flex-shrink-0`} />
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground truncate">
              {label}
            </p>
            {tooltip && (
              <HelpCircle className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
            )}
          </div>
          <p className={`text-base md:text-lg font-semibold ${color}`}>
            {value}
          </p>
        </div>
      </div>
    </Card>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="max-w-xs text-sm"
            sideOffset={5}
          >
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}

/**
 * Componente de resumen rápido de métricas
 */
export function QuickMetricsSummary({ 
  metrics, 
  className 
}: { 
  metrics: WaitTimeMetrics; 
  className?: string; 
}) {
  const { t } = useTranslation();

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4", className)}>
      <QuickMetricCard
        icon={Clock}
        label={t('reports.quick.avgTime')}
        value={<TimeValue minutes={metrics.averageWaitTime} />}
        color="text-green-600"
        tooltip={t('reports.metrics.tooltips.averageWaitTime')}
      />

      <QuickMetricCard
        icon={Users}
        label={t('reports.quick.totalAttentions')}
        value={metrics.totalAttentions.toLocaleString()}
        color="text-purple-600"
        tooltip={t('reports.metrics.tooltips.totalAttentions')}
      />

      <QuickMetricCard
        icon={Timer}
        label={t('reports.quick.medianTime')}
        value={<TimeValue minutes={metrics.medianWaitTime} />}
        color="text-blue-600"
        tooltip={t('reports.metrics.tooltips.medianWaitTime')}
      />
    </div>
  );
}
