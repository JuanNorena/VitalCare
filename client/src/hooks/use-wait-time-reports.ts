/**
 * @fileoverview Hooks personalizados para el manejo de reportes de tiempos de espera
 * 
 * Este archivo contiene hooks de React Query para la gestión eficiente de datos
 * de reportes, incluyendo caché, loading states y manejo de errores.
 * 
 * @version 1.0.0
 * @since 2025-01-30
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { 
  WaitTimeReportFilters,
  WaitTimeReportResponse,
  CompleteWaitTimeReportResponse,
  ReportMetadata,
  WaitTimeByBranch,
  WaitTimeByService,
  WaitTimeByServicePoint,
  WaitTimesSummary
} from "@/types/reports";

// =========================================================================
// CONFIGURACIÓN BASE
// =========================================================================

/** Tiempo de caché para queries de reportes (5 minutos) */
const REPORTS_CACHE_TIME = 5 * 60 * 1000;

/** Tiempo antes de considerar datos como obsoletos (2 minutos) */
const REPORTS_STALE_TIME = 2 * 60 * 1000;

/**
 * URL base para endpoints de reportes
 */
const REPORTS_API_BASE = "/api/reports/wait-times";

// =========================================================================
// FUNCIONES DE API
// =========================================================================

/**
 * Construye query string a partir de filtros
 */
function buildQueryString(filters: WaitTimeReportFilters): string {
  const params = new URLSearchParams();
  
  // Formatear las fechas correctamente
  let startDate = filters.startDate;
  let endDate = filters.endDate;
  
  // Si startDate y endDate son iguales (consulta de un solo día),
  // extender endDate hasta el día siguiente para incluir toda la jornada
  if (startDate === endDate) {
    try {
      // Parsear la fecha y agregar un día para el rango
      const startDateObj = new Date(startDate + 'T00:00:00');
      const endDateObj = addDays(startDateObj, 1);
      endDate = format(endDateObj, 'yyyy-MM-dd');
      
      // Log para debugging en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Reports] Single day query detected. Converting ${startDate} to range ${startDate} - ${endDate}`);
      }
    } catch (error) {
      // Si hay error en el parsing, mantener las fechas originales
      console.warn('Error parsing dates for single day query:', error);
    }
  }
  
  params.append('startDate', startDate);
  params.append('endDate', endDate);
  
  if (filters.branchId) {
    params.append('branchId', filters.branchId.toString());
  }
  
  if (filters.serviceId) {
    params.append('serviceId', filters.serviceId.toString());
  }
  
  if (filters.servicePointId) {
    params.append('servicePointId', filters.servicePointId.toString());
  }
  
  return params.toString();
}

/**
 * Realiza petición fetch con manejo de errores
 */
async function fetchWithErrorHandling<T>(url: string): Promise<T> {
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Obtiene reportes por sede
 */
async function fetchWaitTimesByBranch(filters: WaitTimeReportFilters): Promise<WaitTimeReportResponse<WaitTimeByBranch>> {
  const queryString = buildQueryString(filters);
  return fetchWithErrorHandling(`${REPORTS_API_BASE}/by-branch?${queryString}`);
}

/**
 * Obtiene reportes por servicio
 */
async function fetchWaitTimesByService(filters: WaitTimeReportFilters): Promise<WaitTimeReportResponse<WaitTimeByService>> {
  const queryString = buildQueryString(filters);
  return fetchWithErrorHandling(`${REPORTS_API_BASE}/by-service?${queryString}`);
}

/**
 * Obtiene reportes por punto de atención
 */
async function fetchWaitTimesByServicePoint(filters: WaitTimeReportFilters): Promise<WaitTimeReportResponse<WaitTimeByServicePoint>> {
  const queryString = buildQueryString(filters);
  return fetchWithErrorHandling(`${REPORTS_API_BASE}/by-service-point?${queryString}`);
}

/**
 * Obtiene resumen de reportes
 */
async function fetchWaitTimesSummary(filters: WaitTimeReportFilters): Promise<WaitTimeReportResponse<WaitTimesSummary>> {
  const queryString = buildQueryString(filters);
  return fetchWithErrorHandling(`${REPORTS_API_BASE}/summary?${queryString}`);
}

/**
 * Obtiene reporte completo
 */
async function fetchCompleteWaitTimesReport(filters: WaitTimeReportFilters): Promise<CompleteWaitTimeReportResponse> {
  const queryString = buildQueryString(filters);
  return fetchWithErrorHandling(`${REPORTS_API_BASE}/complete?${queryString}`);
}

/**
 * Obtiene metadatos para filtros
 */
async function fetchReportMetadata(): Promise<ReportMetadata> {
  return fetchWithErrorHandling(`${REPORTS_API_BASE}/metadata`);
}

// =========================================================================
// HOOKS DE REPORTES
// =========================================================================

/**
 * Hook para obtener reportes por sede
 * 
 * @param filters - Filtros para el reporte
 * @param options - Opciones adicionales de React Query
 * @returns Query con datos de reportes por sede
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useWaitTimesByBranch({
 *   startDate: '2025-01-01',
 *   endDate: '2025-01-31',
 *   branchId: 1
 * });
 * ```
 */
export function useWaitTimesByBranch(
  filters: WaitTimeReportFilters,
  options: { enabled?: boolean } = {}
): UseQueryResult<WaitTimeReportResponse<WaitTimeByBranch>, Error> {
  return useQuery<WaitTimeReportResponse<WaitTimeByBranch>, Error>({
    queryKey: ['waitTimesByBranch', filters],
    queryFn: () => fetchWaitTimesByBranch(filters),
    gcTime: REPORTS_CACHE_TIME,
    staleTime: REPORTS_STALE_TIME,
    enabled: options.enabled !== false && !!filters.startDate && !!filters.endDate,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook para obtener reportes por servicio
 * 
 * @param filters - Filtros para el reporte
 * @param options - Opciones adicionales de React Query
 * @returns Query con datos de reportes por servicio
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useWaitTimesByService({
 *   startDate: '2025-01-01',
 *   endDate: '2025-01-31',
 *   serviceId: 5
 * });
 * ```
 */
export function useWaitTimesByService(
  filters: WaitTimeReportFilters,
  options: { enabled?: boolean } = {}
): UseQueryResult<WaitTimeReportResponse<WaitTimeByService>, Error> {
  return useQuery<WaitTimeReportResponse<WaitTimeByService>, Error>({
    queryKey: ['waitTimesByService', filters],
    queryFn: () => fetchWaitTimesByService(filters),
    gcTime: REPORTS_CACHE_TIME,
    staleTime: REPORTS_STALE_TIME,
    enabled: options.enabled !== false && !!filters.startDate && !!filters.endDate,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook para obtener reportes por punto de atención
 * 
 * @param filters - Filtros para el reporte
 * @param options - Opciones adicionales de React Query
 * @returns Query con datos de reportes por punto de atención
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useWaitTimesByServicePoint({
 *   startDate: '2025-01-01',
 *   endDate: '2025-01-31',
 *   servicePointId: 3
 * });
 * ```
 */
export function useWaitTimesByServicePoint(
  filters: WaitTimeReportFilters,
  options: { enabled?: boolean } = {}
): UseQueryResult<WaitTimeReportResponse<WaitTimeByServicePoint>, Error> {
  return useQuery<WaitTimeReportResponse<WaitTimeByServicePoint>, Error>({
    queryKey: ['waitTimesByServicePoint', filters],
    queryFn: () => fetchWaitTimesByServicePoint(filters),
    gcTime: REPORTS_CACHE_TIME,
    staleTime: REPORTS_STALE_TIME,
    enabled: options.enabled !== false && !!filters.startDate && !!filters.endDate,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook para obtener resumen de reportes
 * 
 * @param filters - Filtros para el reporte
 * @param options - Opciones adicionales de React Query
 * @returns Query con datos de resumen de reportes
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useWaitTimesSummary({
 *   startDate: '2025-01-01',
 *   endDate: '2025-01-31'
 * });
 * ```
 */
export function useWaitTimesSummary(
  filters: WaitTimeReportFilters,
  options: { enabled?: boolean } = {}
): UseQueryResult<WaitTimeReportResponse<WaitTimesSummary>, Error> {
  return useQuery<WaitTimeReportResponse<WaitTimesSummary>, Error>({
    queryKey: ['waitTimesSummary', filters],
    queryFn: () => fetchWaitTimesSummary(filters),
    gcTime: REPORTS_CACHE_TIME,
    staleTime: REPORTS_STALE_TIME,
    enabled: options.enabled !== false && !!filters.startDate && !!filters.endDate,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook para obtener reporte completo
 * 
 * @param filters - Filtros para el reporte
 * @param options - Opciones adicionales de React Query
 * @returns Query con datos completos de reportes
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCompleteWaitTimesReport({
 *   startDate: '2025-01-01',
 *   endDate: '2025-01-31'
 * });
 * ```
 */
export function useCompleteWaitTimesReport(
  filters: WaitTimeReportFilters,
  options: { enabled?: boolean } = {}
): UseQueryResult<CompleteWaitTimeReportResponse, Error> {
  return useQuery<CompleteWaitTimeReportResponse, Error>({
    queryKey: ['completeWaitTimesReport', filters],
    queryFn: () => fetchCompleteWaitTimesReport(filters),
    gcTime: REPORTS_CACHE_TIME,
    staleTime: REPORTS_STALE_TIME,
    enabled: options.enabled !== false && !!filters.startDate && !!filters.endDate,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook para obtener metadatos de reportes
 * 
 * @param options - Opciones adicionales de React Query
 * @returns Query con metadatos para filtros
 * 
 * @example
 * ```tsx
 * const { data: metadata, isLoading } = useReportMetadata();
 * 
 * // Usar metadata.data.branches para poblar select de sedes
 * ```
 */
export function useReportMetadata(
  options: { enabled?: boolean } = {}
): UseQueryResult<ReportMetadata, Error> {
  return useQuery<ReportMetadata, Error>({
    queryKey: ['reportMetadata'],
    queryFn: fetchReportMetadata,
    gcTime: 10 * 60 * 1000, // 10 minutos para metadatos
    staleTime: 5 * 60 * 1000,  // 5 minutos
    enabled: options.enabled !== false,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// =========================================================================
// HOOKS UTILITARIOS
// =========================================================================

/**
 * Hook para validar filtros de reportes
 * 
 * Valida los filtros de reportes incluyendo fechas, rangos y otros parámetros.
 * Permite consultas de un solo día (startDate = endDate) ya que se manejan
 * automáticamente en buildQueryString.
 * 
 * @param filters - Filtros a validar
 * @returns Objeto con estado de validación
 * 
 * @example
 * ```tsx
 * const { isValid, errors } = useReportFiltersValidation(filters);
 * 
 * if (!isValid) {
 *   console.log('Errores:', errors);
 * }
 * ```
 */
export function useReportFiltersValidation(filters: Partial<WaitTimeReportFilters>) {
  const errors: string[] = [];
  
  // Validar fechas requeridas
  if (!filters.startDate) {
    errors.push('Fecha de inicio es requerida');
  }
  
  if (!filters.endDate) {
    errors.push('Fecha de fin es requerida');
  }
  
  // Validar rango de fechas
  if (filters.startDate && filters.endDate) {
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    
    if (isNaN(startDate.getTime())) {
      errors.push('Fecha de inicio inválida');
    }
    
    if (isNaN(endDate.getTime())) {
      errors.push('Fecha de fin inválida');
    }
    
    // Permitir fechas iguales para consultas de un solo día
    if (startDate > endDate) {
      errors.push('La fecha de inicio debe ser anterior o igual a la fecha de fin');
    }
    
    // Validar rango máximo (1 año)
    const maxRange = 365 * 24 * 60 * 60 * 1000;
    if ((endDate.getTime() - startDate.getTime()) > maxRange) {
      errors.push('El rango de fechas no puede ser mayor a 1 año');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Hook para generar claves de query predecibles
 * 
 * @param type - Tipo de reporte
 * @param filters - Filtros aplicados
 * @returns Clave de query estandarizada
 * 
 * @example
 * ```tsx
 * const queryKey = useReportQueryKey('by-branch', filters);
 * // Resultado: ['waitTimesByBranch', { startDate: '...', endDate: '...' }]
 * ```
 */
export function useReportQueryKey(
  type: 'by-branch' | 'by-service' | 'by-service-point' | 'summary' | 'complete',
  filters: WaitTimeReportFilters
): (string | WaitTimeReportFilters)[] {
  const typeMap = {
    'by-branch': 'waitTimesByBranch',
    'by-service': 'waitTimesByService', 
    'by-service-point': 'waitTimesByServicePoint',
    'summary': 'waitTimesSummary',
    'complete': 'completeWaitTimesReport'
  };
  
  return [typeMap[type], filters];
}
