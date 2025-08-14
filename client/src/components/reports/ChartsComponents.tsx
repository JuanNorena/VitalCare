/**
 * @fileoverview Componentes de gráficos para reportes de tiempos de espera
 * 
 * Este archivo contiene componentes de gráficos interactivos usando Recharts
 * para visualizar datos de tiempos de espera de manera clara y atractiva.
 * 
 * @version 1.0.0
 * @since 2025-01-30
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from "recharts";
import { format, parseISO } from "date-fns";
import { generateTimeTooltipI18n } from "@/utils/reportsUtils";
import { es } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { 
  DailyWaitTimeTrend, 
  WaitTimeDistribution,
  WaitTimeByBranch,
  WaitTimeByService,
  WaitTimesSummary,
  TimeMetrics
} from "@/types/reports";
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

// =========================================================================
// TIPOS E INTERFACES
// =========================================================================

/**
 * Props para el componente TrendChart
 */
interface TrendChartProps {
  /** Datos de tendencia diaria */
  data: DailyWaitTimeTrend[];
  /** Título del gráfico */
  title?: string;
  /** Altura del gráfico */
  height?: number;
  /** Si mostrar área bajo la línea */
  showArea?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * Props para el componente DistributionPieChart
 */
interface DistributionPieChartProps {
  /** Datos de distribución */
  distribution: WaitTimeDistribution;
  /** Título del gráfico */
  title?: string;
  /** Altura del gráfico */
  height?: number;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * Props para el componente ComparisonBarChart
 */
interface ComparisonBarChartProps {
  /** Datos para comparar (sedes, servicios, etc.) */
  data: Array<{
    name: string;
    averageWaitTime: number;
    totalAttentions: number;
  }>;
  /** Título del gráfico */
  title?: string;
  /** Altura del gráfico */
  height?: number;
  /** Tipo de datos mostrados */
  dataType?: 'branch' | 'service' | 'servicePoint';
  /** Clase CSS adicional */
  className?: string;
}

/**
 * Props para el componente HourlyStatsChart
 */
interface HourlyStatsChartProps {
  /** Datos por hora */
  data: Array<{
    hour: number;
    averageWaitTime: number;
    totalAttentions: number;
  }>;
  /** Título del gráfico */
  title?: string;
  /** Altura del gráfico */
  height?: number;
  /** Clase CSS adicional */
  className?: string;
}

// =========================================================================
// CONSTANTES Y CONFIGURACIÓN
// =========================================================================

/** Colores para los gráficos */
const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  gray: '#6b7280'
};

/** Colores para distribución de tiempos */
const DISTRIBUTION_COLORS = [
  '#10b981', // Verde para <= 15 min
  '#3b82f6', // Azul para 15-30 min
  '#f59e0b', // Amarillo para 30-60 min
  '#ef4444'  // Rojo para > 60 min
];

// =========================================================================
// UTILIDADES
// =========================================================================

/**
 * Formatea tiempo en minutos para gráficos
 */
function formatTimeForChart(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  return `${Math.round(minutes / 60 * 10) / 10}h`;
}

/**
 * Formatea fecha para ejes de gráficos
 */
function formatDateForChart(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM d', { locale: es });
  } catch {
    return dateString;
  }
}

/**
 * Tooltip personalizado para gráficos de tiempo
 */
function CustomTimeTooltip({ active, payload, label }: any) {
  const { t } = useTranslation();
  
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} style={{ color: entry.color }}>
            <p className="font-medium">
              {entry.name}: {formatTimeForChart(entry.value)}
            </p>
            <p className="text-sm text-gray-600">
              {generateTimeTooltipI18n(entry.value, t)}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// =========================================================================
// COMPONENTES DE GRÁFICOS
// =========================================================================

/**
 * Gráfico de tendencia temporal de tiempos de espera
 */
export function TrendChart({ 
  data, 
  title, 
  height = 300,
  showArea = false,
  className 
}: TrendChartProps) {
  const { t } = useTranslation();

  const chartData = data.map(item => ({
    ...item,
    date: formatDateForChart(item.date),
    formattedTime: formatTimeForChart(item.averageWaitTime)
  }));

  const ChartComponent = showArea ? AreaChart : LineChart;
  const DataComponent = showArea ? Area : Line;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title || t('reports.charts.trend.title')}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ChartComponent data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={formatTimeForChart}
            />
            <Tooltip content={<CustomTimeTooltip />} />
            <Legend />
            {showArea ? (
              <Area
                type="monotone"
                dataKey="averageWaitTime"
                stroke={CHART_COLORS.primary}
                fill={`${CHART_COLORS.primary}20`}
                strokeWidth={2}
                name={t('reports.charts.trend.averageTime')}
              />
            ) : (
              <Line
                type="monotone"
                dataKey="averageWaitTime"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                name={t('reports.charts.trend.averageTime')}
                dot={{ fill: CHART_COLORS.primary, strokeWidth: 2, r: 4 }}
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Gráfico circular de distribución de tiempos
 */
export function DistributionPieChart({ 
  distribution, 
  title, 
  height = 300,
  className 
}: DistributionPieChartProps) {
  const { t } = useTranslation();

  const data = [
    {
      name: t('reports.distribution.under15'),
      value: distribution.under15Minutes,
      color: DISTRIBUTION_COLORS[0]
    },
    {
      name: t('reports.distribution.between15And30'),
      value: distribution.between15And30Minutes,
      color: DISTRIBUTION_COLORS[1]
    },
    {
      name: t('reports.distribution.between30And60'),
      value: distribution.between30And60Minutes,
      color: DISTRIBUTION_COLORS[2]
    },
    {
      name: t('reports.distribution.over60'),
      value: distribution.over60Minutes,
      color: DISTRIBUTION_COLORS[3]
    }
  ].filter(item => item.value > 0); // Solo mostrar categorías con datos

  const renderCustomLabel = ({ name, value, percent }: any) => {
    return `${name}: ${(percent * 100).toFixed(1)}%`;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          {title || t('reports.charts.distribution.title')}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [
                `${value.toLocaleString()} atenciones`,
                name
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Gráfico de barras para comparación entre entidades
 */
export function ComparisonBarChart({ 
  data, 
  title, 
  height = 300,
  dataType = 'branch',
  className 
}: ComparisonBarChartProps) {
  const { t } = useTranslation();

  const chartData = data.map(item => ({
    ...item,
    formattedTime: formatTimeForChart(item.averageWaitTime)
  }));

  const getTitle = () => {
    if (title) return title;
    switch (dataType) {
      case 'branch': return t('reports.charts.comparison.byBranch');
      case 'service': return t('reports.charts.comparison.byService');
      case 'servicePoint': return t('reports.charts.comparison.byServicePoint');
      default: return t('reports.charts.comparison.title');
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {getTitle()}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} margin={{ bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={formatTimeForChart}
            />
            <Tooltip content={<CustomTimeTooltip />} />
            <Legend />
            <Bar 
              dataKey="averageWaitTime" 
              fill={CHART_COLORS.primary}
              name={t('reports.charts.comparison.averageTime')}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Gráfico de estadísticas por hora del día
 */
export function HourlyStatsChart({ 
  data, 
  title, 
  height = 300,
  className 
}: HourlyStatsChartProps) {
  const { t } = useTranslation();

  const chartData = data.map(item => ({
    ...item,
    hour: `${item.hour.toString().padStart(2, '0')}:00`,
    formattedTime: formatTimeForChart(item.averageWaitTime)
  }));

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {title || t('reports.charts.hourly.title')}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="hour" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="time"
              orientation="left"
              tick={{ fontSize: 12 }}
              tickFormatter={formatTimeForChart}
            />
            <YAxis 
              yAxisId="count"
              orientation="right"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === t('reports.charts.hourly.averageTime')) {
                  return [formatTimeForChart(value), name];
                }
                return [value.toLocaleString(), name];
              }}
            />
            <Legend />
            <Area
              yAxisId="time"
              type="monotone"
              dataKey="averageWaitTime"
              stackId="1"
              stroke={CHART_COLORS.primary}
              fill={`${CHART_COLORS.primary}30`}
              name={t('reports.charts.hourly.averageTime')}
            />
            <Bar 
              yAxisId="count"
              dataKey="totalAttentions" 
              fill={CHART_COLORS.secondary}
              name={t('reports.charts.hourly.totalAttentions')}
              opacity={0.7}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Dashboard de gráficos múltiples
 */
export function ChartsGrid({ 
  summary,
  trendData,
  comparisonData,
  className 
}: {
  summary: WaitTimesSummary;
  trendData: DailyWaitTimeTrend[];
  comparisonData: Array<{
    name: string;
    averageWaitTime: number;
    totalAttentions: number;
  }>;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6", className)}>
      {/* Tendencia Temporal */}
      <TrendChart 
        data={trendData}
        showArea={true}
        height={250}
      />

      {/* Comparación entre Entidades */}
      <ComparisonBarChart 
        data={comparisonData}
        height={250}
      />

      {/* Estadísticas por Hora */}
      <HourlyStatsChart 
        data={summary.hourlyStats}
        height={250}
      />
    </div>
  );
}