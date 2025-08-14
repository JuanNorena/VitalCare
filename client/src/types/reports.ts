/**
 * @fileoverview Tipos y interfaces para el sistema de reportes de tiempos de espera
 * 
 * Este archivo contiene todas las definiciones de tipos necesarias para
 * el manejo de reportes de tiempos de espera, incluyendo filtros, datos
 * de respuesta y estructuras de métricas.
 * 
 * @version 1.0.0
 * @since 2025-01-30
 */

// =========================================================================
// TIPOS BASE Y FILTROS
// =========================================================================

/**
 * Filtros disponibles para reportes de tiempos de espera
 */
export interface WaitTimeReportFilters {
  /** Fecha de inicio del reporte (ISO string) */
  startDate: string;
  /** Fecha de fin del reporte (ISO string) */
  endDate: string;
  /** ID de sede (opcional) */
  branchId?: number;
  /** ID de servicio (opcional) */
  serviceId?: number;
  /** ID de punto de atención (opcional) */
  servicePointId?: number;
}

/**
 * Rango de fechas para filtros
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

// =========================================================================
// MÉTRICAS Y ESTADÍSTICAS
// =========================================================================

/**
 * Métricas básicas de tiempo (compatible con backend)
 */
export interface TimeMetrics {
  /** Tiempo promedio en minutos */
  average: number;
  /** Tiempo mediano en minutos */
  median: number;
  /** Tiempo mínimo en minutos */
  minimum: number;
  /** Tiempo máximo en minutos */
  maximum: number;
  /** Número total de registros */
  count: number;
}

/**
 * Métricas extendidas de tiempo de espera (para compatibilidad)
 * @deprecated Usar TimeMetrics en su lugar
 */
export interface WaitTimeMetrics {
  /** Tiempo promedio de espera en minutos */
  averageWaitTime: number;
  /** Tiempo mínimo de espera en minutos */
  minWaitTime: number;
  /** Tiempo máximo de espera en minutos */
  maxWaitTime: number;
  /** Mediana del tiempo de espera en minutos */
  medianWaitTime: number;
  /** Total de atenciones en el período */
  totalAttentions: number;
}

/**
 * Distribución de tiempos de espera por rangos
 */
export interface WaitTimeDistribution {
  /** Atenciones con tiempo <= 15 minutos */
  under15Minutes: number;
  /** Atenciones con tiempo entre 16-30 minutos */
  between15And30Minutes: number;
  /** Atenciones con tiempo entre 31-60 minutos */
  between30And60Minutes: number;
  /** Atenciones con tiempo > 60 minutos */
  over60Minutes: number;
}

// =========================================================================
// REPORTES POR ENTIDAD
// =========================================================================

/**
 * Reporte de tiempos de espera por sede (compatible con backend)
 */
export interface WaitTimeByBranch {
  /** ID de la sede */
  branchId: number;
  /** Nombre de la sede */
  branchName: string;
  /** Métricas de tiempo de espera */
  waitTime: TimeMetrics;
  /** Métricas de tiempo de servicio */
  serviceTime: TimeMetrics;
  /** Total de registros procesados */
  totalProcessed: number;
}

/**
 * Reporte de tiempos de espera por servicio (compatible con backend)
 */
export interface WaitTimeByService {
  /** ID del servicio */
  serviceId: number;
  /** Nombre del servicio */
  serviceName: string;
  /** ID de la sede del servicio */
  branchId: number;
  /** Nombre de la sede */
  branchName: string;
  /** Métricas de tiempo de espera */
  waitTime: TimeMetrics;
  /** Métricas de tiempo de servicio */
  serviceTime: TimeMetrics;
  /** Total de registros procesados */
  totalProcessed: number;
}

/**
 * Reporte de tiempos de espera por punto de atención (compatible con backend)
 */
export interface WaitTimeByServicePoint {
  /** ID del punto de atención */
  servicePointId: number;
  /** Nombre del punto de atención */
  servicePointName: string;
  /** ID de la sede */
  branchId: number;
  /** Nombre de la sede */
  branchName: string;
  /** Métricas de tiempo de espera */
  waitTime: TimeMetrics;
  /** Métricas de tiempo de servicio */
  serviceTime: TimeMetrics;
  /** Total de registros procesados */
  totalProcessed: number;
}

/**
 * Tendencia diaria de tiempos de espera
 */
export interface DailyWaitTimeTrend {
  /** Fecha (ISO string) */
  date: string;
  /** Tiempo promedio de espera del día */
  averageWaitTime: number;
  /** Total de atenciones del día */
  totalAttentions: number;
}

// =========================================================================
// RESUMEN GENERAL
// =========================================================================

/**
 * Resumen general de tiempos de espera
 */
export interface WaitTimesSummary {
  /** Métricas generales del período */
  overallMetrics: WaitTimeMetrics;
  /** Distribución general de tiempos */
  overallDistribution: WaitTimeDistribution;
  /** Tendencia diaria general */
  dailyTrend: DailyWaitTimeTrend[];
  /** Top 5 sedes con mejores tiempos */
  topPerformingBranches: Array<{
    branchId: number;
    branchName: string;
    averageWaitTime: number;
    totalAttentions: number;
  }>;
  /** Top 5 sedes con peores tiempos */
  poorPerformingBranches: Array<{
    branchId: number;
    branchName: string;
    averageWaitTime: number;
    totalAttentions: number;
  }>;
  /** Top 5 servicios con mejores tiempos */
  topPerformingServices: Array<{
    serviceId: number;
    serviceName: string;
    branchName: string;
    averageWaitTime: number;
    totalAttentions: number;
  }>;
  /** Estadísticas por hora del día */
  hourlyStats: Array<{
    hour: number;
    averageWaitTime: number;
    totalAttentions: number;
  }>;
}

// =========================================================================
// RESPUESTAS DE API
// =========================================================================

/**
 * Respuesta de la API para reportes individuales
 */
export interface WaitTimeReportResponse<T> {
  success: boolean;
  data: T[];
  filters: {
    dateRange: DateRange;
    branchId: number | null;
    serviceId: number | null;
    servicePointId: number | null;
  };
  metadata: {
    totalBranches?: number;
    totalServices?: number;
    totalServicePoints?: number;
    generatedAt: string;
  };
}

/**
 * Respuesta de la API para reporte completo
 */
export interface CompleteWaitTimeReportResponse {
  success: boolean;
  data: {
    byBranch: WaitTimeByBranch[];
    byService: WaitTimeByService[];
    byServicePoint: WaitTimeByServicePoint[];
    summary: WaitTimesSummary;
  };
  filters: {
    dateRange: DateRange;
    branchId: number | null;
    serviceId: number | null;
    servicePointId: number | null;
  };
  metadata: {
    totalBranches: number;
    totalServices: number;
    totalServicePoints: number;
    generatedAt: string;
  };
}

// =========================================================================
// METADATOS Y OPCIONES
// =========================================================================

/**
 * Opciones disponibles para filtros
 */
export interface ReportMetadata {
  success: boolean;
  data: {
    branches: BranchOption[];
    services: ServiceOption[];
    servicePoints: ServicePointOption[];
  };
  metadata: {
    totalBranches: number;
    totalServices: number;
    totalServicePoints: number;
    userRole: string;
    userBranchId: number | null;
    generatedAt: string;
  };
}

/**
 * Opción de sede para filtros
 */
export interface BranchOption {
  id: number;
  name: string;
  isActive: boolean;
}

/**
 * Opción de servicio para filtros
 */
export interface ServiceOption {
  id: number;
  name: string;
  isActive: boolean;
}

/**
 * Opción de punto de atención para filtros
 */
export interface ServicePointOption {
  id: number;
  name: string;
  branchId: number;
  branchName: string;
  isActive: boolean;
}

// =========================================================================
// ESTADO DE COMPONENTES
// =========================================================================

/**
 * Estado de carga de reportes
 */
export interface ReportLoadingState {
  /** Si está cargando datos */
  isLoading: boolean;
  /** Error si ocurrió */
  error: string | null;
  /** Si hay datos disponibles */
  hasData: boolean;
}

/**
 * Configuración de vista de reporte
 */
export interface ReportViewConfig {
  /** Tipo de vista activa */
  activeView: 'summary' | 'by-branch' | 'by-service' | 'by-service-point';
  /** Si mostrar gráficos */
  showCharts: boolean;
  /** Si mostrar tabla de datos */
  showTable: boolean;
  /** Período de refresco automático (en segundos) */
  autoRefreshInterval?: number;
}

/**
 * Parámetros para exportación de reportes
 */
export interface ExportParams extends WaitTimeReportFilters {
  /** Formato de exportación */
  format: 'pdf' | 'excel' | 'csv';
  /** Tipo de reporte a exportar */
  reportType: 'summary' | 'by-branch' | 'by-service' | 'by-service-point' | 'complete';
  /** Si incluir gráficos (solo PDF) */
  includeCharts?: boolean;
}
